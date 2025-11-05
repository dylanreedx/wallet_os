# Wallet OS - Expense Tracker Project

**Source of Truth Document** - Last Updated: 2025-11-03

## Project Overview

Wallet OS is a mobile-first Progressive Web App (PWA) for tracking expenses and managing financial goals. Goals represent items you want to buy - the app tracks spending toward these goals, helps you understand spending patterns, and get on track to afford the things that matter to you. Features include AI-powered budget analysis and social collaboration.

### Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v5 (CSS-only config, no JS config)
- **Backend**: Fastify (Node.js)
- **Database**: Turso (SQLite cloud) with Drizzle ORM
- **AI**: OpenAI API for budget analysis
- **UI Components**: shadcn/ui
- **PWA**: vite-plugin-pwa

## Project Status

### ✅ Completed Phases

#### Phase 1: Foundation & Setup

- [x] Vite + React + TypeScript project initialized
- [x] Tailwind CSS v5 configured (CSS-only, no JS config)
- [x] Drizzle ORM setup with Turso connection
- [x] Database schema defined (users, expenses, goals, goal_items, shared_goals, budget_suggestions)
- [x] Expense-goal relationship added (goalId, goalItemId in expenses table)
- [x] Fastify backend server setup
- [x] shadcn/ui component library initialized
- [x] Environment variables template created
- [x] TypeScript configuration with path aliases
- [x] PWA manifest configured

#### Phase 2: Backend API & Services

- [x] Authentication routes (`/api/auth/login`, `/api/auth/logout`)
- [x] Expenses routes - Full CRUD (`/api/expenses`)
- [x] Goals routes - Full CRUD (`/api/goals`)
- [x] Goal Items routes - Full CRUD (`/api/goals/:id/items`)
- [x] Budget analysis route (`/api/budget/analyze`)
- [x] Budget suggestions route (`/api/budget/suggestions`)
- [x] Social sharing routes (`/api/social/goals/*`)
- [x] OpenAI service for budget analysis
- [x] Basic session-based authentication middleware
- [x] Database connection tested and working

#### Phase 3: Frontend Foundation

- [x] API client with authentication (`src/client/lib/api.ts`)
- [x] Auth context and provider (`src/client/contexts/AuthContext.tsx`)
- [x] Login page (`src/client/features/auth/LoginPage.tsx`)
- [x] Basic dashboard with navigation (`src/client/features/dashboard/Dashboard.tsx`)
- [x] React Router setup with protected routes
- [x] shadcn/ui components installed (Button, Card, Input, Dialog, Form, Label)

#### Phase 4: Core UI Components & Layout (Partial)

- [x] Mobile-first navigation component (bottom nav bar)
- [x] Expense entry form with date picker
- [x] Goal creation form with item breakdown UI
- [x] Goal progress visualization
- [x] Goal timeline view
- [x] Bottom sheet modals for mobile

#### Phase 5: Expense Tracking Features (Partial)

- [x] Add expense form (category, amount, date, description, goal linking)
- [x] Expense filtering by date range
- [x] Expense editing and deletion
- [x] Expense-goal linking (expenses can be linked to goals and goal items)
- [x] Automatic goal progress updates when expenses are linked

#### Phase 6: Goal Management Features (COMPLETE ✅ - 7/7 tickets)

- [x] Create goals for items you want to buy (target month)
- [x] Add/remove goal items with pricing (break down what you need to buy)
- [x] Track spending progress toward goals
- [x] View goal timeline
- [x] Goal progress calculations (auto-updated from linked expenses)
- [x] Goal item purchase tracking (mark items as purchased)
- [x] Goal detail view with item management
- [x] Goal editing
- [x] Goal deletion with confirmation
- [x] Goal statistics dashboard (total goals, completed, active, spending totals, linked expenses)

**Note**: Goals track spending toward items you're planning to buy. When you link expenses to goals, you're tracking money spent on those items, not saving money. The app helps you understand spending patterns and get on track to afford the things that matter.

### 📋 Pending Phases

#### Phase 4: Core UI Components & Layout (Remaining)

