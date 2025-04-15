import { Service } from 'typedi';
import fs from 'fs/promises';
import path from 'path';
import { Database, Product } from './database.interface.js';

@Service()
export class FileDatabase implements Database {
    private dbPath: string;

    constructor() {
        this.dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
    }

    async getAllProducts(): Promise<Product[]> {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const { products } = JSON.parse(data);
            return products;
        } catch (error) {
            console.error('Error reading products from file:', error);
            return [];
        }
    }
} 