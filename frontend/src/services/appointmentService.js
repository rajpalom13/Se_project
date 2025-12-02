import api from './api';

export const appointmentService = {
  getAppointments: async () => {
    const { data } = await api.get('/appointments');
    return data;
  },

  createAppointment: async (appointmentData) => {
    const { data } = await api.post('/appointments', appointmentData);
    return data;
  },

  updateAppointment: async (id, updates) => {
    const { data } = await api.patch(`/appointments/${id}`, updates);
    return data;
  }
};