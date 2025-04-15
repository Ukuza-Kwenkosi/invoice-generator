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
    try {
        require('child_process').execSync('tsc --project tsconfig.json', { stdio: 'inherit' });
        console.log('✓ TypeScript compilation completed');
    } catch (error) {
        console.error('✗ TypeScript compilation failed:', error);
        process.exit(1);
    }
}

// Compile EJS templates to HTML
function compileEjsTemplates() {
    console.log('\n3. Compiling EJS templates to HTML');
    const srcDir = path.join(__dirname, 'src');
    const distDir = path.join(__dirname, 'deploy', 'dist');
    const viewsDir = path.join(srcDir, 'views');
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
        console.log('✓ Compiled index.ejs to index.html');
    } catch (error) {
        console.error('✗ Failed to compile index.ejs:', error);
        process.exit(1);
    }

    // Compile other EJS templates
    const ejsFiles = fs.readdirSync(viewsDir).filter(file => file.endsWith('.ejs') && file !== 'index.ejs');
    for (const file of ejsFiles) {
        console.log(`Compiling ${file}...`);
        try {
            const ejsContent = fs.readFileSync(path.join(viewsDir, file), 'utf8');
            const htmlContent = ejs.render(ejsContent, {
                filename: path.join(viewsDir, file),
                root: viewsDir
            });
            const htmlFileName = file.replace('.ejs', '.html');
            fs.writeFileSync(path.join(distViewsDir, htmlFileName), htmlContent);
            console.log(`✓ Compiled ${file} to ${htmlFileName}`);
        } catch (error) {
            console.error(`✗ Failed to compile ${file}:`, error);
            process.exit(1);
        }
    }
}

// Copy static files
function copyStaticFiles() {
    console.log('\n4. Copying static files');
    const srcDir = path.join(__dirname, 'src');
    const distDir = path.join(__dirname, 'deploy', 'dist');
    
    // Copy CSS files
    const cssSrcDir = path.join(srcDir, 'css');
    const cssDistDir = path.join(distDir, 'css');
    if (fs.existsSync(cssSrcDir)) {
        fs.mkdirSync(cssDistDir, { recursive: true });
        const cssFiles = fs.readdirSync(cssSrcDir);
        for (const file of cssFiles) {
            fs.copyFileSync(path.join(cssSrcDir, file), path.join(cssDistDir, file));
        }
        console.log('✓ Copied CSS files');
    }

    // Copy JavaScript files
    const jsSrcDir = path.join(__dirname, 'deploy', 'dist', 'js');
    const jsDistDir = path.join(distDir, 'js');
    if (fs.existsSync(jsSrcDir)) {
        // Create js directory in final dist
        fs.mkdirSync(jsDistDir, { recursive: true });
        
        // Copy all files and directories recursively
        function copyDir(src, dest) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            
            const entries = fs.readdirSync(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                
                if (entry.isDirectory()) {
                    copyDir(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
        
        copyDir(jsSrcDir, jsDistDir);
        console.log('✓ Copied JavaScript files');
    } else {
        console.error('✗ JavaScript source directory not found:', jsSrcDir);
        process.exit(1);
    }

    // Copy image files
    const imagesSrcDir = path.join(srcDir, 'images');
    const imagesDistDir = path.join(distDir, 'images');
    if (fs.existsSync(imagesSrcDir)) {
        fs.mkdirSync(imagesDistDir, { recursive: true });
        const imageFiles = fs.readdirSync(imagesSrcDir);
        for (const file of imageFiles) {
            fs.copyFileSync(path.join(imagesSrcDir, file), path.join(imagesDistDir, file));
        }
        console.log('✓ Copied image files');
    }
}

// Validate build
function validateBuild() {
    console.log('\n5. Validating build');
    const srcDir = path.join(__dirname, 'src');
    const distDir = path.join(__dirname, 'deploy', 'dist');

    // Validate TypeScript compilation
    function validateTypeScriptDir(srcDir, distDir, relativePath = '') {
        const srcPath = path.join(srcDir, relativePath);
        const distPath = path.join(distDir, relativePath);
        
        if (!fs.existsSync(srcPath)) return;
        
        const items = fs.readdirSync(srcPath);
        for (const item of items) {
            const itemPath = path.join(relativePath, item);
            const srcItemPath = path.join(srcDir, itemPath);
            const distItemPath = path.join(distDir, itemPath);
            
            if (fs.statSync(srcItemPath).isDirectory()) {
                validateTypeScriptDir(srcDir, distDir, itemPath);
            } else if (item.endsWith('.ts')) {
                const jsFile = item.replace('.ts', '.js');
                const distJsPath = path.join(distDir, 'js', itemPath.replace('.ts', '.js'));
                if (!fs.existsSync(distJsPath)) {
                    console.error(`✗ Missing compiled file: ${jsFile}`);
                    process.exit(1);
                }
            }
        }
    }

    // Validate static files
    function validateStaticDir(srcPath, destPath, relativePath = '') {
        if (!fs.existsSync(srcPath)) return;
        
        const items = fs.readdirSync(srcPath);
        for (const item of items) {
            const itemSrcPath = path.join(srcPath, item);
            const itemDestPath = path.join(destPath, item);
            const itemRelativePath = path.join(relativePath, item);
            
            if (fs.statSync(itemSrcPath).isDirectory()) {
                validateStaticDir(itemSrcPath, itemDestPath, itemRelativePath);
            } else if (!fs.existsSync(itemDestPath)) {
                console.error(`✗ Missing static file: ${itemRelativePath}`);
                process.exit(1);
            }
        }
    }

    // Check for source files in dist
    function checkNoSourceFiles(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
                checkNoSourceFiles(itemPath);
            } else if (item.endsWith('.ts')) {
                console.error(`✗ Source file found in dist: ${itemPath}`);
                process.exit(1);
            }
        }
    }

    validateTypeScriptDir(path.join(srcDir, 'js'), distDir);
    validateStaticDir(path.join(srcDir, 'css'), path.join(distDir, 'css'));
    validateStaticDir(path.join(srcDir, 'images'), path.join(distDir, 'images'));
    checkNoSourceFiles(distDir);
    
    console.log('✓ Build validation completed');
}

async function build() {
    try {
        cleanDeploy();
        compileTypeScript();
        compileEjsTemplates();
        copyStaticFiles();
        validateBuild();
        console.log('\nBuild completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 