import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import dashboardReducer from './slices/dashboardSlice';
import schoolReducer from './slices/schoolSlice';
import studentReducer from './slices/studentSlice';
import courseReducer from './slices/courseSlice';
import enrollmentReducer from './slices/enrollmentSlice';
import attendanceReducer from './slices/attendanceSlice';
import examReducer from './slices/examSlice';
import resultReducer from './slices/resultSlice';
import openedxReducer from './slices/openedxSlice';
import openeducatReducer from './slices/openeducatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    dashboard: dashboardReducer,
    schools: schoolReducer,
    students: studentReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
    attendance: attendanceReducer,
    exams: examReducer,
    results: resultReducer,
    openedx: openedxReducer,
    openeducat: openeducatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
