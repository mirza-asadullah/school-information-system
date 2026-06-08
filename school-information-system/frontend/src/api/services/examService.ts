import api from '../axios';

export const examService = {
  list: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/exams', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/exams/${id}`, payload);
    return response.data;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },
};
