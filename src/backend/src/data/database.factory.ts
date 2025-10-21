import { Database } from './database.interface';
import { SupabaseDatabase } from './supabase-db';

export class DatabaseFactory {
    private static instance: Database | null = null;

    static getDatabase(): Database {
        if (!process.env.SUPABASE_API_URL || !process.env.SUPABASE_API_KEY) {
            throw new Error('Supabase configuration missing. Please check your environment variables.');
        }
        
        // Use singleton pattern instead of TypeDI Container
        if (!this.instance) {
            this.instance = new SupabaseDatabase();
        }
        
        return this.instance;
    }
}