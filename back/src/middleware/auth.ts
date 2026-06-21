import type { Request, Response, NextFunction } from 'express';
import { findById } from '../data/users';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.cookies?.session_user_id as string | undefined;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!/^\d+$/.test(userId)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const parsed = Number.parseInt(userId, 10);
  if (!Number.isSafeInteger(parsed)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = findById(parsed);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // Attach user to request
  (req as Request & { user: typeof user }).user = user;
  next();
};
