import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { resultService } from '../../api/services/resultService';

interface ResultState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ResultState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchResults = createAsyncThunk<
  any,
  Record<string, any> | undefined
>(
  'results/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await resultService.list(params ?? {});
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch results'
      );
    }
  }
);

export const resultSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items ?? action.payload;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default resultSlice.reducer;
