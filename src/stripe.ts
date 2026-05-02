import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

async function stripePost(env: Env, path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function createCheckoutSession(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'photographer') return c.json({ error: 'Only photographers can subscribe' }, 403);

  const { tier, billing = 'monthly' } = await c.req.json() as { tier?: string; billing?: string };
  if (tier !== 'plus' && tier !== 'pro') return c.json({ error: 'Invalid tier' }, 400);

  const priceId = tier === 'pro'
    ? (billing === 'yearly' ? c.env.STRIPE_PRICE_PRO_YEARLY : c.env.STRIPE_PRICE_PRO)
    : (billing === 'yearly' ? c.env.STRIPE_PRICE_PLUS_YEARLY : c.env.STRIPE_PRICE_PLUS);

  if (!priceId) return c.json({ error: 'Pricing not configured' }, 500);

  const origin = new URL(c.req.url).origin;
  const session = await stripePost(c.env, '/checkout/sessions', {
    'payment_method_types[]': 'card',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'mode': 'subscription',
    'success_url': `${origin}/dashboard?upgrade=success`,
    'cancel_url': `${origin}/pricing`,
    'metadata[user_id]': String(user.id),
    'metadata[tier]': tier,
    'subscription_data[metadata][user_id]': String(user.id),
    'subscription_data[metadata][tier]': tier,
  });

  if ((session as any).error) return c.json({ error: ((session as any).error as any).message }, 400);
  return c.json({ url: (session as any).url });
}

export async function stripeWebhook(c: AppContext) {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature') ?? '';

  if (!await verifyStripeSignature(body, sig, c.env.STRIPE_WEBHOOK_SECRET)) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = (session.metadata as any)?.user_id;
    const tier   = (session.metadata as any)?.tier;
    if (userId && (tier === 'plus' || tier === 'pro')) {
      await c.env.unilens_db.prepare(
        `UPDATE photographer_profiles
         SET subscription_level = ?, stripe_customer_id = ?, stripe_subscription_id = ?
         WHERE user_id = ?`
      ).bind(tier, session.customer ?? null, session.subscription ?? null, userId).run();
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const userId = (sub.metadata as any)?.user_id;
    if (userId) {
      await c.env.unilens_db.prepare(
        `UPDATE photographer_profiles
         SET subscription_level = 'basic', stripe_subscription_id = NULL
         WHERE user_id = ?`
      ).bind(userId).run();
    }
  }

  return c.json({ received: true });
}

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts: Record<string, string> = Object.fromEntries(
      signature.split(',').map(p => { const [k, v] = p.split('='); return [k, v]; })
    );
    const { t: timestamp, v1: expectedSig } = parts;
    if (!timestamp || !expectedSig) return false;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const mac = await crypto.subtle.sign(
      'HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)
    );
    const computed = Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === expectedSig;
  } catch {
    return false;
  }
}

export async function createPortalSession(c: AppContext) {
  const user = c.get('user');
  if (user.role !== 'photographer') return c.json({ error: 'Forbidden' }, 403);

  const profile = await c.env.unilens_db.prepare(
    `SELECT stripe_customer_id FROM photographer_profiles WHERE user_id = ?`
  ).bind(user.id).first<{ stripe_customer_id: string | null }>();

  if (!profile?.stripe_customer_id) return c.json({ error: 'No billing account found' }, 400);

  const origin = new URL(c.req.url).origin;
  const session = await stripePost(c.env, '/billing_portal/sessions', {
    customer: profile.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  if ((session as any).error) return c.json({ error: ((session as any).error as any).message }, 400);
  return c.json({ url: (session as any).url });
}