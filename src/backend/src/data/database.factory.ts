import { Container } from 'typedi';
import { Database } from './database.interface';
import { FileDatabase } from './file-db';
import { DynamoDatabase } from './dynamodb';

export class DatabaseFactory {
    static getDatabase(): Database {
        if (process.env.NODE_ENV === 'production') {
            return Container.get(DynamoDatabase);
        }
        return Container.get(FileDatabase);
    }
} 