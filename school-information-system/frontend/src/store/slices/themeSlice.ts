import { createSlice } from '@reduxjs/toolkit';
import { themeService } from '../../utils/storage';
import type { ThemeState } from '../../types';

const initialState: ThemeState = {
  mode: themeService.getTheme(),
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      themeService.setTheme(state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
