import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '../../api/services/dashboardService';
import type { DashboardMetrics } from '../../types';

interface DashboardState {
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  metrics: {
    totalSchools: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalExams: 0,
    totalResults: 0,
    attendanceRate: 0,
  },
  loading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    return await dashboardService.getOverview();
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load dashboard');
  }
});

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;
