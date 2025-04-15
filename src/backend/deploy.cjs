const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const EC2_KEY_NAME = 'invoice-generator-prod-key.pem';
const EC2_USERNAME = 'ubuntu';
const DEPLOYMENT_DIR = '/home/ubuntu/deployments';
const PUBLIC_IP = '13.247.89.204';

function deploy() {
    try {
        console.log('🚀 Starting backend deployment...');

        // Define deployment directory
        const deployDir = path.join(__dirname, 'deploy/dist');
        console.log('Deployment directory:', deployDir);

        // Verify build output exists
        if (!fs.existsSync(deployDir)) {
            throw new Error('Build output not found. Please run npm run build first.');
        }

        // Verify configuration
        console.log('🔍 Verifying configuration...');
        if (!fs.existsSync(path.join(process.env.HOME, '.ssh', EC2_KEY_NAME))) {
            throw new Error(`SSH key not found: ${EC2_KEY_NAME}`);
        }

        // Check EC2 connection
        console.log('🔌 Checking EC2 connection...');
        execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "echo 'Connection successful'"`);

        // Stop existing server
        console.log('🛑 Stopping existing server...');
        try {
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "pkill -f 'node.*server.js' || true"`);
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "killall -9 node || true"`);
        } catch (error) {
            console.log('No existing server process found');
        }

        // Copy files to EC2
        console.log('📤 Copying files to EC2...');
        execSync(`scp -i ~/.ssh/${EC2_KEY_NAME} -r "${deployDir}"/* ${EC2_USERNAME}@${PUBLIC_IP}:${DEPLOYMENT_DIR}/`);
        execSync(`scp -i ~/.ssh/${EC2_KEY_NAME} "${__dirname}/.env.production" ${EC2_USERNAME}@${PUBLIC_IP}:${DEPLOYMENT_DIR}/.env`);
        console.log('✅ Files copied successfully');

        // Start server in background with proper detachment
        console.log('🚀 Starting server...');
        execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "cd ${DEPLOYMENT_DIR} && (NODE_ENV=production nohup node server.js > server.log 2>&1 & disown)"`);

        // Wait for server to start and perform health check
        console.log('⏳ Waiting for server to start (5 seconds)...');
        execSync('sleep 5');
        
        try {
            console.log('🏥 Performing health check...');
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "curl -s http://localhost:3000/products"`);
            console.log('✅ Server is healthy and responding');
        } catch (error) {
            console.error('❌ Server health check failed');
            const logs = execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "cat ${DEPLOYMENT_DIR}/server.log"`).toString();
            console.error('Server logs:', logs);
            throw new Error('Server failed to start properly');
        }

        console.log('✨ Deployment completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deploy(); 