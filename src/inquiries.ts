import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar, footer } from './theme';
import { esc } from './escape';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function inquiriesPage(c: AppContext) {
  const user = c.get('user');
  const role = String(user.role);

  if (role === 'photographer') {
    const rows = await c.env.unilens_db.prepare(`
      SELECT cr.id, cr.message, cr.status, cr.created_at,
             u.name AS client_name, u.email AS client_email
      FROM contact_requests cr
      JOIN users u ON u.id = cr.client_id
      WHERE cr.photographer_id = ?
      ORDER BY cr.created_at DESC
    `).bind(user.id).all<{
      id: string; message: string | null; status: string;
      created_at: number; client_name: string; client_email: string;
    }>();

    const items = rows.results.length === 0
      ? `<p class="empty">No inquiries yet. Make sure your profile is set to open for commission.</p>`
      : rows.results.map(r => `
        <div class="inquiry-card" id="card-${r.id}">
          <div class="iq-header">
            <div>
              <span class="iq-name">${esc(r.client_name)}</span>
              <span class="iq-email">${esc(r.client_email)}</span>
            </div>
            <span class="status-badge ${r.status}">${r.status}</span>
          </div>
          ${r.message ? `<p class="iq-msg">"${esc(r.message)}"</p>` : '<p class="iq-msg no-msg">No message provided.</p>'}
          ${r.status === 'pending' ? `
            <div class="iq-actions" id="actions-${r.id}">
              <button class="iq-btn accept" onclick="respond('${r.id}','accept')">Accept</button>
              <button class="iq-btn decline" onclick="respond('${r.id}','decline')">Decline</button>
            </div>` : ''}
        </div>`).join('');

    return c.html(page(topbar('inquiries', role), `
      <h1 class="page-title">Inquiries</h1>
      <p class="page-sub">Clients who want to work with you. Accept to unlock their ability to leave a rating.</p>
      <div class="list">${items}</div>
    `, `
      async function respond(id, action) {
        const res = await fetch('/contact/' + id + '/' + action, { method: 'POST' });
        if (!res.ok) return;
        document.getElementById('actions-' + id).outerHTML =
          '<span class="status-badge ' + action + 'd" style="margin-top:8px;display:inline-block;">' + action + 'd</span>';
        document.getElementById('card-' + id).querySelector('.status-badge').className = 'status-badge ' + action + 'd';
        document.getElementById('card-' + id).querySelector('.status-badge').textContent = action + 'd';
      }
    `));
  }

  // Client view
  const rows = await c.env.unilens_db.prepare(`
    SELECT cr.id, cr.message, cr.status, cr.created_at,
           u.name AS photographer_name, p.slug, p.avatar_url
    FROM contact_requests cr
    JOIN users u ON u.id = cr.photographer_id
    JOIN photographer_profiles p ON p.user_id = cr.photographer_id
    WHERE cr.client_id = ?
    ORDER BY cr.created_at DESC
  `).bind(user.id).all<{
    id: string; message: string | null; status: string; created_at: number;
    photographer_name: string; slug: string; avatar_url: string | null;
  }>();

  const items = rows.results.length === 0
    ? `<p class="empty">You haven't sent any inquiries yet. <a href="/">Browse photographers</a> to get started.</p>`
    : rows.results.map(r => `
      <a href="/p/${r.slug}" class="inquiry-card link-card">
        <div class="iq-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="iq-avatar">
              ${r.avatar_url
                ? `<img src="${r.avatar_url}" alt="${r.photographer_name}">`
                : `<svg viewBox="0 0 54 54" fill="none" style="width:60%;height:60%;">
                    <circle cx="27" cy="20" r="10" fill="var(--color-primary)" opacity="0.8"/>
                    <ellipse cx="27" cy="44" rx="16" ry="10" fill="var(--color-primary)" opacity="0.8"/>
                  </svg>`}
            </div>
            <span class="iq-name">${esc(r.photographer_name)}</span>
          </div>
          <span class="status-badge ${r.status}">${r.status}</span>
        </div>
        ${r.message ? `<p class="iq-msg">"${esc(r.message)}"</p>` : ''}
        ${r.status === 'accepted'
          ? `<p class="iq-hint">✓ You can now leave a rating on their profile.</p>`
          : r.status === 'declined'
          ? `<p class="iq-hint">This photographer isn't available. Try someone else.</p>`
          : ''}
      </a>`).join('');

  return c.html(page(topbar('inquiries', role), `
    <h1 class="page-title">Your Inquiries</h1>
    <p class="page-sub">Track the status of your outreach to photographers.</p>
    <div class="list">${items}</div>
    <a href="/" class="browse-btn">Browse photographers</a>
  `, ''));
}

function page(nav: string, body: string, script: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiries — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page { max-width: 680px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .page-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; margin-bottom: 0.25rem; }
    .page-sub { font-size: 14px; color: var(--color-text-muted); margin-bottom: 2rem; }
    .list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 2rem; }

    .inquiry-card {
      padding: 16px 20px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color 0.15s;
    }
    .inquiry-card:hover { border-color: var(--color-primary); }
    .link-card { display: block; text-decoration: none; color: inherit; }

    .iq-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 12px; }
    .iq-name { font-size: 15px; font-weight: 500; display: block; }
    .iq-email { font-size: 12px; color: var(--color-text-muted); }
    .iq-msg { font-size: 13px; color: var(--color-text-muted); font-style: italic; margin-bottom: 10px; }
    .iq-msg.no-msg { opacity: 0.5; }
    .iq-hint { font-size: 12px; margin-top: 6px; color: var(--color-text-muted); }

    .iq-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      border: 2px solid var(--color-primary);
      overflow: hidden; display: flex; align-items: center;
      justify-content: center; background: #f0f0f0; flex-shrink: 0;
    }
    .iq-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .status-badge {
      font-size: 11px; font-weight: 500; padding: 3px 10px;
      border-radius: var(--radius-full); white-space: nowrap; flex-shrink: 0;
    }
    .status-badge.pending  { background: #f5f5f5; color: var(--color-text-muted); }
    .status-badge.accepted { background: #e6f4ee; color: #1a6e3c; }
    .status-badge.declined { background: #fdecea; color: #a32d2d; }

    .iq-actions { display: flex; gap: 8px; margin-top: 10px; }
    .iq-btn {
      padding: 6px 16px; border-radius: var(--radius-full);
      border: 1.5px solid; font-family: var(--font-sans);
      font-size: 12px; font-weight: 500; cursor: pointer; background: white;
      transition: background 0.15s;
    }
    .iq-btn.accept { border-color: #1a6e3c; color: #1a6e3c; }
    .iq-btn.accept:hover { background: #e6f4ee; }
    .iq-btn.decline { border-color: #a32d2d; color: #a32d2d; }
    .iq-btn.decline:hover { background: #fdecea; }

    .empty { font-size: 14px; color: var(--color-text-muted); }
    .empty a { color: var(--color-accent); }

    .browse-btn {
      display: inline-flex; align-items: center;
      padding: 10px 24px; background: var(--color-primary); color: white;
      border-radius: var(--radius-full); font-size: 14px; font-weight: 500;
      text-decoration: none; transition: opacity 0.15s;
    }
    .browse-btn:hover { opacity: 0.8; }
  </style>
</head>
<body>
  ${nav}
  <div class="page">${body}</div>
  ${script ? `<script>${script}</script>` : ''}
${footer}
  </body>
</html>`;
}