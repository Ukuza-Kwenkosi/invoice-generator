const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Clean deploy directory
function cleanDeploy() {
    console.log('\n1. Cleaning deploy directory');
    const deployDir = path.join(__dirname, 'deploy');
    if (fs.existsSync(deployDir)) {
        fs.rmSync(deployDir, { recursive: true, force: true });
        console.log('✓ Removed existing deploy directory');
    }
    fs.mkdirSync(path.join(deployDir, 'dist'), { recursive: true });
    console.log('✓ Created fresh deploy/dist directory');
}

// Compile TypeScript files
function compileTypeScript() {
    console.log('\n2. Compiling TypeScript');
    require('child_process').execSync('tsc --project tsconfig.json', { stdio: 'inherit' });
}

// Compile EJS templates to HTML
function compileEjsTemplates() {
    console.log('\n2. Compiling EJS templates to HTML');
    const publicDir = path.join(__dirname, 'public');
    const distDir = path.join(__dirname, 'deploy', 'dist');
    const viewsDir = path.join(publicDir, 'views');
    const distViewsDir = path.join(distDir, 'views');
    
    // Create views directory if it doesn't exist
    if (!fs.existsSync(distViewsDir)) {
        fs.mkdirSync(distViewsDir, { recursive: true });
    }
    
    // Compile index.ejs to root index.html
    console.log('Compiling index.ejs to root index.html...');
    try {
        const indexEjs = fs.readFileSync(path.join(viewsDir, 'index.ejs'), 'utf8');
        const indexHtml = ejs.render(indexEjs, {
            filename: path.join(viewsDir, 'index.ejs'),
            root: viewsDir
        });
        fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
        console.log('✓ Compiled index.ejs -> index.html');
    } catch (err) {
        console.error('Error compiling index.ejs:', err);
        throw err;
    }
    
    // Compile other EJS files to HTML
    console.log('\nCompiling other EJS templates...');
    fs.readdirSync(viewsDir, { withFileTypes: true })
        .filter(f => !f.isDirectory() && f.name !== 'index.ejs' && f.name.endsWith('.ejs'))
        .forEach(file => {
            try {
                const ejsPath = path.join(viewsDir, file.name);
                const ejsContent = fs.readFileSync(ejsPath, 'utf8');
                const htmlContent = ejs.render(ejsContent, {
                    filename: ejsPath,
                    root: viewsDir
                });
                const htmlFile = file.name.replace('.ejs', '.html');
                fs.writeFileSync(path.join(distViewsDir, htmlFile), htmlContent);
                console.log(`✓ Compiled ${file.name} -> ${htmlFile}`);
            } catch (err) {
                console.error(`Error compiling ${file.name}:`, err);
                throw err;
            }
        });
}

// Copy static files (excluding EJS files)
function copyStaticFiles() {
    console.log('\n3. Copying static files');
    const publicDir = path.join(__dirname, 'public');
    const distDir = path.join(__dirname, 'deploy', 'dist');
    
    // Copy static assets
    ['css', 'images'].forEach(dir => {
        const srcDir = path.join(publicDir, dir);
        const destDir = path.join(distDir, dir);
        
        if (fs.existsSync(srcDir)) {
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.readdirSync(srcDir, { withFileTypes: true })
                .filter(f => !f.isDirectory())
                .forEach(file => {
                    fs.copyFileSync(
                        path.join(srcDir, file.name),
                        path.join(destDir, file.name)
                    );
                    console.log(`✓ Copied ${dir}/${file.name}`);
                });
        }
    });
}

