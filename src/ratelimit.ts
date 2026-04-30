// src/ratelimit.ts
// Fixed-window rate limiter backed by Cloudflare KV.
// Key: rl:{userId}:{action}:{windowSlot}
// Slight race on concurrent requests is acceptable for abuse prevention.

export async function checkRateLimit(
	kv: KVNamespace,
	userId: string,
	action: string,
	limit: number,
	windowSeconds = 3600
): Promise<{ allowed: boolean; remaining: number }> {
	const slot = Math.floor(Date.now() / (windowSeconds * 1000));
	const key = `rl:${userId}:${action}:${slot}`;

	const raw = await kv.get(key);
	const count = raw ? parseInt(raw, 10) : 0;

	if (count >= limit) {
		return { allowed: false, remaining: 0 };
	}

	await kv.put(key, String(count + 1), { expirationTtl: windowSeconds * 2 });
	return { allowed: true, remaining: limit - count - 1 };
}