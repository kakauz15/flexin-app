# FlexIN Scheduler

This is a native cross-platform mobile app for managing home office schedules.

## Project Info

**Platform**: Native iOS & Android app, exportable to web
**Framework**: Expo Router + React Native

## Documentation

For detailed development instructions, please refer to [KB/kaue.md](KB/kaue.md).

## Quick Start

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    bun install
    ```

2.  **Start the backend:**
    ```bash
    npm run dev
    ```

3.  **Start the app:**
    ```bash
    npm run expo
    # or for web
    npm run web
    ```

## Project Structure

```
FlexIN/
├── app/                    # Rotas do Expo Router
├── backend/                # Backend Hono + tRPC
├── components/             # Componentes React Native
├── KB/                     # Knowledge Base
└── drizzle.config.ts       # Configuração Drizzle Kit
```
