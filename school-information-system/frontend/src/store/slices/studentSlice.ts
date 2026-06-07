import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { studentService } from '../../api/services/studentService';

interface StudentState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchStudents = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'students/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await studentService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch students'
      );
    }
  }
);

export const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default studentSlice.reducer;
