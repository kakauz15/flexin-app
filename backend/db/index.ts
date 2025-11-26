import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'flexin',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
