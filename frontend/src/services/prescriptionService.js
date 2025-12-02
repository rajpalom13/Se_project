import api from './api';

export const prescriptionService = {
  getMyPrescriptions: async () => {
    const { data } = await api.get('/prescriptions/my');
    return data;
  },

  getPatientPrescriptions: async (patientId) => {
    const { data } = await api.get(`/prescriptions/patient/${patientId}`);
    return data;
  },

  addPrescription: async (formData) => {
    const { data } = await api.post('/prescriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }
};
