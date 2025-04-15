const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS
AWS.config.update({ region: 'af-south-1' });
const cloudfront = new AWS.CloudFront();

// Configuration
const DISTRIBUTION_ID = 'EM1P4EBMJ7FL7';

async function updateCloudFront() {
    try {
        console.log('🔄 Updating CloudFront distribution...');

        // Get current distribution config
        const { DistributionConfig, ETag } = await cloudfront.getDistributionConfig({
            Id: DISTRIBUTION_ID
        }).promise();

        // Update the backend origin
        const backendOrigin = DistributionConfig.Origins.Items.find(origin => origin.Id === 'BackendOrigin');
        if (backendOrigin) {
            backendOrigin.DomainName = 'ec2-13-246-21-45.af-south-1.compute.amazonaws.com';
        }

        // Update the distribution
        await cloudfront.updateDistribution({
            Id: DISTRIBUTION_ID,
            IfMatch: ETag,
            DistributionConfig
        }).promise();

        console.log('✅ CloudFront distribution updated successfully!');
        console.log('⏳ Please wait for the changes to propagate (this can take up to 15 minutes)');
    } catch (error) {
        console.error('❌ Failed to update CloudFront distribution:', error);
        process.exit(1);
    }
}

updateCloudFront(); 