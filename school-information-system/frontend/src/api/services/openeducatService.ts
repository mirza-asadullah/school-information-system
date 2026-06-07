import api from '../axios';

export const openeducatService = {
  getConfig: async () => {
    const response = await api.get('/openeducat/config');
    return response.data;
  },
  syncSchools: async () => {
    const response = await api.post('/openeducat/sync/schools');
    return response.data;
  },
  syncStudents: async () => {
    const response = await api.post('/openeducat/sync/students');
    return response.data;
  },
  syncCourses: async () => {
    const response = await api.post('/openeducat/sync/courses');
    return response.data;
  },
  syncEnrollments: async () => {
    const response = await api.post('/openeducat/sync/enrollments');
    return response.data;
  },
};
