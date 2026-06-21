import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Server as SocketServer } from 'socket.io';
import db from '../db/db';
import { findByUsername } from '../data/users';
import { authMiddleware } from '../middleware/auth';
import type { User } from '../types/user';

type AuthRequest = Request & { user: User };

export default function createConversationsRouter(io: SocketServer) {
  const router = Router();
  router.use(authMiddleware);

  // GET /api/v1/users/search?username=...
  router.get('/users/search', (req: Request, res: Response): void => {
    const me = (req as AuthRequest).user;
    const { username } = req.query as { username?: string };

    if (!username) {
      res.status(400).json({ message: 'username query param is required' });
      return;
    }

    const found = findByUsername(username);

    if (!found || found.id === me.id) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { id, name, username: uname, email } = found;
    res.json({ user: { id, name, username: uname, email } });
  });

  // GET /api/v1/conversations
  router.get('/conversations', (req: Request, res: Response): void => {
    const me = (req as AuthRequest).user;

    const rows = db.prepare(`
      SELECT
        c.id,
        u.id       AS otherId,
        u.name     AS otherName,
        u.username AS otherUsername,
        u.email    AS otherEmail,
        m.text        AS lastText,
        m.created_at  AS lastCreatedAt
      FROM conversations c
      JOIN conversation_participants cp  ON cp.conversation_id  = c.id AND cp.user_id  = ?
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != ?
      JOIN users u ON u.id = cp2.user_id
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
      )
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `).all(me.id, me.id) as Array<{
      id: number;
      otherId: number;
      otherName: string;
      otherUsername: string;
      otherEmail: string;
      lastText: string | null;
      lastCreatedAt: string | null;
    }>;

    const conversations = rows.map((r) => ({
      id: r.id,
      otherUser: { id: r.otherId, name: r.otherName, username: r.otherUsername, email: r.otherEmail },
      lastMessage: r.lastText ? { text: r.lastText, createdAt: r.lastCreatedAt } : null,
    }));

    res.json({ conversations });
  });

  // GET /api/v1/conversations/:id/messages
  router.get('/conversations/:id/messages', (req: Request, res: Response): void => {
    const me = (req as AuthRequest).user;
    const conversationId = Number(req.params.id);

    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    ).get(conversationId, me.id);

    if (!participant) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const rows = db.prepare(
      'SELECT id, conversation_id, sender_id, text, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    ).all(conversationId) as Array<{
      id: number;
      conversation_id: number;
      sender_id: number;
      text: string;
      created_at: string;
    }>;

    const messages = rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      text: r.text,
      createdAt: r.created_at,
    }));

    res.json({ messages });
  });

  // POST /api/v1/conversations
  router.post('/conversations', (req: Request, res: Response): void => {
    const me = (req as AuthRequest).user;
    const { userId } = req.body as { userId: number };

    if (!userId || userId === me.id) {
      res.status(400).json({ message: 'Invalid userId' });
      return;
    }

    const existing = db.prepare(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ?
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ?
    `).get(me.id, userId) as { id: number } | undefined;

    const otherUser = db.prepare('SELECT id, name, username, email FROM users WHERE id = ?').get(userId) as
      | { id: number; name: string; username: string; email: string }
      | undefined;

    if (!otherUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (existing) {
      res.status(200).json({ conversation: { id: existing.id, otherUser } });
      return;
    }

    const createConversation = db.transaction(() => {
      const { lastInsertRowid } = db.prepare('INSERT INTO conversations DEFAULT VALUES').run();
      const id = lastInsertRowid as number;
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(id, me.id);
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(id, userId);
      return id;
    });

    const id = createConversation();

    // Add both users' sockets to the new conversation room immediately
    io.in(`user:${me.id}`).socketsJoin(`conversation:${id}`);
    io.in(`user:${userId}`).socketsJoin(`conversation:${id}`);

    // Notify the other user so their conversation list updates without refresh
    io.to(`user:${userId}`).emit('new_conversation', {
      conversation: {
        id,
        otherUser: { id: me.id, name: me.name, username: me.username, email: me.email },
      },
    });

    res.status(201).json({ conversation: { id, otherUser } });
  });

  return router;
}
