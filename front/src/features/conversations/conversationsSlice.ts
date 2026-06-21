import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../core/store/store';

export type OtherUser = { id: number; name: string; username: string; email: string };
export type Conversation = {
  id: number;
  otherUser: OtherUser;
  lastMessage?: { text: string; createdAt: string };
};
export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: string;
};

type ConversationsState = {
  list: Conversation[];
  activeId: number | null;
  messages: Record<number, Message[]>;
  unreadCounts: Record<number, number>;
  searchResult: OtherUser | null;
  searchStatus: 'idle' | 'loading' | 'not_found';
  status: 'idle' | 'loading';
  error: string | null;
};

const initialState: ConversationsState = {
  list: [],
  activeId: null,
  messages: {},
  unreadCounts: {},
  searchResult: null,
  searchStatus: 'idle',
  status: 'idle',
  error: null,
};

export const fetchConversations = createAsyncThunk<Conversation[]>(
  'conversations/fetchAll',
  async () => {
    const res = await fetch('/api/v1/conversations', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json() as { conversations: Conversation[] };
    return data.conversations;
  },
);

export const fetchMessages = createAsyncThunk<{ conversationId: number; messages: Message[] }, number>(
  'conversations/fetchMessages',
  async (conversationId) => {
    const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch messages');
    const data = await res.json() as { messages: Message[] };
    return { conversationId, messages: data.messages };
  },
);

export const searchUser = createAsyncThunk<OtherUser | null, string>(
  'conversations/searchUser',
  async (username) => {
    const res = await fetch(`/api/v1/users/search?username=${encodeURIComponent(username)}`, { credentials: 'include' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json() as { user: OtherUser };
    return data.user;
  },
);

export const startConversation = createAsyncThunk<Conversation, number>(
  'conversations/start',
  async (userId) => {
    const res = await fetch('/api/v1/conversations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    const data = await res.json() as { conversation: Conversation };
    return data.conversation;
  },
);

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<number | null>) {
      state.activeId = action.payload;
      if (action.payload != null) {
        state.unreadCounts[action.payload] = 0;
      }
    },
    addMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      if (!state.messages[msg.conversationId]) {
        state.messages[msg.conversationId] = [];
      }
      const exists = state.messages[msg.conversationId].some((m) => m.id === msg.id);
      if (!exists) {
        state.messages[msg.conversationId].push(msg);
      }
      const conv = state.list.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = { text: msg.text, createdAt: msg.createdAt };
      }
      if (state.activeId !== msg.conversationId) {
        state.unreadCounts[msg.conversationId] = (state.unreadCounts[msg.conversationId] ?? 0) + 1;
      }
    },
    markAsRead(state, action: PayloadAction<number>) {
      state.unreadCounts[action.payload] = 0;
    },
    clearSearch(state) {
      state.searchResult = null;
      state.searchStatus = 'idle';
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      const conv = action.payload;
      if (!state.list.some((c) => c.id === conv.id)) {
        state.list.unshift(conv);
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchConversations.pending, (state) => { state.status = 'loading'; });
    b.addCase(fetchConversations.fulfilled, (state, action) => {
      state.list = action.payload;
      state.status = 'idle';
    });
    b.addCase(fetchConversations.rejected, (state, action) => {
      state.status = 'idle';
      state.error = action.error.message ?? 'Error loading conversations';
    });

    b.addCase(fetchMessages.fulfilled, (state, action) => {
      state.messages[action.payload.conversationId] = action.payload.messages;
    });

    b.addCase(searchUser.pending, (state) => {
      state.searchStatus = 'loading';
      state.searchResult = null;
    });
    b.addCase(searchUser.fulfilled, (state, action) => {
      state.searchResult = action.payload;
      state.searchStatus = action.payload ? 'idle' : 'not_found';
    });
    b.addCase(searchUser.rejected, (state) => {
      state.searchResult = null;
      state.searchStatus = 'not_found';
    });

    b.addCase(startConversation.fulfilled, (state, action) => {
      const conv = action.payload;
      if (!state.list.some((c) => c.id === conv.id)) {
        state.list.unshift(conv);
      }
      state.activeId = conv.id;
    });
  },
});

export const { setActiveConversation, addMessage, clearSearch, addConversation, markAsRead } = conversationsSlice.actions;

export const selectConversations = (s: RootState) => s.conversations.list;
export const selectActiveId = (s: RootState) => s.conversations.activeId;
export const selectActiveConversation = (s: RootState) => {
  const id = s.conversations.activeId;
  return id != null ? (s.conversations.list.find((c) => c.id === id) ?? null) : null;
};
export const selectMessages = (conversationId: number) => (s: RootState) =>
  s.conversations.messages[conversationId] ?? [];
export const selectSearchResult = (s: RootState) => s.conversations.searchResult;
export const selectSearchStatus = (s: RootState) => s.conversations.searchStatus;
export const selectUnreadCount = (conversationId: number) => (s: RootState) =>
  s.conversations.unreadCounts[conversationId] ?? 0;

export default conversationsSlice.reducer;
