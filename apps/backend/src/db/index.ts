import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as schema from './dbSchema';
import path from 'path';

// Load .env from root directory
// When running from apps/backend/, process.cwd() is apps/backend/
// So we need to go up 2 levels to reach root
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

export const db = drizzle(client, { schema });
export { schema };
export { expenses, goals, goalItems, users, magicLinks, budgetSuggestions, monthlyExpenses, sharedGoals } from './dbSchema';

