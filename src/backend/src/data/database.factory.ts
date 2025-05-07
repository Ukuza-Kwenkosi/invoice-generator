import { Container } from 'typedi';
import { Database } from './database.interface';
import { FileDatabase } from './file-db';
import { DynamoDatabase } from './dynamodb';

export class DatabaseFactory {
    static getDatabase(): Database {
        // Always use FileDatabase for now
        return Container.get(FileDatabase);
    }
} 