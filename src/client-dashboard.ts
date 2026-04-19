import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar } from './theme';
import { getUniversitySvg } from './universities';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function clientDashboardPage(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'client') {
    return c.redirect('/dashboard');
  }

  // Ratings the client has submitted
  const myRatings = await c.env.unilens_db.prepare(`
    SELECT
      r.score, r.review,
      u.name AS photographer_name,
      p.slug, p.avatar_url, p.university
    FROM ratings r
    JOIN users u ON u.id = r.photographer_id
    JOIN photographer_profiles p ON p.user_id = r.photographer_id
    WHERE r.client_id = ?
    ORDER BY r.rowid DESC
  `).bind(user.id).all<{
    score: number; review: string | null;
    photographer_name: string; slug: string;
    avatar_url: string | null; university: string;
  }>();

  const myRequests = await c.env.unilens_db.prepare(`
    SELECT cr.status, cr.message, cr.created_at,
           u.name AS photographer_name, p.slug, p.avatar_url
    FROM contact_requests cr
    JOIN users u ON u.id = cr.photographer_id
    JOIN photographer_profiles p ON p.user_id = cr.photographer_id
    WHERE cr.client_id = ?
    ORDER BY cr.created_at DESC
  `).bind(user.id).all<{ status: string; message: string | null; created_at: number; photographer_name: string; slug: string; avatar_url: string | null }>();

  // Suggested photographers (open for commission, highest rated)
  const suggested = await c.env.unilens_db.prepare(`
    SELECT
      u.name, p.slug, p.university, p.avatar_url,
      p.price_min, p.price_max,
      ROUND(AVG(r.score), 1) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN ratings r ON r.photographer_id = p.user_id
    WHERE p.commission_open = 1
    GROUP BY p.user_id
    ORDER BY avg_rating DESC
    LIMIT 6
  `).all<{
    name: string; slug: string; university: string;
    avatar_url: string | null; price_min: number | null;
    price_max: number | null; avg_rating: number | null;
    review_count: number;
  }>();

  function stars(avg: number | null) {
    if (!avg) return '<span style="font-size:11px;color:var(--color-text-muted);">No reviews</span>';
    const filled = Math.round(avg);
    return Array.from({ length: 5 }, (_, i) =>
      `<span style="color:${i < filled ? 'var(--color-star)' : 'var(--color-star-empty)'};font-size:13px;">★</span>`
    ).join('');
  }

  function avatarHtml(url: string | null, name: string, size = 48) {
    if (url) return `<img src="${url}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">`;
    return `<svg viewBox="0 0 54 54" fill="none" style="width:60%;height:60%;">
      <circle cx="27" cy="20" r="10" fill="var(--color-primary)" opacity="0.8"/>
      <ellipse cx="27" cy="44" rx="16" ry="10" fill="var(--color-primary)" opacity="0.8"/>
    </svg>`;
  }

  const ratingCards = myRatings.results.length > 0
    ? myRatings.results.map(r => {
        const univSvg = getUniversitySvg(r.university);
        return `
        <a href="/p/${r.slug}" style="display:block;text-decoration:none;color:inherit;">
          <div class="rating-card">
            <div class="rc-avatar">${avatarHtml(r.avatar_url, r.photographer_name)}</div>
            <div class="rc-body">
              <div class="rc-name">${r.photographer_name}</div>
              <div class="rc-univ">
                ${univSvg ? `<span style="width:14px;height:14px;display:inline-flex;align-items:center;">${univSvg.replace('<svg ', '<svg width="14" height="14" ')}</span>` : ''}
                ${r.university ?? ''}
              </div>
              <div class="rc-stars">${Array.from({length:5},(_,i)=>`<span style="color:${i<r.score?'var(--color-star)':'var(--color-star-empty)'};font-size:14px;">★</span>`).join('')}</div>
              ${r.review ? `<p class="rc-review">"${r.review}"</p>` : ''}
            </div>
          </div>
        </a>`;
      }).join('')
    : `<p style="color:var(--color-text-muted);font-size:14px;">You haven't rated anyone yet. <a href="/" style="color:var(--color-accent);">Browse photographers</a></p>`;

  const suggestedCards = suggested.results.map(p => `
    <a href="/p/${p.slug}" style="display:block;text-decoration:none;color:inherit;">
      <div class="sug-card">
        <div class="sug-avatar">${avatarHtml(p.avatar_url, p.name)}</div>
        <div class="sug-name">${p.name}</div>
        <div class="sug-stars">${stars(p.avg_rating)}</div>
        <div class="sug-price">$${p.price_min ?? '?'} – $${p.price_max ?? '?'}</div>
        <span class="open-badge">Open for Commission</span>
      </div>
    </a>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

    .welcome {
      font-family: var(--font-serif);
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 0.25rem;
    }
    .welcome-sub {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }

    .section-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }

    /* My ratings */
    .ratings-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 3rem; }

    .rating-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 16px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s;
    }
    .rating-card:hover { border-color: var(--color-primary); }

    .rc-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      overflow: hidden;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #f0f0f0;
    }

    .rc-body { flex: 1; }
    .rc-name { font-size: 15px; font-weight: 500; margin-bottom: 3px; }
    .rc-univ { font-size: 12px; color: var(--color-text-muted); display:flex;align-items:center;gap:4px; margin-bottom: 5px; }
    .rc-stars { margin-bottom: 4px; }
    .rc-review { font-size: 13px; color: var(--color-text-muted); font-style: italic; margin-top: 4px; }

    /* Suggested */
    .sug-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3rem;
    }
      @media (max-width: 480px) {
  .sug-grid { grid-template-columns: repeat(2, 1fr); }
}

    .sug-card {
      display: flex; flex-direction: column; align-items: center;
      text-align: center;
      padding: 1rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s, transform 0.15s;
    }
    .sug-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }

    .sug-avatar {
      width: 72px; height: 72px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: #f5f5f5;
      margin-bottom: 8px;
    }

    .sug-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
    .sug-stars { margin-bottom: 4px; }
    .sug-price { font-size: 12px; color: var(--color-text-muted); margin-bottom: 6px; }
    .open-badge {
      font-size: 10px; font-weight: 500;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: #e6f4ee; color: #1a6e3c;
    }

    .browse-link {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px;
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: 14px; font-weight: 500;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .browse-link:hover { opacity: 0.8; }
  </style>
</head>
<body>
  ${topbar('dashboard', String(user?.role ?? ''))}
  <div class="page">
    <h1 class="welcome">Welcome back, ${user.name as string}</h1>
    <p class="welcome-sub">Find photographers, track your reviews, and book your next shoot.</p>

    <p class="section-label">Photographers available now</p>
    ${suggested.results.length > 0
      ? `<div class="sug-grid">${suggestedCards}</div>`
      : `<p style="color:var(--color-text-muted);font-size:14px;margin-bottom:3rem;">No photographers open for commission right now.</p>`
    }

    <p class="section-label">Your ratings</p>
    <div class="ratings-list">${ratingCards}</div>

    <p class="section-label">Your inquiries</p>
    ${myRequests.results.length === 0
      ? `<p style="color:var(--color-text-muted);font-size:14px;margin-bottom:3rem;">No inquiries sent yet.</p>`
      : `<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:3rem;">
          ${myRequests.results.map(r => `
            <a href="/p/${r.slug}" style="text-decoration:none;color:inherit;">
              <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;
                          border:1.5px solid var(--color-border);border-radius:var(--radius-md);
                          transition:border-color 0.15s;" onmouseover="this.style.borderColor='var(--color-primary)'" onmouseout="this.style.borderColor='var(--color-border)'">
                <div class="rc-avatar">${avatarHtml(r.avatar_url, r.photographer_name)}</div>
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:500;margin-bottom:3px;">${r.photographer_name}</div>
                  ${r.message ? `<div style="font-size:12px;color:var(--color-text-muted);font-style:italic;margin-bottom:4px;">"${r.message}"</div>` : ''}
                </div>
                <span style="font-size:11px;font-weight:500;padding:3px 10px;border-radius:var(--radius-full);
                  background:${r.status === 'accepted' ? '#e6f4ee' : r.status === 'declined' ? '#fdecea' : '#f5f5f5'};
                  color:${r.status === 'accepted' ? '#1a6e3c' : r.status === 'declined' ? '#a32d2d' : 'var(--color-text-muted)'};">
                  ${r.status}
                </span>
              </div>
            </a>`).join('')}
        </div>`}

    <a href="/" class="browse-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      Browse all photographers
    </a>
  </div>
</body>
</html>`;

  return c.html(html);
}