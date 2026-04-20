import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function toggleSave(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'client') return c.json({ error: 'Only clients can save photographers' }, 403);

  const photographerId = c.req.param('id');

  const existing = await c.env.unilens_db.prepare(
    `SELECT 1 FROM saved_photographers WHERE client_id = ? AND photographer_id = ?`
  ).bind(user.id, photographerId).first();

  if (existing) {
    await c.env.unilens_db.prepare(
      `DELETE FROM saved_photographers WHERE client_id = ? AND photographer_id = ?`
    ).bind(user.id, photographerId).run();
    return c.json({ saved: false });
  }

  await c.env.unilens_db.prepare(
    `INSERT INTO saved_photographers (client_id, photographer_id) VALUES (?, ?)`
  ).bind(user.id, photographerId).run();
  return c.json({ saved: true });
}