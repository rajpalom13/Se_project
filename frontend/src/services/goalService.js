import api from './api';

export const goalService = {
  getGoals: async () => {
    const { data } = await api.get('/goals');
    return data;
  },

  addGoal: async (goalData) => {
    const { data } = await api.post('/goals', goalData);
    return data;
  },

  updateProgress: async (id, progress) => {
    const { data } = await api.put(`/goals/${id}`, { progress });
    return data;
  },

  deleteGoal: async (id) => {
    const { data } = await api.delete(`/goals/${id}`);
    return data;
  }
};
