import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { courseService } from '../../api/services/courseService';

interface CourseState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCourses = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'courses/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await courseService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch courses'
      );
    }
  }
);

export const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default courseSlice.reducer;
