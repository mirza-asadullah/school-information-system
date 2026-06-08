import api from '../axios';

export interface OpenEduCatConfigPayload {
  school_id: number;
  base_url: string;
  database_name: string;
  username: string;
  password?: string;
  is_active?: boolean;
}

export const openeducatService = {
  list: async (params = {}) => {
    const response = await api.get('/openeducat', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get(`/openeducat/${id}`);
    return response.data;
  },
  create: async (payload: OpenEduCatConfigPayload) => {
    const response = await api.post('/openeducat', payload);
    return response.data;
  },
  update: async (id: number, payload: Partial<OpenEduCatConfigPayload>) => {
    const response = await api.put(`/openeducat/${id}`, payload);
    return response.data;
  },
  remove: async (id: number) => {
    const response = await api.delete(`/openeducat/${id}`);
    return response.data;
  },
  testConnection: async (configId: number) => {
    const response = await api.post('/openeducat/test-connection', { config_id: configId });
    return response.data;
  },
  syncSchools: async (configId: number) => {
    const response = await api.post('/openeducat/sync/schools', { config_id: configId });
    return response.data;
  },
  syncStudents: async (configId: number) => {
    const response = await api.post('/openeducat/sync/students', { config_id: configId });
    return response.data;
  },
  syncCourses: async (configId: number) => {
    const response = await api.post('/openeducat/sync/courses', { config_id: configId });
    return response.data;
  },
  syncEnrollments: async (configId: number) => {
    const response = await api.post('/openeducat/sync/enrollments', { config_id: configId });
    return response.data;
  },
};

