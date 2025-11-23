import { api } from './api';

export const brain = {
  categorize: async (data: { description: string; amount: number; date: string }) => {
    const response = await api.post('/api/brain/categorize', data);
    return response;
  },
};
