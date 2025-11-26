import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './backend/db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'flexin',
    },
});
