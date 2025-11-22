# Wallet OS - Expense Tracker

A mobile-first Progressive Web App for tracking expenses and managing financial goals with AI-powered budget analysis.

## Monorepo Structure

This project uses [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces) for monorepo management.

```
wallet_os/
├── apps/
│   ├── frontend/          # React + Vite frontend
│   └── backend/           # Fastify backend API
├── packages/
│   ├── shared/            # Shared types and utilities
│   ├── ui/                 # Shared UI components (shadcn)
│   └── config/            # Shared TypeScript configs
├── turbo.json             # Turborepo configuration
└── pnpm-workspace.yaml    # pnpm workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9+ (`npm install -g pnpm`)

### Installation

```bash
# Install all dependencies
pnpm install
```

### Environment Setup

Create a `.env` file in the root (or copy from `.env.example`):

```env
# Turso Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### Development

```bash
# Run both frontend and backend in development mode
pnpm dev

# Or run specific apps:
pnpm --filter @wallet-os/frontend dev
pnpm --filter @wallet-os/backend dev
```

### Database

```bash
# Push schema to database
pnpm --filter @wallet-os/backend db:push

# Open Drizzle Studio
pnpm --filter @wallet-os/backend db:studio
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @wallet-os/frontend build
pnpm --filter @wallet-os/backend build
```

## Project Structure

### Apps

- **`apps/frontend`**: React 19 + Vite + TypeScript frontend application
- **`apps/backend`**: Fastify API server with Drizzle ORM

### Packages

- **`packages/shared`**: Shared TypeScript types and utilities
- **`packages/ui`**: Shared UI components (shadcn/ui)
- **`packages/config`**: Shared TypeScript configurations

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v5
- **Backend**: Fastify, Drizzle ORM, Turso (SQLite cloud)
- **AI**: OpenAI API
- **Monorepo**: Turborepo, pnpm workspaces
- **UI**: shadcn/ui components

## Documentation

See [PROJECT.md](./PROJECT.md) for detailed project documentation and phase breakdowns.

## License

MIT










