import { serve } from '@hono/node-server';
import app from './hono';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Starting FlexIN Backend Server...`);

serve({
    fetch: app.fetch,
    port,
}, (info) => {
    console.log(`✅ Server is running on http://localhost:${info.port}`);
    console.log(`📡 tRPC endpoint: http://localhost:${info.port}/trpc`);
    console.log(`🔐 Auth endpoint: http://localhost:${info.port}/api/auth`);
});
