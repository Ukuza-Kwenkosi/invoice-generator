import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DynamoDB client with EC2 instance role
const client = new DynamoDBClient({
    region: 'af-south-1'
});

const docClient = DynamoDBDocumentClient.from(client);

async function fetchProducts() {
    try {
        const command = new ScanCommand({
            TableName: 'Products'
        });
        const response = await docClient.send(command);
        
        // Format the data to match our local schema
        const products = response.Items?.map(item => ({
            name: item.name,
            sizes: item.sizes,
            options: item.options,
            description: item.description
        })) || [];

        // Save to data.json
        const dataPath = path.join(__dirname, '../src/data/data.json');
        fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
        
        console.log('Successfully fetched and saved products data');
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

fetchProducts(); 