const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'af-south-1' }); // Change to your desired region
const s3 = new AWS.S3();

const bucketName = 'invoice-generator-web-app';

// Function to create S3 bucket
async function createBucket() {
    const params = {
        Bucket: bucketName,
        // Remove ACL since it's not allowed
    };

    try {
        // Check if the bucket exists
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`Bucket ${bucketName} already exists and is owned by you.`);
    } catch (error) {
        if (error.code === 'NotFound') {
            // Bucket does not exist, create it
            try {
                await s3.createBucket(params).promise();
                console.log(`Bucket ${bucketName} created successfully.`);
            } catch (createError) {
                console.error('Error creating bucket:', createError);
            }
        } else {
            console.error('Error checking bucket existence:', error);
        }
    }
}

// Function to upload files to S3
async function uploadFiles(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        if (file.startsWith('.')) {
            // Skip hidden files
            console.log(`Skipping hidden file: ${file}`);
            continue;
        }

        const filePath = path.join(directory, file);
        const stats = fs.lstatSync(filePath);
        
        if (stats.isDirectory()) {
            // Recursively upload files in the directory
            console.log(`Entering directory: ${file}`);
            await uploadFiles(filePath); // Recursively call uploadFiles for the directory
            continue; // Skip to the next file
        }

        const fileContent = fs.readFileSync(filePath);
        const contentType = file.endsWith('.html') ? 'text/html' : 'application/octet-stream'; // Set content type

        const params = {
            Bucket: bucketName,
            Key: path.relative(path.join(__dirname, '..', 'dist'), filePath), // Use relative path for the key
            Body: fileContent,
            ContentType: contentType, // Set the content type
        };

        try {
            await s3.upload(params).promise();
            console.log(`Uploaded ${file} to ${bucketName}`);
        } catch (error) {
            console.error(`Error uploading ${file}:`, error);
        }
    }
}

// Function to configure static website hosting
async function configureStaticWebsite() {
    const params = {
        Bucket: bucketName,
        WebsiteConfiguration: {
            IndexDocument: { Suffix: 'index.html' },
            ErrorDocument: { Key: 'index.html' }, // Redirect errors to index.html
        },
    };

    try {
        await s3.putBucketWebsite(params).promise();
        console.log(`Bucket ${bucketName} configured for static website hosting.`);
    } catch (error) {
        console.error('Error configuring static website:', error);
    }
}

// Main function to deploy to S3
async function deployToS3() {
    await createBucket();
    await uploadFiles(path.join(__dirname, '..', 'dist')); // Adjust the path to your dist directory
    await configureStaticWebsite();
}

// Execute the deployment
deployToS3();
