import api from '../axios';

export const enrollmentService = {
  list: async (params = {}) => {
    const response = await api.get('/enrollments', { params });
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/enrollments', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/enrollments/${id}`, payload);
    return response.data;
  },
};
