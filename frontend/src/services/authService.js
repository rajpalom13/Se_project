import api from './api';

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  signup: async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  getDoctors: async () => {
    const { data } = await api.get('/auth/doctors');
    return data;
  },

  getMyDoctors: async () => {
    const { data } = await api.get('/auth/my-doctors');
    return data;
  },

  getPatients: async () => {
    const { data } = await api.get('/auth/patients');
    return data;
  }
};
