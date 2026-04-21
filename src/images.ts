import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function listImages(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'photographer') return c.json({ error: 'Forbidden' }, 403);

  const prefix = `${user.id}/`;
  const list = await c.env.unilens_images.list({ prefix });
  const publicBase = `https://pub-${c.env.R2_PUBLIC_ID}.r2.dev`;

  const images = list.objects.map(obj => ({
    key: obj.key,
    url: `${publicBase}/${obj.key}`,
  }));

  return c.json({ images });
}

export async function deleteImage(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'photographer') return c.json({ error: 'Forbidden' }, 403);

  const { key } = await c.req.json();
  if (!key || !key.startsWith(`${user.id}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.unilens_images.delete(key);
  return c.json({ success: true });
}