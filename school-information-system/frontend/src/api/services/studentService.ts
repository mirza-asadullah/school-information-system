import api from '../axios';

export const studentService = {
  list: async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/students', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/students/${id}`, payload);
    return response.data;
  },
};
