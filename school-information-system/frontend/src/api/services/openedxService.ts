import api from '../axios';

export const openedxService = {
  getConfig: async () => {
    const response = await api.get('/openedx/config');
    return response.data;
  },
  syncCourses: async () => {
    const response = await api.post('/openedx/sync/courses');
    return response.data;
  },
  syncLearners: async () => {
    const response = await api.post('/openedx/sync/learners');
    return response.data;
  },
};