// Validate the build output
function validateBuild() {
    console.log('\n4. Validating build output');
    const publicDir = path.join(__dirname, 'public');
    const distDir = path.join(__dirname, 'deploy', 'dist');

    // Validate directory structure exists
    console.log('\nValidating directory structure:');
    ['js', 'views', 'css', 'images'].forEach(dir => {
        const distDirPath = path.join(distDir, dir);
        if (!fs.existsSync(distDirPath)) {
            throw new Error(`Missing directory in dist: ${dir}/`);
        }
        console.log(`✓ Directory exists: ${dir}/`);
    });

    // Validate TypeScript compilation
    console.log('\nValidating TypeScript output:');
    function validateTypeScriptDir(srcDir, distDir, relativePath = '') {
        const srcFiles = fs.readdirSync(srcDir, { withFileTypes: true });
        
        srcFiles.forEach(entry => {
            const relativeEntryPath = path.join(relativePath, entry.name);
            const srcPath = path.join(srcDir, entry.name);
            const distPath = path.join(distDir, entry.name.replace('.ts', '.js'));
            
            if (entry.isDirectory()) {
                const distSubDir = path.join(distDir, entry.name);
                if (!fs.existsSync(distSubDir)) {
                    throw new Error(`Missing compiled directory: ${relativeEntryPath}/`);
                }
                console.log(`✓ Directory structure maintained: ${relativeEntryPath}/`);
                validateTypeScriptDir(srcPath, distSubDir, relativeEntryPath);
            } else if (entry.name.endsWith('.ts')) {
                if (!fs.existsSync(distPath)) {
                    throw new Error(`Missing compiled file: ${relativeEntryPath.replace('.ts', '.js')}`);
                }
                console.log(`✓ ${relativeEntryPath} -> ${relativeEntryPath.replace('.ts', '.js')}`);
            }
        });
    }
    validateTypeScriptDir(
        path.join(publicDir, 'js'),
        path.join(distDir, 'js')
    );

    // Validate EJS compilation
    console.log('\nValidating EJS output:');
    const viewsDir = path.join(publicDir, 'views');
    const distViewsDir = path.join(distDir, 'views');

    // First validate index.ejs -> index.html in root
    const indexEjsPath = path.join(viewsDir, 'index.ejs');
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexEjsPath)) {
        throw new Error('Missing source file: views/index.ejs');
    }
    if (!fs.existsSync(indexHtmlPath)) {
        throw new Error('Missing compiled file: index.html in root directory');
    }
    console.log('✓ views/index.ejs -> index.html (in root)');

    // Then validate other EJS files in views directory
    fs.readdirSync(viewsDir, { withFileTypes: true })
        .filter(f => !f.isDirectory() && f.name !== 'index.ejs' && f.name.endsWith('.ejs'))
        .forEach(file => {
            const htmlFile = file.name.replace('.ejs', '.html');
            const htmlPath = path.join(distViewsDir, htmlFile);
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`Missing compiled file: views/${htmlFile}`);
            }
            console.log(`✓ views/${file.name} -> views/${htmlFile}`);
        });

    // Validate static assets
    console.log('\nValidating static assets:');
    ['css', 'images'].forEach(dir => {
        const srcDir = path.join(publicDir, dir);
        const destDir = path.join(distDir, dir);
        
        if (fs.existsSync(srcDir)) {
            function validateStaticDir(srcPath, destPath, relativePath = '') {
                fs.readdirSync(srcPath, { withFileTypes: true }).forEach(entry => {
                    const relativeEntryPath = path.join(relativePath, entry.name);
                    const srcFilePath = path.join(srcPath, entry.name);
                    const destFilePath = path.join(destPath, entry.name);

                    if (entry.isDirectory()) {
                        if (!fs.existsSync(destFilePath)) {
                            throw new Error(`Missing directory in ${dir}: ${relativeEntryPath}/`);
                        }
                        console.log(`✓ Directory structure maintained: ${dir}/${relativeEntryPath}/`);
                        validateStaticDir(srcFilePath, destFilePath, relativeEntryPath);
                    } else {
                        if (!fs.existsSync(destFilePath)) {
                            throw new Error(`Missing static file: ${dir}/${relativeEntryPath}`);
                        }
                        console.log(`✓ ${dir}/${relativeEntryPath} copied`);
                    }
                });
            }
            validateStaticDir(srcDir, destDir);
        }
    });

    // Check no source files exist in dist
    console.log('\nChecking for source files:');
    function checkNoSourceFiles(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                checkNoSourceFiles(fullPath);
            } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.ejs')) {
                throw new Error(`Found source file in dist: ${fullPath}`);
            }
        });
    }
    checkNoSourceFiles(distDir);
    console.log('✓ No source files found in dist');
}

// Main build function
async function build() {
    try {
        cleanDeploy();
        compileTypeScript();      // Compile TypeScript first
        compileEjsTemplates();    // Then compile EJS
        copyStaticFiles();        // Then copy static assets
        validateBuild();          // Finally validate everything
        console.log('\n✓ Build completed successfully');
    } catch (err) {
        console.error('\n✗ Build failed:', err);
        process.exit(1);
    }
}

// Run build process
try {
    console.log('\n=== Starting Build Process ===');
    
    build();
} catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
} 