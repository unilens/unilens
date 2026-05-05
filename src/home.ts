import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar, ogTags, adsenseMeta, footer } from './theme';
import { getUniversitySvg } from './universities';
import { TIERS, getTier } from './tiers';
import { biasOrderClause } from './search-bias';
import { esc } from './escape';


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
    user_id: string;
    subscription_level: string;
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

function photographerCard(p: Photographer, userRole?: string, savedIds?: Set<string>): string {
  const isLoggedIn = userRole === 'photographer' || userRole === 'client';
  const isSaved = savedIds?.has(p.user_id) ?? false;
  const saveBtn = userRole === 'photographer' ? '' : `
    <button class="save-btn" data-id="${p.user_id}" onclick="toggleSave(event,'${p.user_id}')" title="${isSaved ? 'Unsave' : 'Save'}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? '#e2a800' : 'white'}" stroke="#111" stroke-width="1.5" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>`;
  return `
    <a href="/p/${p.slug}" style="display:block; text-decoration:none; color:inherit;">
      <div class="card">
        ${saveBtn}
        <div class="avatar-wrap">${avatar(p)}</div>
        <div class="card-meta">
          <div class="meta-row">
            ${p.university && getUniversitySvg(p.university)
              ? `<span style="width:18px;height:18px;flex-shrink:0;display:flex;align-items:center;">${getUniversitySvg(p.university).replace('<svg ', '<svg width="18" height="18" ')}</span>`
              : `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`
            }
            <span>${esc(p.university) ?? '—'}</span>
          </div>
          <div class="meta-row">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h6M5 11.5L8 13l3-1.5V3.5a1 1 0 00-1-1H6a1 1 0 00-1 1v8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            ${isLoggedIn
              ? `<span>$${p.price_min ?? '?'} - $${p.price_max ?? '?'}</span>`
              : `<span class="muted">Log in to view prices</span>`
            }
          </div>
        </div>
        <div class="stars-row">${stars(p.avg_rating)}</div>
        <p class="card-name">${esc(p.name)}</p>
        ${p.commission_open ? '<span class="open-badge">Open for Commission</span>' : ''}
        ${TIERS[getTier(p.subscription_level)].proBadge ? '<span class="open-badge pro-card-badge">⚡ Professional</span>' : ''}
        </div>
    </a>
  `;
}

