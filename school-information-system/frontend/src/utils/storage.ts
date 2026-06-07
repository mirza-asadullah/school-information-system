const ACCESS_TOKEN_KEY = 'sis_access_token';
const THEME_KEY = 'sis_theme_mode';

export const tokenService = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
};

export const themeService = {
  getTheme: (): 'light' | 'dark' => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  },
  setTheme: (mode: 'light' | 'dark') => localStorage.setItem(THEME_KEY, mode),
};
