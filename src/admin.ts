import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, footer } from './theme';
import { getTier } from './tiers';
import { esc } from './escape';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

async function isAdminAuthed(c: AppContext): Promise<boolean> {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie.split(';').find(s => s.trim().startsWith('admin_session='))?.split('=')[1];
  if (!token) return false;
  return (await c.env.SESSIONS.get(`admin:${token}`)) === '1';
}

export async function adminPage(c: AppContext) {
  if (!await isAdminAuthed(c)) return c.html(loginPageHtml());

  const photographers = await c.env.unilens_db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at,
           p.subscription_level, p.slug, p.stripe_customer_id, p.commission_open,
           ROUND(AVG(r.score), 1) AS avg_rating, COUNT(r.id) AS review_count
    FROM users u
    LEFT JOIN photographer_profiles p ON p.user_id = u.id
    LEFT JOIN ratings r ON r.photographer_id = u.id
    WHERE u.role = 'photographer'
    GROUP BY u.id
    ORDER BY u.name ASC
  `).all<{
    id: string; name: string; email: string; created_at: number;
    subscription_level: string | null; slug: string | null;
    stripe_customer_id: string | null; commission_open: number | null;
    avg_rating: number | null; review_count: number;
  }>();

  const rows = photographers.results.map(p => {
    const tier = getTier(p.subscription_level ?? 'basic');
    const tierColor = tier === 'pro' ? '#c9a84c' : tier === 'plus' ? '#2563eb' : '#888';
    return `<tr>
      <td>${esc(p.name)}</td>
      <td style="color:var(--color-text-muted);font-size:12px;">${esc(p.email)}</td>
      <td>${p.slug ? `<a href="/p/${p.slug}" target="_blank" style="color:var(--color-accent);">/${p.slug}</a>` : '<span style="color:#ccc;">—</span>'}</td>
      <td style="color:${tierColor};font-weight:500;font-size:12px;">${tier.toUpperCase()}</td>
      <td>
        <select class="tier-sel" data-id="${p.id}" onchange="setTier('${p.id}',this.value)">
          <option value="basic" ${tier === 'basic' ? 'selected' : ''}>Basic</option>
          <option value="plus"  ${tier === 'plus'  ? 'selected' : ''}>Plus</option>
          <option value="pro"   ${tier === 'pro'   ? 'selected' : ''}>Pro</option>
        </select>
      </td>
      <td style="font-size:12px;">${p.avg_rating != null ? `${p.avg_rating} ★ (${p.review_count})` : '<span style="color:#ccc;">—</span>'}</td>
      <td style="font-size:11px;color:var(--color-text-muted);">${p.stripe_customer_id ? p.stripe_customer_id.slice(0, 14) + '…' : '—'}</td>
      <td style="font-size:11px;color:var(--color-text-muted);">${p.created_at ? new Date(p.created_at * 1000).toLocaleDateString() : '—'}</td>
    </tr>`;
  }).join('');

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    body { padding: 2rem; }
    .toprow { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.25rem; }
    h1 { font-family: var(--font-serif); font-size: 28px; font-weight: 400; }
    .logout { font-size: 13px; color: var(--color-text-muted); text-decoration: none; }
    .logout:hover { color: var(--color-accent); }
    .subtitle { font-size: 14px; color: var(--color-text-muted); margin-bottom: 2rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; white-space: nowrap; }
    th { text-align: left; font-size: 11px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase; color: var(--color-text-muted); padding: 8px 12px; border-bottom: 1.5px solid var(--color-border); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    tr:hover td { background: var(--color-hover); }
    .tier-sel { border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); padding: 4px 8px; font-family: var(--font-sans); font-size: 12px; font-weight: 500; background: white; cursor: pointer; }
    .tier-sel:focus { outline: none; border-color: var(--color-primary); }
    .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: white; padding: 10px 24px; border-radius: var(--radius-full); font-size: 13px; font-weight: 500; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100; }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <div class="toprow">
    <h1>Admin Panel</h1>
    <a href="/admin/logout" class="logout">Log out</a>
  </div>
  <p class="subtitle">${photographers.results.length} photographer${photographers.results.length !== 1 ? 's' : ''}</p>
  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>Name</th><th>Email</th><th>Profile</th>
        <th>Tier</th><th>Set Tier</th>
        <th>Rating</th><th>Stripe ID</th><th>Joined</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="toast" id="toast"></div>
  <script>
    function showToast(msg, ok) {
      var t = document.getElementById('toast');
      t.style.background = ok === false ? '#a32d2d' : 'var(--color-primary)';
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 2500);
    }
    async function setTier(userId, tier) {
      var res = await fetch('/admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier: tier })
      });
      var data = await res.json();
      if (res.ok) showToast('Tier set to ' + tier.toUpperCase(), true);
      else showToast('Error: ' + (data.error || 'Failed'), false);
    }
  </script>
${footer}
  </body>
</html>`);
}

function loginPageHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    body { display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { width:300px; text-align:center; }
    h1 { font-family:var(--font-serif); font-size:28px; font-weight:400; margin-bottom:0.5rem; }
    p { font-size:14px; color:var(--color-text-muted); margin-bottom:1.5rem; }
    input { width:100%; padding:10px 14px; border:1.5px solid var(--color-border); border-radius:var(--radius-sm); font-family:var(--font-sans); font-size:14px; outline:none; margin-bottom:12px; box-sizing:border-box; }
    input:focus { border-color:var(--color-primary); }
    button { width:100%; padding:10px; background:var(--color-primary); color:white; border:none; border-radius:var(--radius-full); font-family:var(--font-sans); font-size:14px; font-weight:500; cursor:pointer; transition:opacity 0.15s; }
    button:hover { opacity:0.85; }
    .err { color:#a32d2d; font-size:13px; margin-top:8px; min-height:18px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Admin</h1>
    <p>UniLens admin panel</p>
    <input type="password" id="pwd" placeholder="Password" onkeydown="if(event.key==='Enter')login()">
    <button onclick="login()">Log in</button>
    <p class="err" id="err"></p>
  </div>
  <script>
    async function login() {
      var res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: document.getElementById('pwd').value })
      });
      if (res.ok) location.reload();
      else {
        var d = await res.json();
        document.getElementById('err').textContent = d.error || 'Invalid password';
      }
    }
  </script>
${footer}
  </body>
</html>`;
}

export async function adminLogin(c: AppContext) {
  const { password } = await c.req.json() as { password: string };
  if (!c.env.ADMIN_SECRET || password !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Invalid password' }, 401);
  }
  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(`admin:${token}`, '1', { expirationTtl: 60 * 60 * 8 }); // 8h
  c.header('Set-Cookie', `admin_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/admin`);
  return c.json({ ok: true });
}

export async function adminSetTier(c: AppContext) {
  if (!await isAdminAuthed(c)) return c.json({ error: 'Unauthorized' }, 401);

  const { user_id, tier } = await c.req.json() as { user_id?: string; tier?: string };
  if (!user_id) return c.json({ error: 'Missing user_id' }, 400);
  if (!['basic', 'plus', 'pro'].includes(tier ?? '')) return c.json({ error: 'Invalid tier' }, 400);

  if (tier === 'basic') {
    await c.env.unilens_db.prepare(
      `UPDATE photographer_profiles SET subscription_level = 'basic', stripe_subscription_id = NULL, also_serves = '[]' WHERE user_id = ?`
    ).bind(user_id).run();
  } else {
    const newLimit = tier === 'plus' ? 2 : 5;
    await c.env.unilens_db.prepare(
      `UPDATE photographer_profiles
       SET subscription_level = ?,
           also_serves = (
             SELECT json(json_group_array(value))
             FROM (
               SELECT value FROM json_each(also_serves) LIMIT ?
             )
           )
       WHERE user_id = ?`
    ).bind(tier, newLimit, user_id).run();
  }

  return c.json({ ok: true });
}

export async function adminLogout(c: AppContext) {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie.split(';').find(s => s.trim().startsWith('admin_session='))?.split('=')[1];
  if (token) await c.env.SESSIONS.delete(`admin:${token}`);
  c.header('Set-Cookie', 'admin_session=; HttpOnly; Path=/admin; Max-Age=0');
  return c.redirect('/admin');
}