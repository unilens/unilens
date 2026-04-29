import { Context, Next } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
 
// ---- STEP 1: Redirect to Google ----
export function googleLogin(c: AppContext) {
  const params = new URLSearchParams({
    client_id:     c.env.GOOGLE_CLIENT_ID,
    redirect_uri:  `${new URL(c.req.url).origin}/auth/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    prompt:        'select_account',
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}

// ---- STEP 2: Handle Google callback ----
export async function googleCallback(c: AppContext) {
  const code = c.req.query('code');
  if (!code) return c.json({ error: 'Missing code' }, 400);

  const origin = new URL(c.req.url).origin;

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  `${origin}/auth/callback`,
      grant_type:    'authorization_code',
    }),
  });

  const tokens = await tokenRes.json() as { access_token: string };
  if (!tokens.access_token) return c.json({ error: 'Token exchange failed' }, 400);

  // Get user info from Google
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const googleUser = await userRes.json() as {
    sub: string; email: string; name: string;
  };

  const db = c.env.unilens_db;

  // Check if user already exists
  let user = await db.prepare(
    'SELECT * FROM users WHERE google_id = ?'
  ).bind(googleUser.sub).first();

  // New user — check if they need to pick a role
  if (!user) {
    const pendingKey = `pending:${googleUser.sub}`;
    await c.env.SESSIONS.put(pendingKey, JSON.stringify({
      google_id: googleUser.sub,
      email:     googleUser.email,
      name:      googleUser.name,
    }), { expirationTtl: 600 }); // 10 min to pick role

    return c.redirect(`/register/role?pending=${googleUser.sub}`);
  }

  // Existing user — issue session
  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(token, user.id as string, { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`);
  return c.redirect('/');
}

// ---- STEP 3: Role selection for new users ----
export async function completeRegistration(c: AppContext) {
  const { pending, role } = await c.req.json();

  if (!['photographer', 'client'].includes(role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  const pendingKey = `pending:${pending}`;
  const raw = await c.env.SESSIONS.get(pendingKey);
  if (!raw) return c.json({ error: 'Session expired, please sign in again' }, 400);

  const { google_id, email, name } = JSON.parse(raw);

  const id = crypto.randomUUID();
  await c.env.unilens_db.prepare(
    'INSERT INTO users (id, email, role, name, google_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, role, name, google_id).run();

  await c.env.SESSIONS.delete(pendingKey);

  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(token, id, { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`);
  return c.json({ success: true, redirect: role === 'photographer' ? '/dashboard' : '/' });
}

// ---- AUTH MIDDLEWARE ----
export async function requireAuth(c: AppContext, next: Next) {
  const cookie = c.req.header('Cookie') ?? '';
  const token  = cookie.split(';').find(s => s.trim().startsWith('session='))?.split('=')[1];

  if (!token) return c.redirect('/login');

  const userId = await c.env.SESSIONS.get(token);
  if (!userId) return c.redirect('/login');

  const user = await c.env.unilens_db.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) return c.redirect('/login');

  c.set('user', user);
  await next();
}

export async function softAuth(c: AppContext, next: Next) {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie.split(';').find(s => s.trim().startsWith('session='))?.split('=')[1];
  if (token) {
    const userId = await c.env.SESSIONS.get(token);
    if (userId) {
      const user = await c.env.unilens_db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(userId).first();
      if (user) c.set('user', user);
    }
  }
  await next();
}