const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');

// Function to ensure directory exists
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

console.log('Starting production optimization...');

// Optimize JavaScript files
console.log('\nOptimizing JavaScript files...');
const jsDir = path.join(distDir, 'public/js');
if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(jsDir, file);
            const minFilePath = filePath.replace('.js', '.min.js');
            
            try {
                execSync(`terser ${filePath} -c -m -o ${minFilePath}`, { stdio: 'inherit' });
                console.log(`Minified ${file}`);
            } catch (error) {
                console.error(`Error minifying ${file}:`, error);
            }
        }
    });
}

// Optimize CSS files
console.log('\nOptimizing CSS files...');
const cssDir = path.join(distDir, 'public/css');
if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
        if (file.endsWith('.css')) {
            const filePath = path.join(cssDir, file);
            const minFilePath = filePath.replace('.css', '.min.css');
            
            try {
                execSync(`cleancss -o ${minFilePath} ${filePath}`, { stdio: 'inherit' });
                console.log(`Minified ${file}`);
            } catch (error) {
                console.error(`Error minifying ${file}:`, error);
            }
        }
    });
}

// Optimize images
console.log('\nOptimizing images...');
const imagesDir = path.join(distDir, 'public/images');
if (fs.existsSync(imagesDir)) {
    fs.readdirSync(imagesDir).forEach(file => {
        if (file.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
            const filePath = path.join(imagesDir, file);
            
            try {
                execSync(`imagemin ${filePath} --out-dir=${imagesDir}`, { stdio: 'inherit' });
                console.log(`Optimized ${file}`);
            } catch (error) {
                console.error(`Error optimizing ${file}:`, error);
            }
        }
    });
}

// Update HTML files to use minified versions
console.log('\nUpdating HTML files to use minified assets...');
const viewsDir = path.join(distDir, 'public/views');
if (fs.existsSync(viewsDir)) {
    fs.readdirSync(viewsDir).forEach(file => {
        if (file.endsWith('.ejs')) {
            const filePath = path.join(viewsDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace CSS files
            content = content.replace(/\.css/g, '.min.css');
            
            // Replace JavaScript files
            content = content.replace(/\.js/g, '.min.js');
            
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        }
    });
}

console.log('\nProduction optimization completed successfully!'); 