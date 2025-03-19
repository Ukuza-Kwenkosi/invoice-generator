// build.js
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Define the source and destination directories
const srcDir = path.join(__dirname, '..'); // Move one level up to src
const distDir = path.join(srcDir, 'dist');
const publicDir = path.join(srcDir, 'public'); // Adjusted path to public directory

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

// Copy contents from the public directory to the dist directory
const publicDestDir = path.join(distDir, 'public'); // Destination for public folder
if (fs.existsSync(publicDir)) {
    // Create the public directory in the dist directory
    if (!fs.existsSync(publicDestDir)) {
        fs.mkdirSync(publicDestDir, { recursive: true });
    }

    fs.readdir(publicDir, (err, files) => {
        if (err) {
            console.error('Error reading public directory:', err);
            return;
        }

        files.forEach(file => {
            const publicFilePath = path.join(publicDir, file);
            const destFilePath = path.join(publicDestDir, file); // Copy to the new public directory
            copyFiles(publicFilePath, destFilePath); // Use the copy function
        });
    });
} else {
    console.warn(`Public directory ${publicDir} does not exist.`);
}