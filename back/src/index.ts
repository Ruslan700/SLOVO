import http from 'http';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import authRoutes from './routes/auth';
import createConversationsRouter from './routes/conversations';
import { findById } from './data/users';
import db from './db/db';

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);

const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

// Mount conversation routes after io is created so they can reference it
app.use('/api/v1', createConversationsRouter(io));

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie ?? '';
  const cookies = parseCookie(cookieHeader);
  const rawId = cookies['session_user_id'];

  if (!rawId || !/^\d+$/.test(rawId)) return next(new Error('Unauthorized'));

  const userId = Number.parseInt(rawId, 10);
  const user = findById(userId);
  if (!user) return next(new Error('Unauthorized'));

  (socket as typeof socket & { userId: number }).userId = user.id;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket as typeof socket & { userId: number }).userId;

  // Join personal room for receiving new_conversation notifications
  socket.join(`user:${userId}`);

  // Auto-join all existing conversation rooms so incoming messages arrive without refresh
  const userRooms = db.prepare(
    'SELECT conversation_id FROM conversation_participants WHERE user_id = ?',
  ).all(userId) as Array<{ conversation_id: number }>;

  for (const { conversation_id } of userRooms) {
    socket.join(`conversation:${conversation_id}`);
  }

  socket.on('join_conversation', ({ conversationId }: { conversationId: number }) => {
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    ).get(conversationId, userId);

    if (!participant) {
      socket.emit('error', { message: 'Forbidden' });
      return;
    }

    socket.join(`conversation:${conversationId}`);
  });

  socket.on('send_message', ({ conversationId, text }: { conversationId: number; text: string }) => {
    if (!text?.trim()) return;

    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    ).get(conversationId, userId);

    if (!participant) {
      socket.emit('error', { message: 'Forbidden' });
      return;
    }

    const { lastInsertRowid } = db.prepare(
      'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
    ).run(conversationId, userId, text.trim());

    const saved = db.prepare('SELECT * FROM messages WHERE id = ?').get(lastInsertRowid) as {
      id: number;
      conversation_id: number;
      sender_id: number;
      text: string;
      created_at: string;
    };

    const message = {
      id: saved.id,
      conversationId: saved.conversation_id,
      senderId: saved.sender_id,
      text: saved.text,
      createdAt: saved.created_at,
    };

    io.to(`conversation:${conversationId}`).emit('new_message', { message });
  });
});

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
