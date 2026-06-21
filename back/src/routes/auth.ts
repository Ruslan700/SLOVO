import type { Request, Response } from 'express';
import { Router } from 'express';
import { compareSync, hashSync } from 'bcryptjs';
import { findByEmail, findByUsername, createUser } from '../data/users';
import { authMiddleware } from '../middleware/auth';
import type { User } from '../types/user';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400).json({ message: 'Name, username, email and password are required' });
    return;
  }

  if (findByUsername(username)) {
    res.status(409).json({ message: 'Username is already taken' });
    return;
  }

  if (findByEmail(email)) {
    res.status(409).json({ message: 'Email is already taken' });
    return;
  }

  const user = createUser(name, username, email, hashSync(password, 10));

  res.cookie('session_user_id', user.id.toString(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  });

  const { password: _, ...publicUser } = user;
  res.status(201).json({ user: publicUser });
});

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = findByEmail(email);

  if (!user || !compareSync(password, user.password)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  // Set session cookie
  res.cookie('session_user_id', user.id.toString(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });

  // Return user without password
  const { password: _, ...publicUser } = user;
  res.status(200).json({ user: publicUser });
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as Request & { user: User }).user;
  const { password: _, ...publicUser } = user;
  res.status(200).json({ user: publicUser });
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, (req: Request, res: Response): void => {
  res.clearCookie('session_user_id');
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
