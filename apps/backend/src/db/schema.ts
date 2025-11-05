import {
  sqliteTable,
  text,
  integer,
  real,
  unique,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  monthlyIncome: real('monthly_income'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  goalId: integer('goal_id').references(() => goals.id, {
    onDelete: 'set null',
  }),
  goalItemId: integer('goal_item_id').references(() => goalItems.id, {
    onDelete: 'set null',
  }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  deadline: integer('deadline', { mode: 'timestamp' }).notNull(),
  targetMonth: text('target_month'), // YYYY-MM format
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const goalItems = sqliteTable('goal_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goalId: integer('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull().default(1),
  purchased: integer('purchased', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sharedGoals = sqliteTable(
  'shared_goals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    goalId: integer('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull().default('viewer'), // viewer, contributor, owner
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueGoalUser: unique().on(table.goalId, table.userId),
  })
);

export const budgetSuggestions = sqliteTable(
  'budget_suggestions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    month: text('month').notNull(), // YYYY-MM format
    suggestions: text('suggestions').notNull(), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueUserMonth: unique().on(table.userId, table.month),
  })
);

export const monthlyExpenses = sqliteTable('monthly_expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalItem = typeof goalItems.$inferSelect;
export type NewGoalItem = typeof goalItems.$inferInsert;
export type SharedGoal = typeof sharedGoals.$inferSelect;
export type NewSharedGoal = typeof sharedGoals.$inferInsert;
export type BudgetSuggestion = typeof budgetSuggestions.$inferSelect;
export type NewBudgetSuggestion = typeof budgetSuggestions.$inferInsert;
export type MonthlyExpense = typeof monthlyExpenses.$inferSelect;
export type NewMonthlyExpense = typeof monthlyExpenses.$inferInsert;
