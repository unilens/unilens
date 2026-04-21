import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function getNotifications(c: AppContext) {
  const user = c.get('user');
  const seenKey = `notif_seen:${user.id}`;
  const lastSeen = parseInt(await c.env.SESSIONS.get(seenKey) ?? '0');

  let items: { text: string; href: string; time: number }[] = [];

  if (user.role === 'photographer') {
    const inquiries = await c.env.unilens_db.prepare(`
      SELECT cr.created_at, u.name AS client_name
      FROM contact_requests cr
      JOIN users u ON u.id = cr.client_id
      WHERE cr.photographer_id = ? AND cr.status = 'pending'
      ORDER BY cr.created_at DESC LIMIT 20
    `).bind(user.id).all<{ created_at: number; client_name: string }>();

    items = inquiries.results.map(r => ({
      text: `${r.client_name} sent you an inquiry`,
      href: '/inquiries',
      time: r.created_at,
    }));
  } else {
    const updates = await c.env.unilens_db.prepare(`
      SELECT cr.created_at, cr.status, u.name AS photographer_name, p.slug
      FROM contact_requests cr
      JOIN users u ON u.id = cr.photographer_id
      JOIN photographer_profiles p ON p.user_id = cr.photographer_id
      WHERE cr.client_id = ? AND cr.status != 'pending'
      ORDER BY cr.created_at DESC LIMIT 20
    `).bind(user.id).all<{ created_at: number; status: string; photographer_name: string; slug: string }>();

    items = updates.results.map(r => ({
      text: `${r.photographer_name} ${r.status} your inquiry`,
      href: `/p/${r.slug}`,
      time: r.created_at,
    }));
  }

  items.sort((a, b) => b.time - a.time);
  const unread = items.filter(i => i.time > lastSeen).length;

  return c.json({ items, unread });
}

export async function markNotificationsSeen(c: AppContext) {
  const user = c.get('user');
  await c.env.SESSIONS.put(
    `notif_seen:${user.id}`,
    String(Math.floor(Date.now() / 1000)),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
  return c.json({ ok: true });
}