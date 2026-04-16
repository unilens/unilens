import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar } from './theme';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

interface Photographer {
    name: string;
    slug: string;
    bio: string;
    university: string;
    price_min: number | null;
    price_max: number | null;
    commission_open: number;
    avatar_url: string | null;
    avg_rating: number | null;
    review_count: number;
}

function stars(avg: number | null): string {
    if (!avg) return '<span style="font-size:11px;color:var(--color-text-muted);">No reviews</span>';
    const filled = Math.round(avg);
    return Array.from({ length: 5 }, (_, i) =>
        `<span style="color:${i < filled ? 'var(--color-star)' : 'var(--color-star-empty)'}; font-size:14px;">★</span>`
    ).join('');
}

function avatar(p: Photographer): string {
    if (p.avatar_url) {
        return `<img src="${p.avatar_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    return `<svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:60%;height:60%;">
    <circle cx="27" cy="20" r="10" fill="var(--color-primary)" opacity="0.8"/>
    <ellipse cx="27" cy="44" rx="16" ry="10" fill="var(--color-primary)" opacity="0.8"/>
  </svg>`;
}

function photographerCard(p: Photographer): string {
    return `
    <a href="/p/${p.slug}" style="display:block; text-decoration:none; color:inherit;">
      <div class="card">
        <div class="avatar-wrap">${avatar(p)}</div>
        <div class="card-meta">
          <div class="meta-row">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
            <span>${p.university ?? '—'}</span>
          </div>
          <div class="meta-row">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h6M5 11.5L8 13l3-1.5V3.5a1 1 0 00-1-1H6a1 1 0 00-1 1v8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>$${p.price_min ?? '?'} – $${p.price_max ?? '?'}</span>
          </div>
        </div>
        <div class="stars-row">${stars(p.avg_rating)}</div>
        <p class="card-name">${p.name}</p>
        ${p.commission_open ? '<span class="open-badge">Open for Commission</span>' : ''}
      </div>
    </a>
  `;
}

export async function homePage(c: AppContext) {
    const search = c.req.query('search') ?? '';
    const university = c.req.query('university') ?? '';
    const user = c.get('user');

    const result = await c.env.unilens_db.prepare(`
    SELECT
      u.name, p.slug, p.bio, p.university,
      p.price_min, p.price_max, p.commission_open, p.avatar_url,
      ROUND(AVG(r.score), 1) AS avg_rating,
      COUNT(r.id)            AS review_count
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN ratings r ON r.photographer_id = p.user_id
    WHERE (? = '' OR u.name LIKE '%' || ? || '%')
      AND (? = '' OR p.university = ?)
    GROUP BY p.user_id
    ORDER BY avg_rating DESC
  `).bind(search, search, university, university).all<Photographer>();

    const universities = await c.env.unilens_db.prepare(`
    SELECT DISTINCT university FROM photographer_profiles WHERE university IS NOT NULL ORDER BY university
  `).all<{ university: string }>();

    const cards = result.results.length > 0
        ? result.results.map(photographerCard).join('')
        : `<p style="grid-column:1/-1; text-align:center; color:var(--color-text-muted); padding:3rem 0;">No photographers found.</p>`;

    const universityOptions = universities.results
        .map(u => `<option value="${u.university}" ${university === u.university ? 'selected' : ''}>${u.university}</option>`)
        .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'><circle fill='%23000000' cx='24' cy='24' r='24'/><path fill='%23ffffff' d='m 5,1.5 h 38 c .554,0 1,.446 1,1 v 43 c 0,.554-.446,1-1,1 H 5 c-.554,0-1-.446-1-1 v-43 c 0-.554.446-1 1-1 z'/><rect fill='%23000000' width='37.5' height='30' x='5.25' y='3' rx='1'/><rect fill='%23c8c8c8' width='37.5' height='11.5' x='5.25' y='-45.5' transform='scale(1,-1)' rx='1'/><text font-weight='bold' font-size='11.8' font-family='sans-serif' fill='%23000000' x='7' y='43' transform='scale(.984,1.017)'>LENS</text><text font-weight='bold' font-size='18.5' font-family='sans-serif' fill='%23ffffff' x='9' y='23' transform='scale(.916,1.091)'>UNI</text></svg>">
  <title>UniLens — Find your photographer</title>
  <style>
    ${theme}

    body { padding: 0; }
.page-content { padding: 2rem 1.5rem; }

    ${topbarStyles}

    .hero-title {
      font-family: var(--font-serif);
      font-size: 32px;
      font-weight: 400;
      margin-bottom: 1.25rem;
    }

    .search-row {
      display: flex;
      gap: 12px;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 220px;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-full);
      padding: 10px 18px;
      background: white;
    }

    .search-box input {
      border: none;
      outline: none;
      font-family: var(--font-sans);
      font-size: 15px;
      width: 100%;
      color: var(--color-text);
    }

    .university-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  padding: 10px 18px;
  background: white;
  min-width: 200px;
  position: relative;
  cursor: pointer;
}

.university-filter select {
  border: none;
  outline: none;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-text);
  background: transparent;
  cursor: pointer;
  appearance: none;
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.university-filter .filter-label {
  pointer-events: none;
  font-size: 14px;
  color: var(--color-text);
  flex: 1;
}

    .section-label {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 1.25rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.5rem;
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s, transform 0.15s;
      cursor: pointer;
    }

    .card:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    .avatar-wrap {
      width: 90px; height: 90px;
      border-radius: 50%;
      border: 2.5px solid var(--color-primary);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      margin-bottom: 10px;
    }

    .card-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 6px; }
    .meta-row { display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 3px; }
    .stars-row { margin-bottom: 6px; }
    .card-name { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
    .open-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: #e6f4ee;
  color: #1a6e3c;
}
  </style>
</head>
<body>
  ${topbar('home', user.role as string)}
<div class="page-content">
  <h1 class="hero-title">Find your photographer</h1>

  <form method="GET" action="/">
    <div class="search-row">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="text" name="search" placeholder="Search photographers..." value="${search}">
      </div>
      <div class="university-filter">
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
  <span class="filter-label">${university || 'All universities'}</span>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  <select name="university" onchange="this.form.submit()">
    <option value="">All universities</option>
    ${universityOptions}
  </select>
</div>
      <button type="submit" class="btn">Search</button>
    </div>
  </form>

  <p class="section-label">${result.results.length} photographer${result.results.length !== 1 ? 's' : ''} found</p>
  <div class="grid">${cards}</div>
  </div>
</body>
</html>`;

    return c.html(html);
}