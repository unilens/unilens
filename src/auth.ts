import { Context, Next } from 'hono';
import { Env, Variables } from './types';
import * as bcrypt from 'bcryptjs';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// ---- REGISTER ----
export async function register(c: Context) {
  const { email, password, name, role } = await c.req.json();

  if (!['photographer', 'client'].includes(role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  const db = c.env.unilens_db;
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already in use' }, 409);

  const id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(password, 10);

  await db.prepare(
    'INSERT INTO users (id, email, role, name, password_hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, role, name, password_hash).run();

  return c.json({ success: true }, 201);
}

// ---- LOGIN ----
export async function login(c: Context) {
  const { email, password } = await c.req.json();
  const db = c.env.unilens_db;

  const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(token, user.id as string, { expirationTtl: 60 * 60 * 24 * 7 }); // 7 days

  c.header('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`);
  return c.json({ success: true });
}

// ---- MIDDLEWARE ----
export async function requireAuth(c: Context, next: Next) {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie.split(';').find(s => s.trim().startsWith('session='))?.split('=')[1];

  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const userId = await c.env.SESSIONS.get(token);
  if (!userId) return c.json({ error: 'Session expired' }, 401);

  const user = await c.env.unilens_db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 401);

  c.set('user', user);
  await next();
}