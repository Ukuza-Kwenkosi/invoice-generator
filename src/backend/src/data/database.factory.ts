import { Container } from 'typedi';
import { Database } from './database.interface';
import { SupabaseDatabase } from './supabase-db';

export class DatabaseFactory {
    static getDatabase(): Database {
        if (!process.env.SUPABASE_API_URL || !process.env.SUPABASE_API_KEY) {
            throw new Error('Supabase configuration missing. Please check your environment variables.');
        }
        return Container.get(SupabaseDatabase);
    }
}