- [ ] Category breakdown charts
- [ ] Monthly expense summary view
- [ ] Swipeable cards for mobile gestures
- [ ] Pull-to-refresh functionality

#### Phase 5: Expense Tracking Features (Remaining)

- [ ] View monthly expense summary
- [ ] Category breakdown with charts
- [ ] Expense categories management


#### Phase 7: Budget Analysis Features (56% Complete - 5/9 tickets)

**Completed:**
- [x] OpenAI integration UI (P7-001)
- [x] Display budget suggestions (P7-002)
- [x] Recurring monthly expenses (P7-008 - off-script)
- [x] Budget analysis bug fixes (P7-009 - off-script)
- [x] AI SDK migration & performance (P7-010 - off-script)

**Remaining:**
- [ ] Goal recommendations component (P7-003)
- [ ] Historical spending analysis (P7-004)
- [ ] Budget vs actual comparison (P7-005)
- [ ] Smart alerts (P7-006)

#### Phase 8: Social Features

- [ ] Share goals with other users
- [ ] Collaborative goal tracking
- [ ] Shared expense contributions
- [ ] User invitation system
- [ ] Role management (viewer, contributor, owner)

#### Phase 9: PWA & Mobile Optimization

- [ ] Service worker for offline support
- [ ] iOS-specific meta tags (already in index.html)
- [ ] App icons (pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png)
- [ ] Viewport and mobile optimizations (already configured)
- [ ] Gesture handlers (swipe, pull-to-refresh)
- [ ] Smooth animations with CSS transitions
- [ ] Touch-optimized button sizes (already configured)
- [ ] Test on iPhone Safari

#### Phase 10: Polish & Enhancements

- [ ] Loading states for all async operations
- [ ] Error handling and user feedback
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Form validation with react-hook-form + zod
- [ ] Data persistence and caching
- [ ] Unit tests for critical functions
- [ ] Integration tests for API routes

## Database Schema

### Tables

1. **users**

   - id (PK, auto-increment)
   - email (unique)
   - name
   - created_at, updated_at

2. **expenses**

   - id (PK, auto-increment)
   - user_id (FK → users)
   - amount (real)
   - description
   - category
   - date (timestamp)
   - goal_id (FK → goals, nullable)
   - goal_item_id (FK → goal_items, nullable)
   - created_at

3. **goals**

   - id (PK, auto-increment)
   - user_id (FK → users)
   - name
   - target_amount (real)
   - current_amount (real, default 0)
   - deadline (timestamp)
   - target_month (text, YYYY-MM format)
   - description
   - created_at, updated_at

4. **goal_items**

   - id (PK, auto-increment)
   - goal_id (FK → goals, cascade delete)
   - name
   - price (real)
   - quantity (default 1)
   - purchased (boolean, default false)
   - created_at

5. **shared_goals**

   - id (PK, auto-increment)
   - goal_id (FK → goals, cascade delete)
   - user_id (FK → users)
   - role (viewer|contributor|owner, default viewer)
   - created_at
   - Unique constraint: (goal_id, user_id)

6. **budget_suggestions**
   - id (PK, auto-increment)
   - user_id (FK → users)
   - month (text, YYYY-MM format)
   - suggestions (text, JSON)
   - created_at

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login/create user
- `POST /api/auth/logout` - Logout

### Expenses

- `GET /api/expenses?userId=X&startDate=Y&endDate=Z` - List expenses
- `GET /api/expenses/:id` - Get expense
- `POST /api/expenses` - Create expense (supports goalId, goalItemId)
- `PUT /api/expenses/:id` - Update expense (supports goalId, goalItemId)
- `DELETE /api/expenses/:id` - Delete expense (auto-updates goal progress)

### Goals

- `GET /api/goals?userId=X` - List goals
- `GET /api/goals/:id` - Get goal
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Goal Items

- `GET /api/goals/:id/items` - List goal items
- `GET /api/goals/:goalId/items/:itemId` - Get goal item
- `POST /api/goals/:id/items` - Create goal item
- `PUT /api/goals/:goalId/items/:itemId` - Update goal item
- `DELETE /api/goals/:goalId/items/:itemId` - Delete goal item

