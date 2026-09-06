import { createSlice } from '@reduxjs/toolkit';

/* Premium dark-only design — always dark, no light mode toggle */
const applyTheme = () => {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
  localStorage.setItem('tw_theme', 'dark');
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: 'dark' },
  reducers: {
    /* Toggle is a no-op — kept so existing dispatch calls don't crash */
    toggleTheme: (state) => { state.mode = 'dark'; applyTheme(); },
    setTheme:    (state) => { state.mode = 'dark'; applyTheme(); },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
