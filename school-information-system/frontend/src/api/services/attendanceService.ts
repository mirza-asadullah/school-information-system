import api from '../axios';

export const attendanceService = {
  list: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/attendance', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/attendance/${id}`, payload);
    return response.data;
  },
};
