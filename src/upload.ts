import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function uploadImage(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'photographer') {
    return c.json({ error: 'Only photographers can upload images' }, 403);
  }

  const formData = await c.req.formData();
  const file = formData.get('image') as File | null;

  if (!file) return c.json({ error: 'No image provided' }, 400);
  if (!ALLOWED_TYPES.includes(file.type)) return c.json({ error: 'Only JPEG, PNG, WebP, and GIF are allowed' }, 400);
  if (file.size > MAX_SIZE) return c.json({ error: 'Image must be under 5MB' }, 400);

  const ext = file.type.split('/')[1];
  const key = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const buffer = await file.arrayBuffer();

  await c.env.unilens_images.put(key, buffer, {
    httpMetadata: { contentType: file.type }
  });

  const url = `https://pub-${c.env.R2_PUBLIC_ID}.r2.dev/${key}`;

  return c.json({ success: true, url, key });
}