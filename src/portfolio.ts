import { Context } from 'hono';
import { Env, Variables, PhotographerProfile } from './types';
import { sanitizePortfolio } from './sanitize';
import { theme, favicon, topbarStyles, topbar } from './theme';
import { getUniversitySvg } from './universities';


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
  const user = c.get('user');
  const userRole = String(user?.role ?? '');
  const isLoggedIn = userRole !== '' && userRole !== ' ' && userRole !== undefined && userRole !== null;
  const existingRequest = userRole === 'client'
    ? await c.env.unilens_db.prepare(
        `SELECT status FROM contact_requests WHERE client_id = ? AND photographer_id = (SELECT user_id FROM photographer_profiles WHERE slug = ?)`
      ).bind(user?.id, slug).first<{ status: string }>()
    : null;
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
      COUNT(r.id)             AS review_count,
      p.user_id
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

  // Price meta-row
  const priceHtml = isLoggedIn
    ? `<span class="price">$${profile.price_min ?? '?'} – $${profile.price_max ?? '?'}</span>`
    : `<div class="locked-wrap">
       <span class="locked-content price">$Log – $In</span>
       <div class="locked-overlay"><a href="/login">Log in to view</a></div>
     </div>`;

  // Bio
  const bioHtml = isLoggedIn
    ? `<p style="font-size:14px;color:var(--color-text-muted);line-height:1.6;">${profile.bio ?? ''}</p>`
    : `<div class="locked-wrap">
       <p class="locked-content" style="font-size:14px;line-height:1.6;">
         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
       </p>
       <div class="locked-overlay"><a href="/login">Log in to view</a></div>
     </div>`;

  // Portfolio area
  const portfolioHtml = isLoggedIn
    ? `<div class="custom-area">
       <iframe srcdoc="${profile.portfolio_html.replace(/"/g, '&quot;')}"
         sandbox="allow-same-origin" title="${profile.name}'s portfolio"></iframe>
     </div>`
    : `<div class="portfolio-locked-wrap">
       <div class="custom-area locked-content">
         <iframe srcdoc="<html><body style='font-family:sans-serif;padding:40px;'>
           <div style='display:grid;grid-template-columns:1fr 1fr;gap:16px;'>
             <div style='background:#eee;height:200px;border-radius:8px;'></div>
             <div style='background:#ddd;height:200px;border-radius:8px;'></div>
             <div style='background:#e8e8e8;height:200px;border-radius:8px;'></div>
             <div style='background:#d8d8d8;height:200px;border-radius:8px;'></div>
           </div>
         </body></html>"
           sandbox="allow-same-origin" title="Locked portfolio"></iframe>
       </div>
       <div class="locked-overlay"><a href="/login">Log in to view portfolio</a></div>
     </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}

    body { padding: 0; }

    .page-content {
      max-width: 1100px;
      width: 90%;
      margin: 0 auto;
      padding: 2rem 0 4rem;
    }

    .profile-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2.5rem;
      align-items: start;
    }

    .sidebar { position: sticky; top: 2rem; }

    .avatar {
      width: 110px; height: 110px;
      border-radius: 50%;
      border: 2.5px solid var(--color-primary);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      margin-bottom: 1rem;
    }

    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar svg { width: 60%; height: 60%; }

    .photographer-name {
      font-family: var(--font-serif);
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 12px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    .price { font-size: 15px; font-weight: 500; color: var(--color-text); }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 12px;
      border-radius: var(--radius-full);
      margin-top: 6px;
    }
    .badge.open   { background: #e6f4ee; color: #1a6e3c; }
    .badge.closed { background: #fdecea; color: #a32d2d; }

    .stars { display: flex; align-items: center; gap: 3px; margin-top: 10px; }
    .star  { font-size: 16px; color: var(--color-star); }
    .star.empty { color: var(--color-star-empty); }
    .rating-label { font-size: 12px; color: var(--color-text-muted); margin-left: 6px; }

    hr { border: none; border-top: 0.5px solid var(--color-border); margin: 1.5rem 0; }

    .section-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 10px;
    }

    .custom-area {
      border: 2.5px solid var(--color-primary);
      border-radius: var(--radius-sm);
      min-height: 600px;
      overflow: hidden;
    }

    .custom-area iframe {
      width: 100%;
      min-height: 600px;
      border: none;
      display: block;
    }

    .locked-wrap {
  position: relative;
  display: inline-block;
}
.locked-wrap .locked-content {
  filter: blur(5px);
  user-select: none;
  pointer-events: none;
}
.locked-wrap .locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.locked-overlay a {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-accent);
  background: white;
  border: 1.5px solid var(--color-accent);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-decoration: none;
  white-space: nowrap;
}

.portfolio-locked-wrap {
  position: relative;
}
.portfolio-locked-wrap .locked-content {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}
.portfolio-locked-wrap .locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.3);
}
.portfolio-locked-wrap .locked-overlay a {
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: var(--color-accent);
  padding: 10px 28px;
  border-radius: var(--radius-full);
  text-decoration: none;
}
  </style>
</head>
<body>
  ${topbar('', String(user?.role ?? ''))}

  <div class="page-content">
    <div class="profile-layout">

      <aside class="sidebar">
        <div class="avatar">${avatarContent}</div>
        <h1 class="photographer-name">${profile.name}</h1>
        <div class="meta-row">
          ${profile.university && getUniversitySvg(profile.university)
  ? `<span style="width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;">${getUniversitySvg(profile.university).replace('<svg ', '<svg width="20" height="20" ')}</span>`
  : `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`
}
${profile.university ?? 'University not set'}
        </div>
        <div class="meta-row">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h6M5 11.5L8 13l3-1.5V3.5a1 1 0 00-1-1H6a1 1 0 00-1 1v8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${priceHtml}
        </div>
        ${commissionBadge}
        ${userRole === 'client' && profile.commission_open ? (() => {
          if (existingRequest?.status === 'accepted') {
            return `<div style="margin-top:10px;font-size:12px;color:#1a6e3c;font-weight:500;">✓ Request accepted — you can now rate this photographer</div>`;
          }
          if (existingRequest?.status === 'pending') {
            return `<div style="margin-top:10px;font-size:12px;color:var(--color-text-muted);">⏳ Inquiry sent — waiting for response</div>`;
          }
          if (existingRequest?.status === 'declined') {
            return `<div style="margin-top:10px;font-size:12px;color:#a32d2d;">Request declined</div>`;
          }
          return `
            <div style="margin-top:12px;">
              <textarea id="contact-msg" placeholder="Introduce yourself and describe your shoot…"
                style="width:100%;padding:8px 10px;font-family:var(--font-sans);font-size:13px;
                       border:1.5px solid var(--color-border);border-radius:var(--radius-sm);
                       outline:none;resize:vertical;min-height:80px;margin-bottom:8px;"></textarea>
              <button onclick="sendInquiry()"
                style="padding:8px 20px;background:var(--color-primary);color:white;border:none;
                       border-radius:var(--radius-full);font-family:var(--font-sans);font-size:13px;
                       font-weight:500;cursor:pointer;">Send inquiry</button>
              <p id="contact-msg-status" style="font-size:12px;margin-top:6px;min-height:16px;"></p>
            </div>`;
        })() : ''}
        <div class="stars">
          ${profile.review_count > 0
      ? stars(profile.avg_rating) + `<span class="rating-label">${profile.avg_rating} (${profile.review_count} review${profile.review_count !== 1 ? 's' : ''})</span>`
      : '<span style="font-size:12px;color:var(--color-text-muted);">No reviews yet</span>'
    }
        </div>
        <hr>
        ${bioHtml}
        ${userRole === 'client' ? `
        <hr>
        <p class="section-label">Rate this photographer</p>
        <div style="margin-top:8px;">
          <div id="star-pick" style="display:flex;gap:6px;margin-bottom:10px;cursor:pointer;">
            ${[1,2,3,4,5].map(i =>
              `<span class="pick-star" onclick="setStar(${i})"
                style="font-size:24px;color:var(--color-star-empty);transition:color 0.1s;">★</span>`
            ).join('')}
          </div>
          <textarea id="review-text" placeholder="Leave a review (optional)…"
            style="width:100%;padding:8px 10px;font-family:var(--font-sans);font-size:13px;
                   border:1.5px solid var(--color-border);border-radius:var(--radius-sm);
                   outline:none;resize:vertical;min-height:70px;margin-bottom:8px;"></textarea>
          <button onclick="submitRating()"
            style="padding:8px 20px;background:var(--color-accent);color:white;border:none;
                   border-radius:var(--radius-full);font-family:var(--font-sans);font-size:13px;
                   font-weight:500;cursor:pointer;">Submit rating</button>
          <p id="rate-msg" style="font-size:12px;margin-top:8px;min-height:16px;"></p>
        </div>` : ''}
      </aside>

      <main>
  <p class="section-label">Portfolio</p>
  ${portfolioHtml}
</main>

    </div>
  </div>
${userRole === 'client' ? `
  <script>
    (function(){
      let chosen = 0;
      function setStar(v) {
        chosen = v;
        document.querySelectorAll('.pick-star').forEach((s,i) => {
          s.style.color = i < v ? 'var(--color-star)' : 'var(--color-star-empty)';
        });
      }
      async function submitRating() {
        const msg = document.getElementById('rate-msg');
        if (!chosen) { msg.textContent = 'Select a star rating first.'; return; }
        const res = await fetch('/rate/${profile.user_id}', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ score: chosen, review: document.getElementById('review-text').value || null })
        });
        const d = await res.json();
        msg.style.color = res.ok ? '#1a6e3c' : '#a32d2d';
        msg.textContent = res.ok ? '✓ Rating submitted!' : (d.error ?? 'Error submitting rating');
      }
      window.setStar = setStar;
      window.submitRating = submitRating;
      
      async function sendInquiry() {
        const status = document.getElementById('contact-msg-status');
        const res = await fetch('/contact/${profile.user_id}', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ message: document.getElementById('contact-msg').value || null })
        });
        const d = await res.json();
        status.style.color = res.ok ? '#1a6e3c' : '#a32d2d';
        status.textContent = res.ok ? '✓ Inquiry sent!' : (d.error ?? 'Error sending inquiry');
        if (res.ok) {
          document.getElementById('contact-msg').disabled = true;
          document.querySelector('[onclick="sendInquiry()"]').disabled = true;
        }
      }
      window.sendInquiry = sendInquiry;
    })();
  </script>` : ''}
</body>
</html>`;

  return c.html(html);
}

export async function getPhotographers(c: AppContext) {
  const search = c.req.query('search') ?? '';
  const university = c.req.query('university') ?? '';

  const photographers = await c.env.unilens_db.prepare(`
    SELECT
      u.name,
      p.slug,
      p.bio,
      p.university,
      p.price_min,
      p.price_max,
      p.commission_open,
      p.avatar_url,
      ROUND(AVG(r.score), 1) AS avg_rating,
      COUNT(r.id)             AS review_count,
      p.user_id
    FROM photographer_profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN ratings r ON r.photographer_id = p.user_id
    WHERE (? = '' OR u.name LIKE '%' || ? || '%')
      AND (? = '' OR p.university = ?)
    GROUP BY p.user_id
    ORDER BY avg_rating DESC
  `).bind(search, search, university, university).all();

  return c.json(photographers.results);
}