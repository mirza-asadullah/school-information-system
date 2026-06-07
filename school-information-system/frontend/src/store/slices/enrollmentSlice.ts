import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { enrollmentService } from '../../api/services/enrollmentService';

interface EnrollmentState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchEnrollments = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'enrollments/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await enrollmentService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch enrollments'
      );
    }
  }
);

export const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default enrollmentSlice.reducer;
