# Phase 12: AI Integration ("The Brain")

## Objective
Implement an intelligent "Brain" for the application that goes beyond simple API calls. This system should be designed as a foundational layer for a future autonomous agent, capable of understanding context, inferring user intent, and proactively managing finances.

## Architecture: The Agentic Brain
The "Brain" will be a distinct service module within the backend, designed with extensibility in mind.

### Core Components
1.  **Context Engine**: Aggregates user data (expenses, goals, location, history) to provide "memory" for the AI.
2.  **Skill Registry**: A modular system where specific capabilities (Categorization, Budgeting, Anomalies) are registered as tools.
3.  **Agent Interface**: A standardized input/output format that allows the frontend (and future interfaces) to communicate with the Brain.

## Tasks

### 12.1 AI Service Foundation
- [ ] Set up `AIService` class with provider abstraction (OpenAI/Anthropic).
- [ ] Implement `ContextEngine` to fetch relevant user history.
- [ ] Create `AgentRouter` to handle different types of "thoughts" or requests.

**Files to create:**
- `apps/backend/src/services/ai/AIService.ts`
- `apps/backend/src/services/ai/ContextEngine.ts`
- `apps/backend/src/services/ai/AgentRouter.ts`

### 12.2 Skill: Smart Categorization
- [ ] Implement `CategorizationSkill` that takes a description + amount and returns a category.
- [ ] Use "Few-Shot Prompting" with user's historical data to learn their habits (e.g., "Caldwell's" = Gas).
- [ ] Expose via `POST /api/brain/categorize`.

**Files to create:**
- `apps/backend/src/services/ai/skills/CategorizationSkill.ts`

### 12.3 Frontend Integration
- [ ] Remove manual category picker from `ExpenseForm`.
- [ ] Implement "Ghost Input" or background inference.
- [ ] Show "Brain's Thought" (e.g., "I see you went to Caldwell's, marking as Gas").

## Success Criteria
- [ ] User types a description, and the category is automatically and correctly selected.
- [ ] The system "learns" from corrections (if user overrides, it's logged for future context).
- [ ] Architecture supports adding new "skills" without rewriting the core logic.
