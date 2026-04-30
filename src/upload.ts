import { Context } from 'hono';
import { Env, Variables } from './types';
import { TIERS, getTier } from './tiers';
import { checkRateLimit } from './ratelimit';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function detectMime(buf: ArrayBuffer): string | null {
	const bytes = new Uint8Array(buf, 0, 12);
	if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
	// WebP: RIFF????WEBP
	if (
		bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
		bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
	) return 'image/webp';
	return null;
}

export async function uploadImage(c: AppContext) {
	const user = c.get('user');

	  if (user.role !== 'photographer') {
    return c.json({ error: 'Only photographers can upload images' }, 403);
  }

  const rl = await checkRateLimit(c.env.SESSIONS, String(user.id), 'upload', 20, 3600);
  if (!rl.allowed) return c.json({ error: 'Upload limit reached. Try again later.' }, 429);

  const formData = await c.req.formData();
	const file = formData.get('image') as File | null;

	const profile = await c.env.unilens_db.prepare(
		`SELECT subscription_level FROM photographer_profiles WHERE user_id = ?`
	).bind(user.id).first<{ subscription_level: string }>();
	const tier = TIERS[getTier(profile?.subscription_level ?? 'basic')];
	const MAX_SIZE = tier.maxFileMb * 1024 * 1024;

	if (!file) return c.json({ error: 'No image provided' }, 400);
	if (file.size > MAX_SIZE) return c.json({ error: `Image must be under ${tier.maxFileMb}MB` }, 400);

	const buffer = await file.arrayBuffer();
	const detectedMime = detectMime(buffer);
	if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
		return c.json({ error: 'Only JPEG, PNG, WebP, and GIF are allowed' }, 400);
	}

	const existing = await c.env.unilens_images.list({ prefix: `${user.id}/` });
	if (existing.objects.length >= tier.photoLimit) {
		return c.json({ error: `Upload limit reached (${tier.photoLimit} photos max on ${tier.label} plan)` }, 403);
	}

	const ext = detectedMime.split('/')[1];
	const key = `${user.id}/${crypto.randomUUID()}.${ext}`;

	await c.env.unilens_images.put(key, buffer, {
		httpMetadata: { contentType: detectedMime },
	});

	const url = `https://pub-${c.env.R2_PUBLIC_ID}.r2.dev/${key}`;

	return c.json({ success: true, url, key });
}

export async function uploadAvatar(c: AppContext) {
	const user = c.get('user');
	if (user.role !== 'photographer') return c.json({ error: 'Only photographers can upload avatars' }, 403);

  const rl = await checkRateLimit(c.env.SESSIONS, String(user.id), 'avatar', 10, 3600);
  if (!rl.allowed) return c.json({ error: 'Too many avatar uploads. Try again later.' }, 429);

	const avatarProfile = await c.env.unilens_db.prepare(
		`SELECT subscription_level FROM photographer_profiles WHERE user_id = ?`
	).bind(user.id).first<{ subscription_level: string }>();
	const avatarTier = TIERS[getTier(avatarProfile?.subscription_level ?? 'basic')];
	const MAX_SIZE = avatarTier.maxFileMb * 1024 * 1024;

	const formData = await c.req.formData();
	const file = formData.get('image') as File | null;

	if (!file) return c.json({ error: 'No image provided' }, 400);
	if (file.size > MAX_SIZE) return c.json({ error: `Image must be under ${avatarTier.maxFileMb}MB` }, 400);

	const buffer = await file.arrayBuffer();
	const detectedMime = detectMime(buffer);
	if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
		return c.json({ error: 'Only JPEG, PNG, WebP, and GIF are allowed' }, 400);
	}

	// Delete old avatar(s)
	const existing = await c.env.unilens_images.list({ prefix: `avatars/${user.id}/` });
	await Promise.all(existing.objects.map(obj => c.env.unilens_images.delete(obj.key)));

	const ext = detectedMime.split('/')[1];
	const key = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
	await c.env.unilens_images.put(key, buffer, {
		httpMetadata: { contentType: detectedMime },
	});

	const url = `https://pub-${c.env.R2_PUBLIC_ID}.r2.dev/${key}`;
	return c.json({ success: true, url, key });
}