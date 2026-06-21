import { hashSync } from 'bcryptjs';
import db from '../db/db';
import type { User } from '../types/user';

const seedUsers = db.transaction(() => {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (count === 0) {
    db.prepare('INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)').run(
      'Admin', 'admin', 'admin@example.com', hashSync('admin123', 10),
    );
    db.prepare('INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)').run(
      'TestUser', 'testuser', 'user@example.com', hashSync('user123', 10),
    );
  }
});

seedUsers();

export const findByEmail = (email: string): User | undefined =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

export const findById = (id: number): User | undefined =>
  db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;

export const findByUsername = (username: string): User | undefined =>
  db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username) as User | undefined;

export const createUser = (name: string, username: string, email: string, hashedPassword: string): User => {
  const result = db.prepare('INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)').run(
    name, username, email, hashedPassword,
  );
  return findById(result.lastInsertRowid as number)!;
};

export default { findByEmail, findById, findByUsername, createUser };
