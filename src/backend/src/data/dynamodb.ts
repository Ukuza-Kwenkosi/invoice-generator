import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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
        console.log('Initializing DynamoDB client with config:', {
            region: process.env.AWS_REGION,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            tableName: this.TABLE_NAME
        });
        
        const dbClient = new DynamoDBClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.client = DynamoDBDocumentClient.from(dbClient);
        
        // Test the connection
        this.testConnection();
    }

    private async testConnection() {
        try {
            console.log('Testing DynamoDB connection...');
            const command = new ScanCommand({
                TableName: this.TABLE_NAME
            });
            await this.client.send(command);
            console.log('Successfully connected to DynamoDB');
        } catch (error) {
            console.error('Failed to connect to DynamoDB:', error);
        }
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

    async updateProduct(name: string, product: Omit<Product, 'id'>): Promise<void> {
        try {
            console.log('Updating product in DynamoDB:', { name, product });
            const id = name.toLowerCase().replace(/\s+/g, '-');
            console.log('Generated ID:', id);
            
            const command = new UpdateCommand({
                TableName: this.TABLE_NAME,
                Key: { id },
                UpdateExpression: 'SET #name = :name, sizes = :sizes, options = :options, description = :description',
                ExpressionAttributeNames: {
                    '#name': 'name'
                },
                ExpressionAttributeValues: {
                    ':name': product.name,
                    ':sizes': product.sizes,
                    ':options': product.options,
                    ':description': product.description
                }
            });
            console.log('Update command:', command);
            
            const result = await this.client.send(command);
            console.log('Update result:', result);
        } catch (error) {
            console.error('Error updating product in DynamoDB:', error);
            throw error;
        }
    }
} 