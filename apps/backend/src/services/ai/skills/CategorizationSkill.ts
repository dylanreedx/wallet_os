import { AISkill, aiService } from '../AIService';
import { contextEngine } from '../ContextEngine';
import { generateObject } from 'ai';
import { z } from 'zod';

export class CategorizationSkill implements AISkill {
  name = 'categorize';
  description = 'Categorizes an expense based on description and amount';

  async execute(context: any, params: any): Promise<string> {
    const { description, amount, userId } = context;

    // 1. Get User Context (History)
    const userContext = await contextEngine.getUserContext(userId);
    const recentExpenses = userContext.recentExpenses;

    // 2. Construct Few-Shot Prompt
    let prompt = `Task: Categorize the following expense.\n\n`;
    
    prompt += `User's recent history (for context):\n`;
    recentExpenses.forEach((exp) => {
      if (exp.category) {
        prompt += `- "${exp.description}" ($${exp.amount}) -> ${exp.category}\n`;
      }
    });

    prompt += `\nNew Expense:\n`;
    prompt += `Description: "${description}"\n`;
    prompt += `Amount: $${amount}\n`;

    // 3. Call LLM with Structured Output
    try {
      const { object } = await generateObject({
        model: aiService.getModel(),
        schema: z.object({
          category: z.string().describe('The category of the expense (e.g., Food, Transport, Utilities)'),
          confidence: z.number().describe('Confidence score between 0 and 1'),
        }),
        system: 'You are a financial assistant. Your job is to categorize expenses accurately based on the user\'s history and the description.',
        prompt: prompt,
      });

      console.log(`[Brain] Categorized "${description}" as "${object.category}" (confidence: ${object.confidence})`);
      return object.category;
    } catch (error) {
      console.error('[Brain] Error generating categorization:', error);
      return 'Uncategorized';
    }
  }
}

export const categorizationSkill = new CategorizationSkill();
