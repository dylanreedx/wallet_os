import { db, schema } from '../src/db/index.js';
import { isNull, eq } from 'drizzle-orm';

/**
 * Seed script to assign random colors to existing expenses that don't have colors
 * Run with: npx tsx apps/backend/scripts/assign-expense-colors.ts
 */

// Friendly, accessible color palette with strong borders and pastel backgrounds
const EXPENSE_COLORS = [
  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Amber
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }, // Blue
  { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' }, // Purple
  { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' }, // Pink
  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Emerald
  { bg: '#FED7AA', border: '#F97316', text: '#9A3412' }, // Orange
  { bg: '#F3E8FF', border: '#9333EA', text: '#581C87' }, // Violet
  { bg: '#CCFBF1', border: '#14B8A6', text: '#134E4A' }, // Teal
  { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }, // Red
  { bg: '#F0FDF4', border: '#22C55E', text: '#166534' }, // Green
];

function getRandomColor() {
  return EXPENSE_COLORS[Math.floor(Math.random() * EXPENSE_COLORS.length)];
}

async function assignColors() {
  console.log('🎨 Starting color assignment script...');

  try {
    // Find all expenses without colors
    const expensesWithoutColors = await db
      .select()
      .from(schema.expenses)
      .where(isNull(schema.expenses.color));

    if (expensesWithoutColors.length === 0) {
      console.log('✅ All expenses already have colors assigned!');
      return;
    }

    console.log(`Found ${expensesWithoutColors.length} expenses without colors.`);

    // Assign random colors to each expense
    let updated = 0;
    for (const expense of expensesWithoutColors) {
      const colorData = getRandomColor();
      
      await db
        .update(schema.expenses)
        .set({
          color: JSON.stringify(colorData),
        })
        .where(eq(schema.expenses.id, expense.id));

      updated++;
    }

    console.log(`✅ Successfully assigned colors to ${updated} expenses!`);
    console.log('\n✨ Color assignment completed successfully!');
  } catch (error) {
    console.error('❌ Error running color assignment script:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
assignColors()
  .then(() => {
    console.log('\n✅ Color assignment script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

