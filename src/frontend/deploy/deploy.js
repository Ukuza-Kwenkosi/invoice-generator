const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'af-south-1' }); // Change to your desired region
const s3 = new AWS.S3();

const bucketName = 'invoice-generator-web-app';

// Function to delete all objects in the bucket
async function deleteAllObjects() {
    try {
        const data = await s3.listObjects({ Bucket: bucketName }).promise();
        if (data.Contents.length === 0) {
            console.log('Bucket is already empty');
            return;
        }

        const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: [] }
        };

        data.Contents.forEach(({ Key }) => {
            deleteParams.Delete.Objects.push({ Key });
        });

        await s3.deleteObjects(deleteParams).promise();
        console.log(`Successfully deleted ${data.Contents.length} objects from bucket`);
    } catch (error) {
        console.error('Error deleting objects:', error);
        throw error;
    }
}

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
        let contentType = 'application/octet-stream'; // Default content type

        // Set appropriate content type based on file extension
        if (file.endsWith('.html')) contentType = 'text/html';
        else if (file.endsWith('.css')) contentType = 'text/css';
        else if (file.endsWith('.js')) contentType = 'application/javascript';
        else if (file.endsWith('.json')) contentType = 'application/json';
        else if (file.endsWith('.png')) contentType = 'image/png';
        else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (file.endsWith('.gif')) contentType = 'image/gif';
        else if (file.endsWith('.svg')) contentType = 'image/svg+xml';

        const params = {
            Bucket: bucketName,
            Key: path.relative(path.join(__dirname, 'dist'), filePath), // Use relative path for the key
            Body: fileContent,
            ContentType: contentType
        };

        try {
            await s3.putObject(params).promise();
            console.log(`Uploaded ${params.Key} to S3`);
        } catch (error) {
            console.error(`Error uploading ${params.Key}:`, error);
        }
    }
}

// Function to configure static website hosting
async function configureStaticWebsite() {
    const params = {
        Bucket: bucketName,
        WebsiteConfiguration: {
            IndexDocument: {
                Suffix: 'index.html'
            },
            ErrorDocument: {
                Key: 'index.html'
            }
        }
    };

    try {
        await s3.putBucketWebsite(params).promise();
        console.log('Static website hosting configured successfully');
    } catch (error) {
        console.error('Error configuring static website:', error);
    }
}

// Main deployment function
async function deployToS3() {
    try {
        // Delete existing objects
        await deleteAllObjects();
        
        // Create bucket if it doesn't exist
        await createBucket();
        
        // Upload files from dist directory
        const distDir = path.join(__dirname, 'dist');
        await uploadFiles(distDir);
        
        // Configure static website hosting
        await configureStaticWebsite();
        
        console.log('Deployment completed successfully!');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

// Run the deployment
deployToS3();
