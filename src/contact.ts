import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Client sends inquiry to photographer
export async function sendContactRequest(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'client') return c.json({ error: 'Only clients can send inquiries' }, 403);

  const photographerId = c.req.param('id');
  const { message } = await c.req.json();

  const photographer = await c.env.unilens_db.prepare(
    `SELECT id FROM users WHERE id = ? AND role = 'photographer'`
  ).bind(photographerId).first();
  if (!photographer) return c.json({ error: 'Photographer not found' }, 404);

  // Prevent duplicate pending requests
  const existing = await c.env.unilens_db.prepare(
    `SELECT id FROM contact_requests WHERE client_id = ? AND photographer_id = ? AND status = 'pending'`
  ).bind(user.id, photographerId).first();
  if (existing) return c.json({ error: 'You already have a pending request with this photographer' }, 409);

  const id = crypto.randomUUID();
  await c.env.unilens_db.prepare(
    `INSERT INTO contact_requests (id, client_id, photographer_id, message) VALUES (?, ?, ?, ?)`
  ).bind(id, user.id, photographerId, message ?? null).run();

  return c.json({ success: true });
}

// Photographer accepts → writes interaction row, unlocking rating
export async function acceptContactRequest(c: AppContext) {
  const user = c.get('user');
  const id = c.req.param('id');

  const req = await c.env.unilens_db.prepare(
    `SELECT * FROM contact_requests WHERE id = ? AND photographer_id = ?`
  ).bind(id, user.id).first<{ client_id: string; photographer_id: string }>();
  if (!req) return c.json({ error: 'Request not found' }, 404);

  await c.env.unilens_db.prepare(
    `UPDATE contact_requests SET status = 'accepted' WHERE id = ?`
  ).bind(id).run();

  await c.env.unilens_db.prepare(
    `INSERT OR IGNORE INTO interactions (photographer_id, client_id) VALUES (?, ?)`
  ).bind(req.photographer_id, req.client_id).run();

  return c.json({ success: true });
}

// Photographer declines
export async function declineContactRequest(c: AppContext) {
  const user = c.get('user');
  const id = c.req.param('id');

  const req = await c.env.unilens_db.prepare(
    `SELECT id FROM contact_requests WHERE id = ? AND photographer_id = ?`
  ).bind(id, user.id).first();
  if (!req) return c.json({ error: 'Request not found' }, 404);

  await c.env.unilens_db.prepare(
    `UPDATE contact_requests SET status = 'declined' WHERE id = ?`
  ).bind(id).run();

  return c.json({ success: true });
}