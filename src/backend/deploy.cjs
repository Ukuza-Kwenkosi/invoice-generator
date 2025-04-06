const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const EC2_KEY_NAME = 'invoice-generator-prod-key.pem';
const EC2_USERNAME = 'ubuntu';
const DEPLOYMENT_DIR = '/home/ubuntu/deployments';
const PUBLIC_IP = '13.246.21.45'; // Your EC2 instance IP

async function deploy() {
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
        try {
            // Check if key file exists
            const keyPath = path.join(process.env.HOME, '.ssh', EC2_KEY_NAME);
            if (!fs.existsSync(keyPath)) {
                throw new Error(`SSH key file not found at ${keyPath}`);
            }
            console.log('✅ SSH key file verified');

            // Check if deployment directory exists
            if (!fs.existsSync(deployDir)) {
                throw new Error('Build output not found. Please run npm run build first.');
            }
            console.log('✅ Build output directory verified');

            // Check if server.js exists in build output
            const serverJsPath = path.join(deployDir, 'server.js');
            if (!fs.existsSync(serverJsPath)) {
                throw new Error('server.js not found in build output');
            }
            console.log('✅ server.js verified');

            // Check if package.json exists in build output
            const packageJsonPath = path.join(deployDir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('package.json not found in build output');
            }
            console.log('✅ package.json verified');

            // Check if data directory exists
            const dataDir = path.join(deployDir, 'data');
            if (!fs.existsSync(dataDir)) {
                throw new Error('data directory not found in build output');
            }
            console.log('✅ data directory verified');

            // Check if images directory exists
            const imagesDir = path.join(deployDir, 'images');
            if (!fs.existsSync(imagesDir)) {
                throw new Error('images directory not found in build output');
            }
            console.log('✅ images directory verified');

            // Check if we can connect to EC2
            console.log('Testing EC2 connection...');
            const testConnection = execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "echo 'Connection successful'"`).toString().trim();
            if (testConnection !== 'Connection successful') {
                throw new Error('Failed to connect to EC2 instance');
            }
            console.log('✅ EC2 connection verified');

            // Check if deployment directory exists on EC2
            console.log('Checking EC2 deployment directory...');
            const checkDeployDir = execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "ls -la ${DEPLOYMENT_DIR} || echo 'not found'"`).toString().trim();
            if (checkDeployDir === 'not found') {
                console.log('Creating deployment directory on EC2...');
                execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "mkdir -p ${DEPLOYMENT_DIR}"`);
            }
            console.log('✅ EC2 deployment directory verified');

            console.log('✅ All configuration checks passed');
        } catch (error) {
            console.error('❌ Configuration verification failed:', error);
            throw error;
        }

        // Stop any existing server process first
        console.log('🛑 Stopping existing server...');
        try {
            // First check if server is running
            const checkServer = execSync('ssh -i ~/.ssh/invoice-generator-prod-key.pem ubuntu@13.246.21.45 "ps aux | grep \'node server.js\' | grep -v grep"').toString().trim();
            if (checkServer) {
                console.log('Found running server, stopping it...');
                // Kill the specific server process
                execSync('ssh -i ~/.ssh/invoice-generator-prod-key.pem ubuntu@13.246.21.45 "sudo kill -9 $(ps aux | grep \'node server.js\' | grep -v grep | awk \'{print $2}\')"');
                console.log('✅ Server process killed');
            } else {
                console.log('✅ No server process found');
            }
        } catch (error) {
            console.log('✅ No server process found');
        }

        // Double check port 3000
        try {
            execSync('ssh -i ~/.ssh/invoice-generator-prod-key.pem ubuntu@13.246.21.45 "sudo fuser -k 3000/tcp"');
            console.log('✅ Killed any process using port 3000');
        } catch (error) {
            console.log('✅ No processes using port 3000');
        }

        // Final check - kill any remaining Node.js processes
        try {
            execSync('ssh -i ~/.ssh/invoice-generator-prod-key.pem ubuntu@13.246.21.45 "sudo pkill -9 -f node"');
            console.log('✅ Killed any remaining Node.js processes');
        } catch (error) {
            console.log('✅ No Node.js processes to kill');
        }

        // Wait for server to stop
        console.log('⏳ Waiting for server to stop...');
        execSync('sleep 2');

        // Prepare EC2 deployment directory
        console.log('📁 Preparing EC2 deployment directory...');
        try {
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "rm -rf ${DEPLOYMENT_DIR}/*"`);
            console.log('✅ Deployment directory cleared');
        } catch (error) {
            console.error('❌ Failed to clear deployment directory:', error);
            throw error;
        }

        // Copy files to EC2
        console.log('📦 Copying files to EC2...');
        try {
            console.log('Checking source files...');
            const sourceFiles = execSync(`ls -la "${deployDir}"`).toString();
            console.log('Source files:', sourceFiles);

            console.log('Starting file copy...');
            execSync(`scp -i ~/.ssh/${EC2_KEY_NAME} -r "${deployDir}"/* ${EC2_USERNAME}@${PUBLIC_IP}:${DEPLOYMENT_DIR}/`);
            console.log('✅ Files copied successfully');

            console.log('Verifying files on EC2...');
            const ec2Files = execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "ls -la ${DEPLOYMENT_DIR}"`).toString();
            console.log('Files on EC2:', ec2Files);
        } catch (error) {
            console.error('❌ Failed to copy files:', error);
            throw error;
        }

        // Deploy on EC2
        console.log('🔄 Deploying on EC2...');
        try {
            console.log('Installing dependencies...');
            const installOutput = execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "cd ${DEPLOYMENT_DIR} && npm install --omit=dev"`).toString();
            console.log('Installation output:', installOutput);
            console.log('✅ Dependencies installed successfully');
        } catch (error) {
            console.error('❌ Failed to install dependencies:', error);
            throw error;
        }
        
        // Start the server
        console.log('🚀 Starting server...');
        try {
            // Create a start script on the server
            const startScript = `#!/bin/bash
cd ${DEPLOYMENT_DIR}
NODE_ENV=production node server.js > server.log 2>&1 &
echo $! > server.pid
`;
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "echo '${startScript}' > start-server.sh && chmod +x start-server.sh"`);
            
            // Execute the start script
            execSync(`ssh -i ~/.ssh/${EC2_KEY_NAME} ${EC2_USERNAME}@${PUBLIC_IP} "./start-server.sh"`);
            
            console.log('✅ Server started in background');
            
            // Wait for server to be ready
            console.log('⏳ Waiting for server to be ready...');
            let attempts = 0;
            const maxAttempts = 10;
            let serverReady = false;
            
            while (attempts < maxAttempts && !serverReady) {
                try {
                    const healthCheck = execSync(`curl -s http://${PUBLIC_IP}:3000/health`).toString();
                    if (healthCheck.includes('"status":"ok"')) {
                        serverReady = true;
                        console.log('✅ Server is responding to health checks');
                    }
                } catch (error) {
                    // Health check failed, wait and try again
                    execSync('sleep 1');
                    attempts++;
                }
            }
            
            if (!serverReady) {
                throw new Error('Server failed to respond to health checks after multiple attempts');
            }
            
            console.log('✅ Deployment completed successfully!');
        } catch (error) {
            console.error('❌ Server failed to start:', error.message);
            throw error;
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deploy(); 