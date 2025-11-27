import { serve } from '@hono/node-server';
import app from './hono';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Starting FlexIN Backend Server...`);

serve(
    {
        fetch: app.fetch,
        port,
        hostname: "0.0.0.0", // 🔥 IMPORTANTE: permite acesso externo
    },
    (info) => {
        console.log(``);
        console.log(`=============================================`);
        console.log(`✅ FlexIN Backend Online`);
        console.log(`➡️ Local:   http://localhost:${info.port}`);
        console.log(`➡️ LAN:     http://${info.address}:${info.port}  🔥 USE NO CELULAR`);
        console.log(`📡 tRPC:    http://${info.address}:${info.port}/trpc`);
        console.log(`🔐 Auth:    http://${info.address}:${info.port}/api/auth`);
        console.log(`=============================================`);
        console.log(``);
    }
);
