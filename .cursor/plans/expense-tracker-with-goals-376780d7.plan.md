<!-- 376780d7-ccdb-436d-bada-3a2719e695e9 d70c8a6c-e493-4c8b-963b-78d09159ab85 -->
# Expense Tracker App Implementation Plan

## Architecture Overview

**Tech Stack:**

- Frontend: React 19 + Vite + TypeScript
- Styling: Tailwind CSS v5 (CSS-only config)
- Backend: Node.js/Fastify API
- Database: Turso (SQLite cloud) with Drizzle ORM
- AI: OpenAI API for budget analysis
- PWA: Service worker + manifest for iPhone native feel

## Project Structure

```
wallet_os/
├── src/
│   ├── client/          # React frontend
│   │   ├── app/         # App shell, routing
│   │   ├── components/  # UI components (shadcn/ui)
│   │   ├── features/    # Feature modules
│   │   │   ├── expenses/
│   │   │   ├── goals/
│   │   │   ├── budget/
│   │   │   └── social/
│   │   ├── lib/         # Utilities, API client
│   │   └── styles/      # Tailwind CSS v5 config
│   ├── server/          # Fastify backend
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (OpenAI, etc.)
│   │   └── db/          # Drizzle setup
│   └── shared/          # Shared types
├── drizzle/             # Migration files
└── public/              # PWA assets, manifest
```

## Database Schema (Drizzle ORM)

**Core Tables:**

- `users` - User accounts (auth, profile)
- `expenses` - Expense entries (amount, date, category, description)
- `goals` - Financial goals (name, target_amount, deadline, month)
- `goal_items` - Individual items within goals (name, price, quantity)
- `shared_goals` - Goal sharing/collaboration (user_id, goal_id, role)
- `budget_suggestions` - AI-generated budget recommendations

**Key Relationships:**

- Expenses → Users (many-to-one)
- Goals → Users (many-to-one)
- Goal Items → Goals (many-to-one)
- Shared Goals → Users + Goals (junction table)

## Implementation Steps

### Phase 1: Project Foundation

1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS v5 with CSS-only config (`@tailwindcss/vite`)
3. Set up Drizzle ORM with Turso connection
4. Create database schema files
5. Configure environment variables (.env template)
6. Set up Express backend server
7. Initialize shadcn/ui component library

### Phase 2: Database & Backend API

1. Define Drizzle schema for all tables
2. Create migration files
3. Build API routes:

   - `/api/expenses` - CRUD operations
   - `/api/goals` - Goal management
   - `/api/goals/:id/items` - Goal item management
   - `/api/budget/analyze` - OpenAI budget analysis
   - `/api/social/goals` - Goal sharing endpoints

4. Implement OpenAI service for budget analysis
5. Add authentication middleware (basic session-based)

### Phase 3: Core UI Components

1. Set up shadcn/ui components (Button, Card, Input, Dialog, etc.)
2. Create mobile-first layout components:

   - Bottom navigation bar
   - Swipeable cards
   - Pull-to-refresh
   - Bottom sheet modals

3. Implement expense entry form with date picker
4. Build expense list with filtering/sorting
5. Create goal creation form with item breakdown
6. Design goal progress visualization

### Phase 4: Features

1. **Expense Tracking:**

   - Add expense with category, amount, date
   - View monthly expense summary
   - Category breakdown charts

2. **Goal Management:**

   - Create goals with target month
   - Add/remove goal items with pricing
   - Track progress toward goal
   - View goal timeline

3. **Budget Analysis:**

   - OpenAI integration to analyze past expenses
   - Generate smart budget allocation
   - Suggest adjustments for goals

4. **Social Features:**

   - Share goals with other users
   - Collaborative goal tracking
   - Shared expense contributions

### Phase 5: PWA & Mobile Optimization

1. Create web app manifest (iOS-friendly)
2. Implement service worker for offline support
3. Add iOS-specific meta tags (apple-touch-icon, etc.)
4. Configure viewport and mobile optimizations
5. Add gesture handlers (swipe, pull-to-refresh)
6. Implement smooth animations with CSS transitions
7. Test on iPhone Safari

### Phase 6: Polish & Animations

1. Add subtle micro-interactions
2. Implement loading states
3. Error handling and user feedback
4. Optimize performance for mobile
5. Accessibility improvements

## Key Files to Create

**Backend:**

- `src/server/db/schema.ts` - Drizzle schema definitions
- `src/server/db/index.ts` - Database connection
- `src/server/index.ts` - Express server setup
- `src/server/services/openai.ts` - OpenAI budget analysis
- `src/server/routes/*.ts` - API route handlers

**Frontend:**

- `src/client/app/App.tsx` - Main app component
- `src/client/features/expenses/ExpenseTracker.tsx`
- `src/client/features/goals/GoalManager.tsx`
- `src/client/features/budget/BudgetAnalyzer.tsx`
- `src/client/lib/api.ts` - API client
- `src/client/styles/app.css` - Tailwind CSS v5 config

**Config:**

- `vite.config.ts` - Vite + Tailwind plugin
- `drizzle.config.ts` - Drizzle Kit config
- `public/manifest.json` - PWA manifest
- `.env.example` - Environment variables template

## Technical Considerations

- **Mobile-First:** All components designed for touch interactions first
- **Animations:** Use CSS transitions and Tailwind's animation utilities
- **Offline:** Service worker caches API responses
- **Type Safety:** Full TypeScript coverage with shared types
- **Performance:** Code splitting, lazy loading for routes
- **Security:** API keys stored server-side only, user sessions

## Dependencies to Install

**Core:**

- react, react-dom, react-router-dom
- @vitejs/plugin-react
- typescript, @types/node

**Styling:**

- tailwindcss@next, @tailwindcss/vite
- tailwindcss-animate (for shadcn)

**Backend:**

- express, @types/express
- drizzle-orm, drizzle-kit
- @libsql/client
- openai
- dotenv

**PWA:**

- vite-plugin-pwa

**UI Components:**

- shadcn/ui components (installed via CLI)