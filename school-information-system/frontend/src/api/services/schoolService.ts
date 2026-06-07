import api from '../axios';

export const schoolService = {
  list: async (params = {}) => {
    const response = await api.get('/schools', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/schools/${id}`);
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/schools', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/schools/${id}`, payload);
    return response.data;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/schools/${id}`);
    return response.data;
  },
};
