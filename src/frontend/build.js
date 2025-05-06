import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatchMode = process.argv.includes('--watch');

// Directory paths
const srcDir = join(__dirname, 'src');
const viewsDir = join(srcDir, 'views');
const deployDir = join(__dirname, 'deploy');
const distDir = join(deployDir, 'dist');

// Clean and prepare dist directory
if (existsSync(deployDir)) {
  rmSync(deployDir, { recursive: true });
}
mkdirSync(deployDir, { recursive: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(join(distDir, 'css'), { recursive: true });
mkdirSync(join(distDir, 'images'), { recursive: true });
mkdirSync(join(distDir, 'js'), { recursive: true });

// Bundle TypeScript files using esbuild
function bundleTypeScript() {
  try {
    console.log('Bundling TypeScript files...');
    execSync('npm run build:js', { stdio: 'inherit' });
    console.log('TypeScript bundling completed successfully!');
  } catch (error) {
    console.error('Error bundling TypeScript files:', error);
    process.exit(1);
  }
}

// Process EJS templates
function processTemplates() {
  // Process main templates from views directory
  const viewsDir = join(srcDir, 'views');
  const ejsFiles = readdirSync(viewsDir).filter(file => file.endsWith('.ejs'));
  
  for (const file of ejsFiles) {
    const filePath = join(viewsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const html = ejs.render(content, {}, {
      filename: filePath,
      root: [srcDir],
      views: [srcDir]
    });
    
    const outputPath = join(distDir, file.replace('.ejs', '.html'));
    writeFileSync(outputPath, html);
    console.log(`Processed: ${file} -> ${basename(outputPath)}`);
  }

  // Process component templates from js/components directory
  const componentsDir = join(srcDir, 'js', 'components');
  if (existsSync(componentsDir)) {
    const componentDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const componentDir of componentDirs) {
      const componentPath = join(componentsDir, componentDir);
      const componentFiles = readdirSync(componentPath)
        .filter(file => file.endsWith('.ejs'));

      for (const file of componentFiles) {
        const filePath = join(componentPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const html = ejs.render(content, {}, {
          filename: filePath,
          root: [srcDir],
          views: [srcDir]
        });

        // Create component directory in dist if it doesn't exist
        const componentDistDir = join(distDir, 'js', 'components', componentDir);
        if (!existsSync(componentDistDir)) {
          mkdirSync(componentDistDir, { recursive: true });
        }

        const outputPath = join(componentDistDir, file.replace('.ejs', '.html'));
        writeFileSync(outputPath, html);
        console.log(`Processed component: ${componentDir}/${file} -> ${basename(outputPath)}`);
      }
    }
  }
}

// Copy static files
function copyStaticFiles() {
  // Copy CSS files
  const cssDir = join(srcDir, 'css');
  if (existsSync(cssDir)) {
    const cssFiles = readdirSync(cssDir);
    for (const file of cssFiles) {
      copyFileSync(join(cssDir, file), join(distDir, 'css', file));
      console.log(`Copied: css/${file}`);
    }
  }

  // Copy images
  const imagesDir = join(srcDir, 'images');
  if (existsSync(imagesDir)) {
    const imageFiles = readdirSync(imagesDir);
    for (const file of imageFiles) {
      copyFileSync(join(imagesDir, file), join(distDir, 'images', file));
      console.log(`Copied: images/${file}`);
    }

    // Copy favicon from images directory
    const faviconPath = join(imagesDir, 'favicon.ico');
    if (existsSync(faviconPath)) {
      copyFileSync(faviconPath, join(distDir, 'favicon.ico'));
      console.log('Copied: favicon.ico');
    }
  }
}

// Initial build
bundleTypeScript();
processTemplates();
copyStaticFiles();
console.log('Build completed successfully!');

// Watch mode
if (isWatchMode) {
  console.log('Watching for changes...');
  import('fs').then(({ watch }) => {
    // Watch templates
    watch(viewsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.ejs')) {
        console.log(`Change detected in ${filename}, rebuilding...`);
        processTemplates();
      }
    });

    // Watch CSS files
    const cssDir = join(srcDir, 'css');
    if (existsSync(cssDir)) {
      watch(cssDir, { recursive: true }, (eventType, filename) => {
        if (filename) {
          console.log(`Change detected in css/${filename}, copying...`);
          copyFileSync(join(cssDir, filename), join(distDir, 'css', filename));
        }
      });
    }

    // Watch images
    const imagesDir = join(srcDir, 'images');
    if (existsSync(imagesDir)) {
      watch(imagesDir, { recursive: true }, (eventType, filename) => {
        if (filename) {
          console.log(`Change detected in images/${filename}, copying...`);
          copyFileSync(join(imagesDir, filename), join(distDir, 'images', filename));
          // If the changed file is favicon.ico, also copy it to root
          if (filename === 'favicon.ico') {
            copyFileSync(join(imagesDir, filename), join(distDir, filename));
          }
        }
      });
    }

    // Watch TypeScript files
    const tsDir = join(srcDir, 'js');
    if (existsSync(tsDir)) {
      watch(tsDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.ts')) {
          console.log(`Change detected in js/${filename}, rebuilding...`);
          bundleTypeScript();
        }
      });
    }
  });
} 