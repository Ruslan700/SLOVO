import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import type { User } from '../../shared/types/user';

type AuthState = {
  user: User | null;
  isInitialized: boolean;
  status: 'idle' | 'loading';
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  isInitialized: false,
  status: 'idle',
  error: null,
};

export const fetchMe = createAsyncThunk<User | null>('auth/fetchMe', async () => {
  const res = await fetch('/api/v1/auth/me', { method: 'GET', credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch current user');
  const data = await res.json() as { user: User };
  return data.user;
});

export const login = createAsyncThunk<User, { email: string; password: string }>(
  'auth/login',
  async (body) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      throw new Error(err.message ?? 'Login failed');
    }
    const data = await res.json() as { user: User };
    return data.user;
  },
);

export const register = createAsyncThunk<User, { name: string; username: string; email: string; password: string }>(
  'auth/register',
  async (body) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      throw new Error(err.message ?? 'Registration failed');
    }
    const data = await res.json() as { user: User };
    return data.user;
  },
);

export const logout = createAsyncThunk<void, void>('auth/logout', async () => {
  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (state) => { state.status = 'loading'; });
    b.addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isInitialized = true;
      state.status = 'idle';
      state.error = null;
    });
    b.addCase(fetchMe.rejected, (state, action) => {
      state.user = null;
      state.isInitialized = true;
      state.status = 'idle';
      state.error = action.error.message ?? 'Failed to load session';
    });

    b.addCase(login.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    b.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isInitialized = true;
      state.status = 'idle';
      state.error = null;
    });
    b.addCase(login.rejected, (state, action) => {
      state.status = 'idle';
      state.error = action.error.message ?? 'Login failed';
    });

    b.addCase(register.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    b.addCase(register.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isInitialized = true;
      state.status = 'idle';
      state.error = null;
    });
    b.addCase(register.rejected, (state, action) => {
      state.status = 'idle';
      state.error = action.error.message ?? 'Registration failed';
    });

    b.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.error = null;
    });
  },
});

export const selectUser = (s: RootState) => s.auth.user;
export const selectIsAuthenticated = (s: RootState) => Boolean(s.auth.user);
export const selectAuthInitialized = (s: RootState) => s.auth.isInitialized;
export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectAuthError = (s: RootState) => s.auth.error;

export default authSlice.reducer;
