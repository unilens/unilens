import { Context } from 'hono';
import { Env, Variables } from './types';
import { checkRateLimit } from './ratelimit';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function ratePhotographer(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'client') {
    return c.json({ error: 'Only clients can submit ratings' }, 403);
  }

  const rl = await checkRateLimit(c.env.SESSIONS, String(user.id), 'rate', 10, 3600);
  if (!rl.allowed) return c.json({ error: 'Too many ratings submitted recently. Try again later.' }, 429);

  const photographerId = c.req.param('id');
  const { score, review } = await c.req.json();

  if (!score || score < 1 || score > 5) {
    return c.json({ error: 'Score must be between 1 and 5' }, 400);
  }
  if (review != null && String(review).length > 500) {
    return c.json({ error: 'Review must be 500 characters or fewer' }, 400);
  }

  const photographer = await c.env.unilens_db.prepare(
    `SELECT id FROM users WHERE id = ? AND role = 'photographer'`
  ).bind(photographerId).first();

  if (!photographer) return c.json({ error: 'Photographer not found' }, 404);

  if (user.id === photographerId) {
    return c.json({ error: 'You cannot rate yourself' }, 400);
  }

  const interaction = await c.env.unilens_db.prepare(
    `SELECT 1 FROM interactions WHERE photographer_id = ? AND client_id = ?`
  ).bind(photographerId, user.id).first();
  if (!interaction) return c.json({ error: 'You can only rate photographers you have worked with' }, 403);

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