### Budget

- `POST /api/budget/analyze` - Analyze budget (uses OpenAI)
- `GET /api/budget/suggestions?userId=X&month=Y` - Get saved suggestions

### Social

- `POST /api/social/goals/share` - Share goal with user
- `GET /api/social/goals?userId=X` - Get shared goals
- `GET /api/social/goals/:goalId/users` - Get users with access
- `PUT /api/social/goals/:goalId/users/:userId` - Update role
- `DELETE /api/social/goals/:goalId/users/:userId` - Unshare goal

## File Structure

```
wallet_os/
├── src/
│   ├── client/              # React frontend
│   │   ├── app/            # App shell, routing
│   │   │   └── App.tsx
│   │   ├── components/     # UI components
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── features/       # Feature modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── expenses/   # TODO
│   │   │   ├── goals/      # TODO
│   │   │   ├── budget/     # TODO
│   │   │   └── social/     # TODO
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── lib/            # Utilities, API client
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── app.css     # Tailwind CSS v5 config
│   ├── server/             # Fastify backend
│   │   ├── routes/         # API routes
│   │   │   ├── auth.ts
│   │   │   ├── expenses.ts
│   │   │   ├── goals.ts
│   │   │   ├── goalItems.ts
│   │   │   ├── budget.ts
│   │   │   └── social.ts
│   │   ├── services/       # Business logic
│   │   │   └── openai.ts
│   │   ├── middleware/     # Middleware
│   │   │   └── auth.ts
│   │   ├── db/             # Database
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   └── index.ts        # Server entry point
│   └── shared/             # Shared types
│       └── types.ts
├── drizzle/                # Migration files (auto-generated)
├── public/                  # Static assets
├── index.html
├── vite.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

Create a `.env` file in the root with:

```env
# Turso Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3001
HOST=0.0.0.0

# Node Environment
NODE_ENV=development
```

## Development Commands

```bash
# Frontend development
npm run dev              # Start Vite dev server

# Backend development
npm run server           # Start Fastify server with tsx watch

# Database
npm run db:generate      # Generate migration files
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio

# Build
npm run build            # Build for production
npm run preview          # Preview production build
```

## Next Steps (Immediate Priorities)

1. **Category Breakdown** - Add charts and visualizations for expenses (P4-004 + P5-007)
2. **Monthly Summary** - Monthly expense summary view (P4-005 + P5-006)
3. **Budget Analysis UI** - OpenAI integration UI for budget analysis (P7-001)
4. **Add PWA assets** - Create app icons (192x192, 512x512, apple-touch-icon) (P9-002)

## Context Transfer Notes

### Key Decisions Made

- Using Fastify instead of Express (faster, better TypeScript support)
- Tailwind CSS v5 with CSS-only config (no JS config file)
- Session-based auth (simple, can be enhanced later)
- OpenAI gpt-5-nano for budget analysis (cost-effective)
- shadcn/ui for components (customizable, accessible)

### Known Issues

- Database push requires manual confirmation (interactive prompt)
- Auth session stored in memory (will be lost on server restart - OK for dev)
- No password authentication (email-only for now)

### Future Enhancements

- Replace in-memory sessions with Redis
- Add password authentication
- Add email verification
- Implement real-time updates with WebSockets
- Add expense receipt scanning/photo upload
- Add recurring expense tracking
- Add budget alerts and notifications

## Testing Checklist

- [ ] Login flow works
- [ ] Can create expenses
- [ ] Can view expense list
- [ ] Can create goals
- [ ] Can add goal items
- [ ] Budget analysis returns suggestions
- [ ] Goals can be shared
- [ ] PWA installs on iPhone
- [ ] Offline mode works (service worker)
- [ ] Mobile gestures work (swipe, pull-to-refresh)

---

**Last Updated**: 2025-11-05
**Status**: Phase 6 Complete (100%), Phase 7 at 56% (5/9 tickets), Off-script work documented
**Next Milestone**: Category Breakdown & Monthly Summary
**Progress**: 46/79 tickets complete (~58%)
