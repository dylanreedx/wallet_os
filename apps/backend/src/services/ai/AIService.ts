import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

export interface AISkill {
  name: string;
  description: string;
  execute: (context: any, params: any) => Promise<any>;
}

export class AIService {
  private openai: OpenAIProvider;
  private skills: Map<string, AISkill> = new Map();
  private modelId: string = 'gpt-5-nano';

  constructor() {
    this.openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  registerSkill(skill: AISkill) {
    this.skills.set(skill.name, skill);
    console.log(`[Brain] Registered skill: ${skill.name}`);
  }

  getSkill(name: string): AISkill | undefined {
    return this.skills.get(name);
  }

  getModel(): LanguageModel {
    return this.openai(this.modelId);
  }

  async processIntent(intent: string, context: any): Promise<any> {
    // This is a simplified router. In a full agent, this would use the LLM 
    // to decide which tool/skill to call based on the intent.
    // For now, we'll assume direct skill invocation or simple routing.
    
    console.log(`[Brain] Processing intent: ${intent}`);
    
    // Mock routing for now
    if (intent === 'categorize_expense') {
      const skill = this.getSkill('categorize');
      if (skill) {
        return await skill.execute(context, {});
      }
    }

    return null;
  }
}

export const aiService = new AIService();
