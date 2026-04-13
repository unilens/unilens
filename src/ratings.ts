import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function ratePhotographer(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'client') {
    return c.json({ error: 'Only clients can submit ratings' }, 403);
  }

  const photographerId = c.req.param('id');
  const { score, review } = await c.req.json();

  if (!score || score < 1 || score > 5) {
    return c.json({ error: 'Score must be between 1 and 5' }, 400);
  }

  const photographer = await c.env.unilens_db.prepare(
    `SELECT id FROM users WHERE id = ? AND role = 'photographer'`
  ).bind(photographerId).first();

  if (!photographer) return c.json({ error: 'Photographer not found' }, 404);

  if (user.id === photographerId) {
    return c.json({ error: 'You cannot rate yourself' }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.unilens_db.prepare(`
    INSERT INTO ratings (id, photographer_id, client_id, score, review)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(photographer_id, client_id) DO UPDATE SET
      score  = excluded.score,
      review = excluded.review
  `).bind(id, photographerId, user.id, score, review ?? null).run();

  return c.json({ success: true });
}