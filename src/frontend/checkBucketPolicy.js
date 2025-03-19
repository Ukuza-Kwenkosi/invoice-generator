const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const bucketName = 'invoice-generator-web-app';

async function checkBucketPolicy() {
    try {
        const policy = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
        console.log('Bucket Policy:', policy);
    } catch (error) {
        console.error('Error retrieving bucket policy:', error);
    }
}

checkBucketPolicy(); 