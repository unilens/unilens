import { Context } from 'hono';
import { Env, Variables, PhotographerProfile } from './types';
import { sanitizePortfolio } from './sanitize';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function savePortfolio(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'photographer') {
    return c.json({ error: 'Only photographers can save a portfolio' }, 403);
  }

  const { bio, portfolio_html, slug, price_min, price_max, commission_open, avatar_url, university } = await c.req.json();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return c.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, 400);
  }

  const sanitized = sanitizePortfolio(portfolio_html ?? '');

  await c.env.unilens_db.prepare(`
  INSERT INTO photographer_profiles (user_id, bio, portfolio_html, slug, price_min, price_max, commission_open, avatar_url, university)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    bio            = excluded.bio,
    portfolio_html = excluded.portfolio_html,
    slug           = excluded.slug,
    price_min      = excluded.price_min,
    price_max      = excluded.price_max,
    commission_open = excluded.commission_open,
    avatar_url     = excluded.avatar_url,
    university     = excluded.university
`).bind(user.id, bio ?? '', sanitized, slug, price_min ?? null, price_max ?? null, commission_open ?? 1, avatar_url ?? null, university ?? null).run();

  return c.json({ success: true, slug });
}

export async function getProfile(c: AppContext) {
  const slug = c.req.param('slug');

  const profile = await c.env.unilens_db.prepare(`
    SELECT
      u.name,
      p.bio,
      p.portfolio_html,
      p.slug,
      p.price_min,
      p.price_max,
      p.commission_open,
      p.avatar_url,
      p.university,
      ROUND(AVG(r.score), 1)  AS avg_rating,
      COUNT(r.id)             AS review_count
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN ratings r ON r.photographer_id = p.user_id
    WHERE p.slug = ?
    GROUP BY p.user_id
  `).bind(slug).first<PhotographerProfile>();

  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  const stars = (avg: number) => {
    const filled = Math.round(avg);
    return Array.from({ length: 5 }, (_, i) =>
      `<span class="star${i < filled ? '' : ' empty'}">★</span>`
    ).join('');
  };

  const commissionBadge = profile.commission_open
    ? `<span class="badge open">Open for Commission</span>`
    : `<span class="badge closed">Not Available</span>`;

  const avatarContent = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="${profile.name}" style="width:100%;height:100%;object-fit:cover;">`
    : `<svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="27" cy="20" r="10" fill="#333" opacity="0.8"/>
        <ellipse cx="27" cy="44" rx="16" ry="10" fill="#333" opacity="0.8"/>
       </svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} — UniLens</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; max-width: 520px; margin: 0 auto; padding: 1.5rem 1rem; }
    .topbar { display: flex; justify-content: flex-end; margin-bottom: 1.5rem; }
    .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
    .hamburger span { display: block; width: 24px; height: 2px; background: #111; }
    .header-row { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }
    .avatar { width: 90px; height: 90px; border-radius: 50%; border: 2.5px solid #111; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f0f0f0; }
    .avatar svg { width: 54px; height: 54px; }
    .photographer-name { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 400; margin-bottom: 10px; }
    .meta-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-bottom: 7px; }
    .price { font-size: 15px; font-weight: 500; color: #111; }
    .badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
    .badge.open   { background: #e6f4ee; color: #1a6e3c; }
    .badge.closed { background: #fdecea; color: #a32d2d; }
    .stars { display: flex; align-items: center; gap: 3px; margin-top: 8px; }
    .star { font-size: 16px; color: #e2a800; }
    .star.empty { color: #ccc; }
    .rating-label { font-size: 12px; color: #777; margin-left: 6px; }
    hr { border: none; border-top: 0.5px solid #e0e0e0; margin: 1.25rem 0; }
    .section-label { font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .custom-area { border: 2.5px solid #111; border-radius: 4px; min-height: 400px; overflow: hidden; }
    .custom-area iframe { width: 100%; min-height: 400px; border: none; display: block; }
  </style>
</head>
<body>
  <div class="topbar">
    <button class="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>

  <div class="header-row">
    <div class="avatar">${avatarContent}</div>
    <div>
      <h1 class="photographer-name">${profile.name}</h1>
      <div class="meta-row">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
        ${profile.university ?? 'University not set'}
      </div>
      <div class="meta-row">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h6M5 11.5L8 13l3-1.5V3.5a1 1 0 00-1-1H6a1 1 0 00-1 1v8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="price">$${profile.price_min ?? '?'} – $${profile.price_max ?? '?'}</span>
      </div>
      ${commissionBadge}
      <div class="stars">
        ${profile.review_count > 0 ? stars(profile.avg_rating) : '<span style="font-size:12px;color:#999;">No reviews yet</span>'}
        ${profile.review_count > 0 ? `<span class="rating-label">${profile.avg_rating} (${profile.review_count} review${profile.review_count !== 1 ? 's' : ''})</span>` : ''}
      </div>
    </div>
  </div>

  <hr>
  <p class="section-label">Portfolio</p>
  <div class="custom-area">
    <iframe
      srcdoc="${profile.portfolio_html.replace(/"/g, '&quot;')}"
      sandbox="allow-same-origin"
      title="${profile.name}'s portfolio"
    ></iframe>
  </div>
</body>
</html>`;

  return c.html(html);
}