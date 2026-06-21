import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../auth/authSlice';
import conversationsReducer from '../../features/conversations/conversationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