export async function homePage(c: AppContext) {
  const search = c.req.query('search') ?? '';
  const university = c.req.query('university') ?? '';
  const priceMinRaw = c.req.query('price_min') ?? '';
  const priceMaxRaw = c.req.query('price_max') ?? '';
  const filterPriceMin = priceMinRaw ? Math.max(0, parseInt(priceMinRaw)) : 0;
  const filterPriceMax = priceMaxRaw ? Math.max(0, parseInt(priceMaxRaw)) : 0;
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const PAGE_SIZE = 24;
  const offset = (page - 1) * PAGE_SIZE;
  const user = c.get('user');
  const savedSet = new Set<string>();
    if (user?.role === 'client') {
      const saved = await c.env.unilens_db.prepare(
        `SELECT photographer_id FROM saved_photographers WHERE client_id = ?`
      ).bind(user.id).all<{ photographer_id: string }>();
      saved.results.forEach(r => savedSet.add(r.photographer_id));
    }

  const countRow = await c.env.unilens_db.prepare(`
    SELECT COUNT(DISTINCT p.user_id) AS total
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    WHERE (? = '' OR u.name LIKE '%' || ? || '%')
      AND (? = '' OR p.university = ?)
      AND (? = 0 OR p.price_max IS NULL OR p.price_max >= ?)
      AND (? = 0 OR p.price_min IS NULL OR p.price_min <= ?)
  `).bind(search, search, university, university, filterPriceMin, filterPriceMin, filterPriceMax, filterPriceMax).first<{ total: number }>();

  const total = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const result = await c.env.unilens_db.prepare(`
    SELECT
      u.name, p.slug, p.bio, p.university,
      p.price_min, p.price_max, p.commission_open, p.avatar_url, p.subscription_level,

      p.user_id,
      ROUND(AVG(r.score), 1) AS avg_rating,
      COUNT(r.id)            AS review_count
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN ratings r ON r.photographer_id = p.user_id
    WHERE (? = '' OR u.name LIKE '%' || ? || '%')
      AND (? = '' OR p.university = ?)
      AND (? = 0 OR p.price_max IS NULL OR p.price_max >= ?)
      AND (? = 0 OR p.price_min IS NULL OR p.price_min <= ?)
    GROUP BY p.user_id
    ORDER BY ${biasOrderClause()}
    LIMIT ? OFFSET ?
  `).bind(search, search, university, university, filterPriceMin, filterPriceMin, filterPriceMax, filterPriceMax, PAGE_SIZE, offset).all<Photographer>();

  const universities = await c.env.unilens_db.prepare(`
    SELECT DISTINCT university FROM photographer_profiles WHERE university IS NOT NULL ORDER BY university
  `).all<{ university: string }>();

  const cards = result.results.length > 0
        ? result.results.map(p => photographerCard(p, String(user?.role ?? ''), savedSet)).join('')
        : `<p style="grid-column:1/-1; text-align:center; color:var(--color-text-muted); padding:3rem 0;">No photographers found.</p>`;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (university) params.set('university', university);
    if (priceMinRaw) params.set('price_min', priceMinRaw);
    if (priceMaxRaw) params.set('price_max', priceMaxRaw);
    if (p > 1) params.set('page', String(p));
    const q = params.toString();
    return q ? `/?${q}` : '/';
  }

  const paginationHtml = totalPages <= 1 ? '' : (() => {
    const items: string[] = [];
    if (page > 1) items.push(`<a href="${pageUrl(page - 1)}" class="pg-btn">‹ Prev</a>`);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        items.push(`<a href="${pageUrl(i)}" class="pg-btn${i === page ? ' pg-active' : ''}">${i}</a>`);
      } else if (items[items.length - 1] !== '<span class="pg-ellipsis">…</span>') {
        items.push('<span class="pg-ellipsis">…</span>');
      }
    }
    if (page < totalPages) items.push(`<a href="${pageUrl(page + 1)}" class="pg-btn">Next ›</a>`);
    return `<div class="pagination">${items.join('')}</div>`;
  })();

  const currentFilterIcon = university
    ? getUniversitySvg(university).replace('<svg ', '<svg width="20" height="20" ')
    : '';

  const universityOptions = universities.results.map(u => {
    const icon = getUniversitySvg(u.university);
    const sized = icon ? icon.replace('<svg ', '<svg width="22" height="22" ') : '';
    const sel = university === u.university ? ' selected' : '';
    return `
    <div class="univ-filter-option${sel}" data-value="${u.university.replace(/"/g, '&quot;')}">
      <span class="univ-filter-opt-icon">${sized}</span>
      <span>${u.university}</span>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'><circle fill='%23000000' cx='24' cy='24' r='24'/><path fill='%23ffffff' d='m 5,1.5 h 38 c .554,0 1,.446 1,1 v 43 c 0,.554-.446,1-1,1 H 5 c-.554,0-1-.446-1-1 v-43 c 0-.554.446-1 1-1 z'/><rect fill='%23000000' width='37.5' height='30' x='5.25' y='3' rx='1'/><rect fill='%23c8c8c8' width='37.5' height='11.5' x='5.25' y='-45.5' transform='scale(1,-1)' rx='1'/><text font-weight='bold' font-size='11.84' font-family='Arial,sans-serif' fill='%23000000' x='8.455' y='43.397' transform='scale(.9835,1.0168)'>LENS</text><text font-weight='bold' font-size='21.87' font-family='Arial,sans-serif' fill='%23ffffff' x='7.282' y='25.275' transform='scale(.9164,1.0912)'>UNI</text></svg>">
  <title>UniLens — Find your photographer</title>
  ${ogTags({ title: 'UniLens — Find your photographer', description: 'Browse college photographers by university, price, and availability.' })}
  ${adsenseMeta}
  <style>
    ${theme}

    body { padding: 0; }
  .page-content { padding: 2rem 1.5rem; }

    ${topbarStyles}
    @media (max-width: 480px) {
  .search-box { min-width: 100%; }
  .univ-filter { width: 100%; }
  .univ-filter-trigger { min-width: 0; width: 100%; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}
    .hero-title {
      font-family: var(--font-serif);
      font-size: 32px;
      font-weight: 400;
      margin-bottom: 1.25rem;
    }

    .pagination {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2.5rem;
      flex-wrap: wrap;
    }
    .pg-btn {
      padding: 7px 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: 13px;
      color: var(--color-text);
      text-decoration: none;
      transition: border-color 0.15s, background 0.15s;
    }
    .pg-btn:hover { border-color: var(--color-primary); background: var(--color-hover); }
    .pg-active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .pg-active:hover { background: var(--color-primary); opacity: 0.85; }
    .pg-ellipsis { font-size: 13px; color: var(--color-text-muted); padding: 0 4px; }

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

    .univ-filter { position: relative; }

.univ-filter-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  padding: 10px 18px;
  background: white;
  min-width: 220px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}

.univ-filter.open .univ-filter-trigger { border-color: var(--color-accent); }

.univ-filter-icon {
  width: 20px; height: 20px;
  flex-shrink: 0;
  display: flex; align-items: center;
}

.univ-filter-icon svg { width: 20px; height: 20px; display: block; }

.univ-filter-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.univ-filter-chevron { flex-shrink: 0; transition: transform 0.15s; }
.univ-filter.open .univ-filter-chevron { transform: rotate(180deg); }

.univ-filter-options {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 260px;
  overflow-y: auto;
}

.univ-filter.open .univ-filter-options { display: block; }

.univ-filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s;
}

.univ-filter-option:hover { background: var(--color-hover); }
.univ-filter-option.selected { background: var(--color-primary-light); font-weight: 500; }

.univ-filter-opt-icon {
  width: 22px; height: 22px;
  flex-shrink: 0;
  display: flex; align-items: center;
}

.univ-filter-opt-icon svg { width: 22px; height: 22px; display: block; }

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
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s, transform 0.15s;
      cursor: pointer;
      padding-top: 2rem;
    }
    .save-btn {
      position: absolute;
      top: 8px; right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      line-height: 0;
      z-index: 1;
    }
    .save-btn:hover { background: rgba(0,0,0,0.06); }

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
  .pro-card-badge {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: #1a1a2e;
      color: #c9a84c;
      margin-top: 4px;
    }
      .price-filter-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-full);
      padding: 10px 16px;
      background: white;
    }
    .price-input {
      width: 72px;
      border: none;
      outline: none;
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--color-text);
      background: transparent;
      -moz-appearance: textfield;
    }
    .price-input::-webkit-outer-spin-button,
    .price-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .price-sep { font-size: 14px; color: var(--color-text-muted); }
    @media (max-width: 480px) {
      .price-filter-wrap { width: 100%; }
    }
  </style>
</head>
<body>
  ${topbar('home', String(user?.role ?? ''))}
<div class="page-content">
  <h1 class="hero-title">Find your photographer</h1>

  <div class="search-row">
    <div class="search-box">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input type="text" id="search-input" placeholder="Search photographers..." value="${esc(search)}" oninput="scheduleSearch()">
    </div>
    <div class="univ-filter" id="univ-filter">
      <div class="univ-filter-trigger" onclick="toggleUnivFilter(event)">
        <span class="univ-filter-icon">
          ${currentFilterIcon ||
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`
    }
        </span>
        <span class="univ-filter-label" id="univ-filter-label">${esc(university) || 'All universities'}</span>
        <svg class="univ-filter-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="univ-filter-options">
        <div class="univ-filter-option${!university ? ' selected' : ''}" data-value="">All universities</div>
        ${universityOptions}
      </div>
      <input type="hidden" id="univ-filter-value" value="${esc(university)}">
    </div>
    <div class="price-filter-wrap">
      <input type="number" id="price-min-input" class="price-input" placeholder="Min $" min="0" value="${esc(priceMinRaw)}" oninput="scheduleSearch()">
      <span class="price-sep">–</span>
      <input type="number" id="price-max-input" class="price-input" placeholder="Max $" min="0" value="${esc(priceMaxRaw)}" oninput="scheduleSearch()">
    </div>
  </div>

  <p class="section-label">${total} photographer${total !== 1 ? 's' : ''} found</p>
  <div class="grid">${cards}</div>
  ${paginationHtml}
  </div>
  <script>
  var searchTimer = null;

  function scheduleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 350);
  }

  async function doSearch() {
    var params = new URLSearchParams();
    var s = document.getElementById('search-input').value;
    var u = document.getElementById('univ-filter-value').value;
    var pMin = document.getElementById('price-min-input').value;
    var pMax = document.getElementById('price-max-input').value;
    if (s) params.set('search', s);
    if (u) params.set('university', u);
    if (pMin) params.set('price_min', pMin);
    if (pMax) params.set('price_max', pMax);
    var qs = params.toString();
    var url = qs ? '/?' + qs : '/';
    history.pushState(null, '', url);
    var res = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
    var html = await res.text();
    var doc = new DOMParser().parseFromString(html, 'text/html');
    document.querySelector('.grid').innerHTML = doc.querySelector('.grid').innerHTML;
    document.querySelector('.section-label').textContent = doc.querySelector('.section-label').textContent;
    var oldPag = document.querySelector('.pagination');
    var newPag = doc.querySelector('.pagination');
    if (oldPag) oldPag.remove();
    if (newPag) {
      var grid = document.querySelector('.grid');
      grid.insertAdjacentElement('afterend', newPag.cloneNode(true));
    }
  }

  function toggleUnivFilter(e) {
    e.stopPropagation();
    document.getElementById('univ-filter').classList.toggle('open');
  }

  document.querySelectorAll('.univ-filter-option').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var val = this.dataset.value;
      document.getElementById('univ-filter-value').value = val;
      // Update trigger label and icon
      document.getElementById('univ-filter-label').textContent = val || 'All universities';
      document.querySelectorAll('.univ-filter-option').forEach(function(o) {
        o.classList.toggle('selected', o.dataset.value === val);
      });
      document.getElementById('univ-filter').classList.remove('open');
      doSearch();
    });
  });

  var isClient = ${user?.role === 'client' ? 'true' : 'false'};
  var savedIds = new Set(${JSON.stringify([...savedSet])});
  async function toggleSave(e, photographerId) {
    e.preventDefault();
    e.stopPropagation();
    if (!isClient) { window.location.href = '/login'; return; }
    var res = await fetch('/save/' + photographerId, { method: 'POST' });
    var data = await res.json();
    if (!res.ok) return;
    document.querySelectorAll('.save-btn[data-id="' + photographerId + '"]').forEach(function(btn) {
      btn.querySelector('svg').setAttribute('fill', data.saved ? '#e2a800' : 'white');
      btn.title = data.saved ? 'Unsave' : 'Save';
    });
    if (data.saved) savedIds.add(photographerId);
    else savedIds.delete(photographerId);
  }
  document.addEventListener('click', function() {
    document.getElementById('univ-filter').classList.remove('open');
  });
</script>
${footer}
</body>
</html>`;

  return c.html(html);
}