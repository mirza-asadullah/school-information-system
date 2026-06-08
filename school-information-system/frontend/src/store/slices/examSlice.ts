import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { examService } from '../../api/services/examService';

interface ExamState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchExams = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'exams/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await examService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch exams'
      );
    }
  }
);

export const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items ?? action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default examSlice.reducer;
