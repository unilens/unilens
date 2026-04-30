import { Context } from 'hono';
import { Env, Variables } from './types';
import { checkRateLimit } from './ratelimit';
import { sendEmail } from './email';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Client sends inquiry to photographer
export async function sendContactRequest(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'client') return c.json({ error: 'Only clients can send inquiries' }, 403);

  const rl = await checkRateLimit(c.env.SESSIONS, String(user.id), 'contact', 5, 3600);
  if (!rl.allowed) return c.json({ error: 'Too many inquiries sent recently. Try again later.' }, 429);

  const photographerId = c.req.param('id');
  const { message } = await c.req.json();

  if (message != null && String(message).length > 1000) {
    return c.json({ error: 'Message must be 1000 characters or fewer' }, 400);
  }

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
  ).bind(id, user.id).first<{ client_id: string; photographer_id: string; status: string }>();
  if (!req) return c.json({ error: 'Request not found' }, 404);
  if (req.status !== 'pending') return c.json({ error: 'Request has already been responded to' }, 409);

  await c.env.unilens_db.prepare(
    `UPDATE contact_requests SET status = 'accepted' WHERE id = ?`
  ).bind(id).run();

  await c.env.unilens_db.prepare(
    `INSERT OR IGNORE INTO interactions (photographer_id, client_id) VALUES (?, ?)`
  ).bind(req.photographer_id, req.client_id).run();

  // Send email — fetch client email and photographer info in parallel
  const [clientRow, photographerRow] = await Promise.all([
    c.env.unilens_db.prepare(`SELECT email, name FROM users WHERE id = ?`)
      .bind(req.client_id).first<{ email: string; name: string }>(),
    c.env.unilens_db.prepare(
      `SELECT u.name, p.slug FROM users u JOIN photographer_profiles p ON p.user_id = u.id WHERE u.id = ?`
    ).bind(req.photographer_id).first<{ name: string; slug: string }>(),
  ]);

  if (clientRow && photographerRow) {
    await sendEmail(
      c.env,
      clientRow.email,
      `Your inquiry to ${photographerRow.name} was accepted`,
      `Hi ${clientRow.name},\n\n` +
      `Great news — ${photographerRow.name} has accepted your inquiry!\n\n` +
      `You can now leave them a rating after your shoot.\n` +
      `Visit their profile: https://unilens.net/p/${photographerRow.slug}\n\n` +
      `— UniLens`
    );
  }

  return c.json({ success: true });
}

// Photographer declines
export async function declineContactRequest(c: AppContext) {
  const user = c.get('user');
  const id = c.req.param('id');

  const req = await c.env.unilens_db.prepare(
    `SELECT id, status, client_id, photographer_id FROM contact_requests WHERE id = ? AND photographer_id = ?`
  ).bind(id, user.id).first<{ id: string; status: string; client_id: string; photographer_id: string }>();
  if (!req) return c.json({ error: 'Request not found' }, 404);
  if (req.status !== 'pending') return c.json({ error: 'Request has already been responded to' }, 409);

  await c.env.unilens_db.prepare(
    `UPDATE contact_requests SET status = 'declined' WHERE id = ?`
  ).bind(id).run();

  // Send email — fetch client email and photographer name in parallel
  const [clientRow, photographerRow] = await Promise.all([
    c.env.unilens_db.prepare(`SELECT email, name FROM users WHERE id = ?`)
      .bind(req.client_id).first<{ email: string; name: string }>(),
    c.env.unilens_db.prepare(`SELECT name FROM users WHERE id = ?`)
      .bind(req.photographer_id).first<{ name: string }>(),
  ]);

  if (clientRow && photographerRow) {
    await sendEmail(
      c.env,
      clientRow.email,
      `Update on your inquiry to ${photographerRow.name}`,
      `Hi ${clientRow.name},\n\n` +
      `Unfortunately, ${photographerRow.name} is not able to take on your inquiry at this time.\n\n` +
      `Browse other photographers at: https://unilens.net\n\n` +
      `— UniLens`
    );
  }

  return c.json({ success: true });
}