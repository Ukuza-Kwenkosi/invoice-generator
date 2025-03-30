// build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the source and destination directories
const frontendDir = path.join(__dirname, '..'); // Move one level up to frontend
const distDir = path.join(frontendDir, 'deploy/dist'); // Create dist in the deploy directory
const publicDir = path.join(frontendDir, 'public'); // Path to public directory

// Function to ensure directory exists
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Create the dist directory if it doesn't exist
ensureDirectoryExists(distDir);

// Compile TypeScript files
console.log('Compiling TypeScript files...');
try {
    execSync('npm run build:ts', { stdio: 'inherit' });
    console.log('TypeScript compilation completed successfully');
} catch (error) {
    console.error('TypeScript compilation failed:', error);
    process.exit(1);
}

// Function to copy files and directories
function copyFiles(src, dest) {
    try {
        if (fs.lstatSync(src).isDirectory()) {
            ensureDirectoryExists(dest);
            
            // Read the contents of the directory
            fs.readdirSync(src).forEach(file => {
                const srcFile = path.join(src, file);
                const destFile = path.join(dest, file);
                copyFiles(srcFile, destFile);
            });
        } else {
            // Skip TypeScript files and source maps as they are handled by tsc
            if (!src.endsWith('.ts') && !src.endsWith('.map')) {
                fs.copyFileSync(src, dest);
                console.log(`Copied ${path.relative(frontendDir, src)} to ${path.relative(frontendDir, dest)}`);
            }
        }
    } catch (error) {
        console.error(`Error copying ${src} to ${dest}:`, error);
    }
}

// Copy contents from the public directory to the dist directory
console.log('\nCopying public files...');
if (fs.existsSync(publicDir)) {
    // Copy all directories except js
    fs.readdirSync(publicDir).forEach(file => {
        const publicFilePath = path.join(publicDir, file);
        const destFilePath = path.join(distDir, file);
        
        // Skip the js directory as it's handled by TypeScript compilation
        if (file !== 'js') {
            copyFiles(publicFilePath, destFilePath);
        }
    });

    // Copy client-side JavaScript files
    const jsSrc = path.join(publicDir, 'js');
    const jsDest = path.join(distDir, 'js');
    if (fs.existsSync(jsSrc)) {
        fs.readdirSync(jsSrc).forEach(file => {
            if (file.endsWith('.js') && !file.endsWith('.test.js')) {
                const srcFile = path.join(jsSrc, file);
                const destFile = path.join(jsDest, file);
                ensureDirectoryExists(jsDest);
                fs.copyFileSync(srcFile, destFile);
                console.log(`Copied ${path.relative(frontendDir, srcFile)} to ${path.relative(frontendDir, destFile)}`);
            }
        });
    }
} else {
    console.warn(`Public directory ${publicDir} does not exist.`);
}

// Create a basic health check file
const healthCheckContent = `{
    "status": "ok",
    "version": "${require('../package.json').version}",
    "timestamp": "${new Date().toISOString()}"
}`;
fs.writeFileSync(path.join(distDir, 'health.json'), healthCheckContent);

console.log('\nBuild completed successfully!');