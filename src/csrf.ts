// src/csrf.ts
// Validates the Origin header on state-changing requests.
// Browsers always send Origin on cross-site requests; absence means
// a non-browser client (curl, server-to-server) — allowed through.

import { Context, Next } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const ALLOWED_ORIGINS = new Set([
	'https://unilens.net',
	'https://www.unilens.net',
]);

function isAllowedOrigin(origin: string): boolean {
	if (ALLOWED_ORIGINS.has(origin)) return true;
	// Allow localhost for local dev (wrangler dev)
	try {
		const u = new URL(origin);
		return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
	} catch {
		return false;
	}
}

export async function csrfMiddleware(c: AppContext, next: Next) {
	if (SAFE_METHODS.has(c.req.method)) return next();

	const origin = c.req.header('Origin');

	// No Origin = non-browser request; allow through
	if (!origin) return next();

	if (!isAllowedOrigin(origin)) {
		return c.json({ error: 'Forbidden' }, 403);
	}

	return next();
}