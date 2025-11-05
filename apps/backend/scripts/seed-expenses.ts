import { db, schema } from '../src/db/index.js';
import { eq } from 'drizzle-orm';

const { monthlyExpenses } = schema;

/**
 * Seed script to create test user with expenses from last month
 * Run with: npx tsx apps/backend/scripts/seed-expenses.ts
 */

const TEST_USER_EMAIL = 'test@walletos.com';
const TEST_USER_NAME = 'Test User';

// Expense data - various categories and amounts
const expenseTemplates = [
  // Food & Dining
  { description: 'Coffee Shop', amount: 5.50, category: 'Food & Dining' },
  { description: 'Lunch', amount: 12.99, category: 'Food & Dining' },
  { description: 'Groceries', amount: 87.45, category: 'Food & Dining' },
  { description: 'Restaurant Dinner', amount: 45.00, category: 'Food & Dining' },
  { description: 'Fast Food', amount: 8.99, category: 'Food & Dining' },
  { description: 'Coffee Shop', amount: 5.50, category: 'Food & Dining' }, // recurring
  { description: 'Lunch', amount: 12.99, category: 'Food & Dining' }, // recurring
  
  // Transportation
  { description: 'Gas Station', amount: 45.00, category: 'Transportation' },
  { description: 'Uber Ride', amount: 18.50, category: 'Transportation' },
  { description: 'Parking', amount: 12.00, category: 'Transportation' },
  { description: 'Gas Station', amount: 45.00, category: 'Transportation' }, // recurring
  
  // Shopping
  { description: 'Clothing Store', amount: 89.99, category: 'Shopping' },
  { description: 'Amazon Purchase', amount: 34.99, category: 'Shopping' },
  { description: 'Electronics Store', amount: 199.99, category: 'Shopping' },
  
  // Entertainment
  { description: 'Movie Tickets', amount: 24.00, category: 'Entertainment' },
  { description: 'Concert', amount: 75.00, category: 'Entertainment' },
  { description: 'Streaming Service', amount: 14.99, category: 'Entertainment' }, // recurring
  
  // Bills & Utilities
  { description: 'Electric Bill', amount: 120.00, category: 'Bills & Utilities' }, // recurring
  { description: 'Water Bill', amount: 45.00, category: 'Bills & Utilities' }, // recurring
  { description: 'Internet Bill', amount: 79.99, category: 'Bills & Utilities' }, // recurring
  
  // Healthcare
  { description: 'Pharmacy', amount: 25.99, category: 'Healthcare' },
  { description: 'Doctor Visit', amount: 150.00, category: 'Healthcare' },
  
  // Travel
  { description: 'Flight Ticket', amount: 350.00, category: 'Travel' },
  { description: 'Hotel Booking', amount: 120.00, category: 'Travel' },
  
  // Personal Care
  { description: 'Haircut', amount: 30.00, category: 'Personal Care' },
  { description: 'Gym Membership', amount: 49.99, category: 'Personal Care' }, // recurring
  
  // Other
  { description: 'Gift', amount: 50.00, category: 'Other' },
  { description: 'Donation', amount: 25.00, category: 'Other' },
];

// Recurring expenses (will be created as monthly expenses)
const recurringExpenses = [
  { name: 'Coffee Shop', amount: 5.50, category: 'Food & Dining' },
  { name: 'Lunch', amount: 12.99, category: 'Food & Dining' },
  { name: 'Gas Station', amount: 45.00, category: 'Transportation' },
  { name: 'Streaming Service', amount: 14.99, category: 'Entertainment' },
  { name: 'Electric Bill', amount: 120.00, category: 'Bills & Utilities' },
  { name: 'Water Bill', amount: 45.00, category: 'Bills & Utilities' },
  { name: 'Internet Bill', amount: 79.99, category: 'Bills & Utilities' },
  { name: 'Gym Membership', amount: 49.99, category: 'Personal Care' },
];

async function seedExpenses() {
  console.log('🌱 Starting seed script...');

  try {
    // Find or create test user
    let user = await db.query.users.findFirst({
      where: eq(schema.users.email, TEST_USER_EMAIL),
    });

    if (!user) {
      console.log('Creating test user...');
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email: TEST_USER_EMAIL,
          name: TEST_USER_NAME,
          monthlyIncome: 5000.00,
        })
        .returning();
      user = newUser;
      console.log(`✅ Created test user: ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`✅ Found existing test user: ${user.email} (ID: ${user.id})`);
    }

    if (!user.id) {
      throw new Error('User ID is missing');
    }

    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Check if expenses already exist for this user from last month
    const existingExpenses = await db.query.expenses.findMany({
      where: eq(schema.expenses.userId, user.id),
    });

    const lastMonthExpenses = existingExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= lastMonth && expDate <= lastMonthEnd;
    });

    if (lastMonthExpenses.length > 0) {
      console.log(`⚠️  Found ${lastMonthExpenses.length} existing expenses from last month. Skipping expense creation.`);
      console.log('   To recreate, delete existing expenses first.');
    } else {
      // Create expenses spread across last month
      console.log('Creating expenses for last month...');
      const expensesToCreate = [];
      
      for (let i = 0; i < expenseTemplates.length; i++) {
        const template = expenseTemplates[i];
        // Distribute expenses across the month
        const daysInMonth = lastMonthEnd.getDate();
        const dayOffset = Math.floor((i / expenseTemplates.length) * daysInMonth);
        const expenseDate = new Date(lastMonth);
        expenseDate.setDate(expenseDate.getDate() + dayOffset);
        
        // Add some randomness to the time
        expenseDate.setHours(Math.floor(Math.random() * 12) + 8);
        expenseDate.setMinutes(Math.floor(Math.random() * 60));

        expensesToCreate.push({
          userId: user.id,
          amount: template.amount,
          description: template.description,
          category: template.category,
          date: expenseDate,
        });
      }

      await db.insert(schema.expenses).values(expensesToCreate);
      console.log(`✅ Created ${expensesToCreate.length} expenses for last month`);
    }

    // Create recurring monthly expenses
    console.log('Creating recurring monthly expenses...');
    const existingMonthly = await db.query.monthlyExpenses.findMany({
      where: eq(monthlyExpenses.userId, user.id),
    });

    if (existingMonthly.length > 0) {
      console.log(`⚠️  Found ${existingMonthly.length} existing monthly expenses. Skipping creation.`);
    } else {
      const monthlyExpensesToCreate = recurringExpenses.map((rec) => ({
        userId: user.id,
        name: rec.name,
        amount: rec.amount,
        category: rec.category,
        description: 'Seeded recurring expense',
        isActive: true,
      }));

      await db.insert(monthlyExpenses).values(monthlyExpensesToCreate);
      console.log(`✅ Created ${monthlyExpensesToCreate.length} recurring monthly expenses`);
    }

    console.log('\n✨ Seed script completed successfully!');
    console.log(`\nYou can now log in with:`);
    console.log(`  Email: ${TEST_USER_EMAIL}`);
    console.log(`  (No password required - email-only auth)`);
  } catch (error) {
    console.error('❌ Error running seed script:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the seed script
seedExpenses()
  .then(() => {
    console.log('\n✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

