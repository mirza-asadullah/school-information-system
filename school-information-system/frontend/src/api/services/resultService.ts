import api from '../axios';

export const resultService = {
  list: async (params = {}) => {
    const response = await api.get('/results', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/results/${id}`);
    return response.data;
  },
  create: async (payload: object) => {
    const response = await api.post('/results', payload);
    return response.data;
  },
  update: async (id: string, payload: object) => {
    const response = await api.put(`/results/${id}`, payload);
    return response.data;
  },
};
