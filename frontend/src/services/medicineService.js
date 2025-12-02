import api from './api';

export const medicineService = {
  getMedicines: async () => {
    const { data } = await api.get('/medicines');
    return data;
  },

  addMedicine: async (medicineData) => {
    const { data } = await api.post('/medicines', medicineData);
    return data;
  },

  deleteMedicine: async (id) => {
    const { data } = await api.delete(`/medicines/${id}`);
    return data;
  },

  // Medicine Logs
  logIntake: async (logData) => {
    const { data } = await api.post('/medicine-logs', logData);
    return data;
  },

  getPatientLogs: async (patientId) => {
    const { data } = await api.get(`/medicine-logs/patient/${patientId}`);
    return data;
  },

  addComment: async (logId, comment) => {
    const { data } = await api.put(`/medicine-logs/${logId}/comment`, { comment });
    return data;
  }
};
