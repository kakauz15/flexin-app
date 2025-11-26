import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'flexin',
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
