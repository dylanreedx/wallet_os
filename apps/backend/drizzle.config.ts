import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/dbSchema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  verbose: true,
  strict: false,
} satisfies Config;
