import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { openeducatService } from '../../api/services/openeducatService';

interface OpeneducatState {
  config: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: OpeneducatState = {
  config: null,
  loading: false,
  error: null,
};

export const fetchOpeneducatConfig = createAsyncThunk('openeducat/fetchConfig', async (params: any | undefined, { rejectWithValue }) => {
  try {
    const data = await openeducatService.list(params);
    return data.items?.[0] || null;
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch OpenEduCat configuration');
  }
});

export const openeducatSlice = createSlice({
  name: 'openeducat',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchOpeneducatConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpeneducatConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchOpeneducatConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default openeducatSlice.reducer;
