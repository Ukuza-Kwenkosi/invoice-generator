const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'af-south-1' });

const bucketName = 'invoice-generator-web-app';

async function setCorsConfiguration() {
    const corsConfiguration = [
        {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: []
        }
    ];

    const params = {
        Bucket: bucketName,
        CORSConfiguration: { CORSRules: corsConfiguration }
    };

    try {
        await s3.putBucketCors(params).promise();
        console.log('CORS configuration set successfully.');
    } catch (error) {
        console.error('Error setting CORS configuration:', error);
    }
}

setCorsConfiguration(); 