// build.js
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Define the source and destination directories
const srcDir = path.join(__dirname, '..'); // Move one level up to src
const distDir = path.join(__dirname, 'dist'); // Create dist inside deploy folder
const publicDir = path.join(srcDir, 'public'); // Path to public directory

// Create the dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Function to compile EJS files
function compileEJS(file) {
    const filePath = path.join(srcDir, file);
    const outputFilePath = path.join(distDir, file.replace('.ejs', '.html'));

    // Read the EJS file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
        }

        // Compile the EJS file
        const html = ejs.render(data);

        // Write the compiled HTML to the output file
        fs.writeFile(outputFilePath, html, (err) => {
            if (err) {
                console.error(`Error writing file ${outputFilePath}:`, err);
            } else {
                console.log(`Compiled ${file} to ${outputFilePath}`);
            }
        });
    });
}

// Compile all EJS files in the src/frontend directory
fs.readdir(srcDir, (err, files) => {
    if (err) {
        console.error('Error reading source directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.ejs')) {
            compileEJS(file);
        }
    });
});

// Function to copy files and directories
function copyFiles(src, dest) {
    if (fs.lstatSync(src).isDirectory()) {
        // Create the destination directory if it doesn't exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true }); // Ensure all parent directories are created
        }
        // Read the contents of the directory
        fs.readdirSync(src).forEach(file => {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            copyFiles(srcFile, destFile); // Recursively copy
        });
    } else {
        // Copy the file
        fs.copyFileSync(src, dest);
        console.log(`Copied ${src} to ${dest}`);
    }
}

// Copy contents from the public directory to the dist directory root
if (fs.existsSync(publicDir)) {
    fs.readdir(publicDir, (err, files) => {
        if (err) {
            console.error('Error reading public directory:', err);
            return;
        }

        files.forEach(file => {
            const publicFilePath = path.join(publicDir, file);
            const destFilePath = path.join(distDir, file); // Copy directly to dist root
            copyFiles(publicFilePath, destFilePath);
        });
    });
} else {
    console.warn(`Public directory ${publicDir} does not exist.`);
}

// Copy images directory
const imagesSrcDir = path.join(srcDir, 'images');
const imagesDestDir = path.join(distDir, 'images');
if (fs.existsSync(imagesSrcDir)) {
    if (!fs.existsSync(imagesDestDir)) {
        fs.mkdirSync(imagesDestDir, { recursive: true });
    }
    copyFiles(imagesSrcDir, imagesDestDir);
} else {
    console.warn(`Images directory ${imagesSrcDir} does not exist.`);
}

// Copy templates directory
const templatesSrcDir = path.join(publicDir, 'templates');
const templatesDestDir = path.join(distDir, 'templates');
if (fs.existsSync(templatesSrcDir)) {
    if (!fs.existsSync(templatesDestDir)) {
        fs.mkdirSync(templatesDestDir, { recursive: true });
    }
    copyFiles(templatesSrcDir, templatesDestDir);
} else {
    console.warn(`Templates directory ${templatesSrcDir} does not exist.`);
}

// Copy data.json
const dataSrcFile = path.join(srcDir, 'data.json');
const dataDestFile = path.join(distDir, 'data.json');
if (fs.existsSync(dataSrcFile)) {
    fs.copyFileSync(dataSrcFile, dataDestFile);
    console.log(`Copied data.json to ${dataDestFile}`);
} else {
    console.warn(`data.json ${dataSrcFile} does not exist.`);
}