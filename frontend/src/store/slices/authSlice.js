import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Load user from localStorage on init
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('tw_token');
    const user = JSON.parse(localStorage.getItem('tw_user') || 'null');
    return { user, token, isAuthenticated: !!(token && user), loading: false, error: null };
  } catch {
    return { user: null, token: null, isAuthenticated: false, loading: false, error: null };
  }
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/update-profile', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const uploadAvatar = createAsyncThunk('auth/uploadAvatar', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Upload failed');
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Password change failed');
  }
});

// ── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_user');
      delete api.defaults.headers.common['Authorization'];
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('tw_token', token);
      localStorage.setItem('tw_user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    clearError: (state) => { state.error = null; },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('tw_user', JSON.stringify(state.user));
    }
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload;
        state.user = user; state.token = token; state.isAuthenticated = true;
        localStorage.setItem('tw_token', token);
        localStorage.setItem('tw_user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        toast.success(action.payload.message || '🎉 Welcome to TrackWise!');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
        toast.error(action.payload);
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload;
        state.user = user; state.token = token; state.isAuthenticated = true;
        localStorage.setItem('tw_token', token);
        localStorage.setItem('tw_user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        toast.success(action.payload.message || '👋 Welcome back!');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
        toast.error(action.payload);
      });

    // Get me
    builder
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('tw_user', JSON.stringify(action.payload.user));
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null; state.token = null; state.isAuthenticated = false;
        localStorage.removeItem('tw_token'); localStorage.removeItem('tw_user');
      });

    // Update profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('tw_user', JSON.stringify(action.payload.user));
        toast.success('✅ Profile updated!');
      })
      .addCase(updateProfile.rejected, (_, action) => toast.error(action.payload));

    // Upload avatar
    builder
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const filename = action.payload.avatar;
        // Build URL client-side so it's always correct regardless of cached virtualrUrl
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const avatarUrl  = filename ? `${backendUrl}/uploads/avatars/${filename}` : null;
        state.user = { ...state.user, avatar: filename, avatarUrl };
        localStorage.setItem('tw_user', JSON.stringify(state.user));
        toast.success('Profile picture updated!');
      })
      .addCase(uploadAvatar.rejected, (_, action) => toast.error(action.payload));

    // Change password
    builder
      .addCase(changePassword.fulfilled, (_, action) => toast.success(action.payload.message || '🔐 Password changed!'))
      .addCase(changePassword.rejected, (_, action) => toast.error(action.payload));
  }
});

export const { logout, setCredentials, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
