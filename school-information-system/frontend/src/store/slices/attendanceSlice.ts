import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { attendanceService } from '../../api/services/attendanceService';

interface AttendanceState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAttendance = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'attendance/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await attendanceService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch attendance'
      );
    }
  }
);

export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items ?? action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default attendanceSlice.reducer;
