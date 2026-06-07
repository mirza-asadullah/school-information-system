import api from '../axios';

export const courseService = {
  list: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/courses', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/courses/${id}`, payload);
    return response.data;
  },
};
