import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Database, Product } from './database.interface';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Service } from 'typedi';

// Load environment variables
dotenv.config();

@Service()
export class DynamoDatabase implements Database {
    private client: DynamoDBDocumentClient;
    private readonly TABLE_NAME = 'Products';

    constructor() {
        const dbClient = new DynamoDBClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.client = DynamoDBDocumentClient.from(dbClient);
    }

    async getAllProducts(): Promise<Product[]> {
        const command = new ScanCommand({
            TableName: this.TABLE_NAME
        });

        try {
            const response = await this.client.send(command);
            const products = response.Items as Product[];
            return products.sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (error) {
            console.error('Error getting products from DynamoDB:', error);
            throw error;
        }
    }

    async getProductById(id: string): Promise<Product | null> {
        try {
            const command = new GetCommand({
                TableName: this.TABLE_NAME,
                Key: { id }
            });
            const response = await this.client.send(command);
            return response.Item as Product || null;
        } catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    }

    async initializeProductsTable(): Promise<void> {
        try {
            const dataPath = path.join(process.cwd(), 'src', 'backend', 'src', 'data', 'data.json');
            const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            // Add each product to DynamoDB
            for (const product of products) {
                const command = new PutCommand({
                    TableName: this.TABLE_NAME,
                    Item: {
                        id: product.name.toLowerCase().replace(/\s+/g, '-'),
                        ...product
                    }
                });
                await this.client.send(command);
            }
            console.log('Products table initialized successfully');
        } catch (error) {
            console.error('Error initializing products table:', error);
            throw error;
        }
    }
} 