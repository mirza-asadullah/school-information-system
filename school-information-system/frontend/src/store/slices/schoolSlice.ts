import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { schoolService } from '../../api/services/schoolService';

interface SchoolState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: SchoolState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchSchools = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'schools/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await schoolService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch schools'
      );
    }
  }
);

export const schoolSlice = createSlice({
  name: 'schools',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchSchools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default schoolSlice.reducer;
