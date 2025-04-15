import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('=== Starting Build Process ===\n');

// 1. Clean deploy directory
console.log('1. Cleaning deploy directory');
try {
    if (await fs.access('deploy') === 0) {
        await fs.rm('deploy', { recursive: true, force: true });
    }
    await fs.mkdir('deploy/dist', { recursive: true });
    console.log('✓ Removed existing deploy directory');
    console.log('✓ Created fresh deploy/dist directory\n');
} catch (error) {
    console.error('Error cleaning deploy directory:', error);
    process.exit(1);
}

// 2. Compile TypeScript files
console.log('2. Compiling TypeScript files');
try {
    // Compile all TypeScript files using tsconfig.json
    await execAsync('tsc -p tsconfig.json', { stdio: 'inherit' });
    console.log('✓ TypeScript compilation completed\n');

    // Remove tests directory from deploy/dist
    const testsPath = path.join(process.cwd(), 'deploy/dist/tests');
    if (await fs.access(testsPath).then(() => true).catch(() => false)) {
        await fs.rm(testsPath, { recursive: true, force: true });
        console.log('✓ Removed tests directory from deployment\n');
    }
} catch (error) {
    console.error('Error compiling TypeScript:', error);
    process.exit(1);
}

// 3. Copy non-TypeScript files and directories
console.log('3. Copying non-TypeScript files and directories');
try {
    const srcPath = path.join(process.cwd(), 'src');
    const deployDistPath = path.join(process.cwd(), 'deploy/dist');

    async function copyNonTsFiles(srcDir, destDir) {
        try {
            // Create the destination directory if it doesn't exist
            await fs.mkdir(destDir, { recursive: true });
            
            const entries = await fs.readdir(srcDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(srcDir, entry.name);
                const destPath = path.join(destDir, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip node_modules and other unnecessary directories
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'tests') {
                        continue;
                    }
                    
                    // Recursively copy the directory contents
                    await copyNonTsFiles(srcPath, destPath);
                } else {
                    // Skip test files, TypeScript files, and .DS_Store files
                    if (!entry.name.endsWith('.test.ts') && 
                        !entry.name.endsWith('.test.js') && 
                        entry.name !== '.DS_Store') {
                        // For TypeScript files, store the .js version in deploy structure
                        const fileName = entry.name.endsWith('.ts') ? 
                            destPath.replace(/\.ts$/, '.js') : 
                            destPath;
                        await fs.copyFile(srcPath, destPath);
                        console.log(`✓ Copied: ${entry.name}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error copying files:', error);
            throw error;
        }
    }

    // Copy data and images directories
    // Skip data directory as it's not needed in deployment
    // const dataSrcPath = path.join(srcPath, 'data');
    // const dataDestPath = path.join(deployDistPath, 'data');
    // await copyNonTsFiles(dataSrcPath, dataDestPath);

    const imagesSrcPath = path.join(srcPath, 'images');
    const imagesDestPath = path.join(deployDistPath, 'images');
    await copyNonTsFiles(imagesSrcPath, imagesDestPath);

    console.log('✓ Non-TypeScript files copied successfully\n');
} catch (error) {
    console.error('Error copying non-TypeScript files:', error);
    process.exit(1);
}

// 4. Copy package files
console.log('4. Copying package files');
try {
    // Create a backup of the original package.json
    const originalPackageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    // Create a new package.json for deployment
    const deployPackageJson = {
        ...originalPackageJson,
        scripts: {
            start: "node server.js"
        },
        devDependencies: undefined
    };

    // Write the new package.json
    await fs.writeFile('deploy/dist/package.json', JSON.stringify(deployPackageJson, null, 2));
    console.log('✓ Package files copied successfully\n');
} catch (error) {
    console.error('Error copying package files:', error);
    process.exit(1);
}

// 5. Compare structures
console.log('5. Comparing src and deploy/dist structures');
try {
    const srcPath = path.join(process.cwd(), 'src');
    const deployDistPath = path.join(process.cwd(), 'deploy/dist');

    // Function to get directory structure
    const getStructure = async (dir) => {
        const structure = {
            files: [],
            dirs: []
        };

        const traverse = async (currentDir, relativePath = '') => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const newRelativePath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules, test directories, and other unnecessary directories
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'tests') {
                        continue;
                    }
                    structure.dirs.push(newRelativePath);
                    await traverse(fullPath, newRelativePath);
                } else {
                    // Skip test files, TypeScript files, and .DS_Store files
                    if (!entry.name.endsWith('.test.ts') && 
                        !entry.name.endsWith('.test.js') && 
                        entry.name !== '.DS_Store') {
                        // For TypeScript files, store the .js version in deploy structure
                        const fileName = entry.name.endsWith('.ts') ? 
                            newRelativePath.replace(/\.ts$/, '.js') : 
                            newRelativePath;
                        structure.files.push(fileName);
                    }
                }
            }
        };

        await traverse(dir);
        return structure;
    };

    // Compare structures
    const srcStructure = await getStructure(srcPath);
    const deployStructure = await getStructure(deployDistPath);

    // Check for missing files and directories
    const missingFiles = srcStructure.files.filter(file => !deployStructure.files.includes(file));
    const missingDirs = srcStructure.dirs.filter(dir => !deployStructure.dirs.includes(dir));

    if (missingFiles.length > 0 || missingDirs.length > 0) {
        if (missingFiles.length > 0) {
            console.log('❌ Missing files in deploy:', missingFiles.join(', '));
        }
        if (missingDirs.length > 0) {
            console.log('❌ Missing directories in deploy:', missingDirs.join(', '));
        }
        throw new Error('Structure mismatch between src and deploy/dist');
    }

    console.log('✓ Structure comparison passed\n');
} catch (error) {
    console.error('Error comparing structures:', error);
    process.exit(1);
}

console.log('✓ Build completed successfully'); 