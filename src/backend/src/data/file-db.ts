import { Service } from 'typedi';
import fs from 'fs/promises';
import path from 'path';
import { Database, Product } from './database.interface.js';

@Service()
export class FileDatabase implements Database {
    private dbPath: string;

    constructor() {
        // Use a data directory at the project root
        this.dbPath = path.join(process.cwd(), 'data', 'db.json');
        this.ensureDbExists();
    }

    private async ensureDbExists() {
        try {
            // Ensure the data directory exists
            const dataDir = path.dirname(this.dbPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Check if the database file exists
            try {
                await fs.access(this.dbPath);
            } catch {
                // If file doesn't exist, create it with initial data
                const initialData = await this.getInitialData();
                await fs.writeFile(this.dbPath, JSON.stringify(initialData, null, 2));
            }
        } catch (error) {
            console.error('Error ensuring database exists:', error);
        }
    }

    private async getInitialData(): Promise<Product[]> {
        try {
            // Try to read from the initial data file
            const initialDataPath = path.join(process.cwd(), 'src', 'backend', 'src', 'data', 'data.json');
            const data = await fs.readFile(initialDataPath, 'utf-8');
            return JSON.parse(data);
        } catch {
            // Return empty array if initial data file doesn't exist
            return [];
        }
    }

    async getAllProducts(): Promise<Product[]> {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const products = JSON.parse(data);
            return products;
        } catch (error) {
            console.error('Error reading products from file:', error);
            return [];
        }
    }

    async updateProduct(name: string, product: Omit<Product, 'id'>): Promise<void> {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const products = JSON.parse(data) as Product[];
            
            const index = products.findIndex(p => p.name === name);
            if (index === -1) {
                throw new Error(`Product with name ${name} not found`);
            }

            products[index] = { ...products[index], ...product };
            await fs.writeFile(this.dbPath, JSON.stringify(products, null, 2));
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }
} 