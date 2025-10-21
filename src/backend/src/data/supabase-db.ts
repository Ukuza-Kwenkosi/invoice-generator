import { createClient } from '@supabase/supabase-js';
import { Database, Product } from './database.interface';

export class SupabaseDatabase implements Database {
    private supabase;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_API_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials not found in environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async getAllProducts(): Promise<Product[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*');

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data || [];
    }

    async getProduct(name: string): Promise<Product | null> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('name', name)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            console.error('Error fetching product:', error);
            throw error;
        }

        return data;
    }

    async addProduct(product: Omit<Product, 'id'>): Promise<void> {
        const { error } = await this.supabase
            .from('products')
            .insert(product);

        if (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(name: string, product: Omit<Product, 'id'>): Promise<void> {
        const { error } = await this.supabase
            .from('products')
            .update(product)
            .eq('name', name);

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(name: string): Promise<void> {
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('name', name);

        if (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
}
