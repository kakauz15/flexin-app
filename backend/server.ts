import { serve } from '@hono/node-server';
import app from './hono';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Starting FlexIN Backend Server...`);

// serve({
//     fetch: app.fetch,
//     port,
// }, (info) => {
//     console.log(`✅ Server is running on http://localhost:${info.port}`);
// });

serve(
    {
        fetch: app.fetch,
        port,
        hostname: "0.0.0.0", // <-- ESSENCIAL
    },
    (info) => {
        console.log("");
        console.log("============================================");
        console.log(`  Backend rodando!`);
        console.log(`  Local: http://localhost:${info.port}`);
        console.log(`  LAN:   http://${info.address}:${info.port}   <--- USE NO CELULAR`);
        console.log("============================================");
        console.log("");
    }
);