export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string | null;
  date: Date;
  createdAt: Date;
}

export interface Goal {
  id: number;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  targetMonth: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalItem {
  id: number;
  goalId: number;
  name: string;
  price: number;
  quantity: number;
  purchased: boolean;
  createdAt: Date;
}

export interface SharedGoal {
  id: number;
  goalId: number;
  userId: number;
  role: 'viewer' | 'contributor' | 'owner';
  createdAt: Date;
}

export interface BudgetSuggestion {
  id: number;
  userId: number;
  month: string;
  suggestions: any;
  createdAt: Date;
}
