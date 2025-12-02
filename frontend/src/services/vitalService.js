import api from './api';

export const vitalService = {
  getVitals: async () => {
    const { data } = await api.get('/vitals');
    return data;
  },

  getPatientVitals: async (patientId) => {
    const { data } = await api.get(`/vitals/patient/${patientId}`);
    return data;
  },

  addVital: async (vitalData) => {
    const { data } = await api.post('/vitals', vitalData);
    return data;
  },

  deleteVital: async (id) => {
    const { data } = await api.delete(`/vitals/${id}`);
    return data;
  }
};
