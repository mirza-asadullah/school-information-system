import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { openedxService } from '../../api/services/openedxService';

interface OpenedxState {
  config: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: OpenedxState = {
  config: null,
  loading: false,
  error: null,
};

export const fetchOpenedxConfig = createAsyncThunk('openedx/fetchConfig', async (_, { rejectWithValue }) => {
  try {
    return await openedxService.getConfig();
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch Open edX configuration');
  }
});

export const openedxSlice = createSlice({
  name: 'openedx',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchOpenedxConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpenedxConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchOpenedxConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default openedxSlice.reducer;
