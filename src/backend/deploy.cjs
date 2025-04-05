const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const EC2_KEY_NAME = 'invoice-generator-prod-key';
const EC2_USERNAME = 'ubuntu';
const DEPLOYMENT_DIR = '/home/ubuntu/deployments';
const PUBLIC_IP = '13.247.199.174'; // Your EC2 instance IP

async function deploy() {
    try {
        console.log('🚀 Starting backend deployment...');

        // Verify build output exists
        if (!fs.existsSync('deploy/dist')) {
            throw new Error('Build output not found. Please run build first.');
        }

        // Clean and prepare EC2 deployment directory
        console.log('🧹 Preparing EC2 deployment directory...');
        execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME}.pem ${EC2_USERNAME}@${PUBLIC_IP} "rm -rf ${DEPLOYMENT_DIR}/* && mkdir -p ${DEPLOYMENT_DIR}"`, { stdio: 'inherit' });

        // Copy files to EC2
        console.log('📤 Copying files to EC2...');
        execSync(`scp -i ~/.ssh/${EC2_KEY_NAME}.pem -r deploy/dist/* ${EC2_USERNAME}@${PUBLIC_IP}:${DEPLOYMENT_DIR}/`, { stdio: 'inherit' });

        // Deploy on EC2
        console.log('🔄 Deploying on EC2...');
        execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME}.pem ${EC2_USERNAME}@${PUBLIC_IP} "cd ${DEPLOYMENT_DIR} && npm install --production --silent && nohup node server.js > /dev/null 2>&1 &"`, { stdio: 'inherit' });

        // Wait for server to start
        console.log('⏳ Waiting for server to start...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Health check
        console.log('🏥 Running health check...');
        const healthCheck = execSync(`curl -s http://${PUBLIC_IP}:3000/health`).toString();
        
        if (healthCheck.includes('"status":"ok"')) {
            console.log('✅ Health check passed');
            console.log(`🌐 API URL: http://${PUBLIC_IP}:3000`);
            console.log(`📡 Health check response: ${healthCheck}`);
        } else {
            throw new Error('Health check failed');
        }

        console.log('✨ Backend deployment completed successfully!');
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deploy(); 