const { execSync } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({ region: 'af-south-1' });
const s3 = new AWS.S3();

// Configuration
const BUCKET_NAME = 'invoice-generator-frontend';
const CLOUDFRONT_DISTRIBUTION_ID = 'EM1P4EBMJ7FL7'; // Correct CloudFront distribution ID

async function deploy() {
    try {
        console.log('🚀 Starting frontend deployment...');

        // Build the frontend
        console.log('📦 Building frontend...');
        execSync('npm run build', { stdio: 'inherit' });

        // Upload files to S3
        console.log('📤 Uploading files to S3...');
        const distPath = path.join(__dirname, 'deploy', 'dist');
        
        // Upload all files recursively
        const uploadFile = async (filePath) => {
            const relativePath = path.relative(distPath, filePath);
            const key = relativePath;
            
            const fileContent = fs.readFileSync(filePath);
            
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: fileContent,
                ContentType: getContentType(filePath),
                CacheControl: 'max-age=31536000'
            }).promise();
            
            console.log(`✅ Uploaded: ${key}`);
        };

        const walkDir = async (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    await walkDir(filePath);
                } else {
                    await uploadFile(filePath);
                }
            }
        };

        await walkDir(distPath);

        // Invalidate CloudFront cache
        console.log('🔄 Invalidating CloudFront cache...');
        const cloudfront = new AWS.CloudFront();
        await cloudfront.createInvalidation({
            DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: Date.now().toString(),
                Paths: {
                    Quantity: 1,
                    Items: ['/*']
                }
            }
        }).promise();

        console.log('✨ Frontend deployment completed successfully!');
        console.log('🌐 Your application is available at: https://dctxoovo0tr3t.cloudfront.net');
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
    };
    return types[ext] || 'application/octet-stream';
}

deploy(); 