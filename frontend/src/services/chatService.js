import api from './api';

export const chatService = {
  getConversation: async (userId) => {
    const { data } = await api.get(`/messages/${userId}`);
    return data;
  },

  sendMessage: async (receiverId, content) => {
    const { data } = await api.post('/messages', { receiverId, content });
    return data;
  }
};
