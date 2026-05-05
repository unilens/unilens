import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar, footer } from './theme';
import { TIERS, getTier } from './tiers';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function pricingPage(c: AppContext) {
  const user = c.get('user');
  const isPhotographer = user?.role === 'photographer';

  let currentTier: 'basic' | 'plus' | 'pro' = 'basic';
  if (isPhotographer) {
    const profile = await c.env.unilens_db.prepare(
      `SELECT subscription_level FROM photographer_profiles WHERE user_id = ?`
    ).bind(user!.id).first<{ subscription_level: string }>();
    currentTier = getTier(profile?.subscription_level ?? 'basic');
  }

  function tierBtn(tier: 'basic' | 'plus' | 'pro') {
    if (!isPhotographer) {
      if (tier === 'basic') return `<button class="tier-btn secondary" onclick="location.href='/register'">Sign up free</button>`;
      return `<button class="tier-btn primary" onclick="location.href='/register'">Get ${TIERS[tier].label}</button>`;
    }
    if (currentTier === tier) {
      return `<button class="tier-btn secondary" disabled>Current plan</button>`;
    }
    if (tier === 'basic') {
      return `<button class="tier-btn secondary" disabled>Free forever</button>`;
    }
    return `<button class="tier-btn primary" id="btn-${tier}" onclick="checkout('${tier}')">Upgrade to ${TIERS[tier].label}</button>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page { max-width: 920px; margin: 0 auto; padding: 3rem 1.5rem 6rem; }
    .page-title { font-family: var(--font-serif); font-size: 40px; font-weight: 400; text-align: center; margin-bottom: 0.5rem; }
    .page-sub { font-size: 16px; color: var(--color-text-muted); text-align: center; margin-bottom: 2rem; }

    .billing-toggle {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-bottom: 2.5rem;
    }
    .toggle-btn {
      padding: 6px 18px; border-radius: var(--radius-full);
      border: 1.5px solid var(--color-border);
      background: white; cursor: pointer; font-family: var(--font-sans);
      font-size: 13px; font-weight: 500; color: var(--color-text-muted);
      transition: background 0.15s, border-color 0.15s;
    }
    .toggle-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .save-badge {
      font-size: 11px; background: #e6f4ee; color: #1a6e3c;
      padding: 2px 7px; border-radius: var(--radius-full); font-weight: 500;
      margin-left: 6px;
    }

    .tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    @media (max-width: 640px) { .tiers { grid-template-columns: 1fr; } }

    .tier-card {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: 2rem 1.5rem; display: flex; flex-direction: column;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .tier-card:hover { border-color: var(--color-primary); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .tier-card.featured { border-color: var(--color-accent); box-shadow: 0 4px 20px rgba(204,0,0,0.08); }

    .tier-name { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px; }
    .tier-price { font-family: var(--font-serif); font-size: 38px; font-weight: 400; margin-bottom: 4px; }
    .tier-price-sub { font-size: 14px; font-family: var(--font-sans); color: var(--color-text-muted); }
    .tier-desc { font-size: 13px; color: var(--color-text-muted); margin: 10px 0 1.5rem; line-height: 1.6; }

    .tier-features { list-style: none; margin-bottom: 2rem; flex: 1; }
    .tier-features li {
      font-size: 13px; padding: 7px 0;
      border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center; gap: 8px;
    }
    .tier-features li:last-child { border-bottom: none; }
    .check { color: #1a6e3c; font-size: 13px; flex-shrink: 0; }
    .cross { color: #ccc; font-size: 13px; flex-shrink: 0; }
    .feat-off { color: #aaa; }

    .tier-btn {
      width: 100%; padding: 11px; border-radius: var(--radius-full);
      font-family: var(--font-sans); font-size: 14px; font-weight: 500;
      border: none; cursor: pointer; transition: opacity 0.15s;
    }
    .tier-btn.primary { background: var(--color-accent); color: white; }
    .tier-btn.secondary { background: white; border: 1.5px solid var(--color-border); color: var(--color-text-muted); }
    .tier-btn:hover:not(:disabled) { opacity: 0.85; }
    .tier-btn:disabled { opacity: 0.45; cursor: default; }

    .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: white; padding: 10px 24px; border-radius: var(--radius-full); font-size: 13px; font-weight: 500; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100; }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  ${topbar('', String(user?.role ?? ''))}
  <div class="page">
    <h1 class="page-title">Simple pricing</h1>
    <p class="page-sub">For photographers on UniLens. Cancel any time.</p>

    <div class="billing-toggle">
      <button class="toggle-btn active" id="btn-monthly" onclick="setBilling('monthly')">Monthly</button>
      <button class="toggle-btn" id="btn-yearly" onclick="setBilling('yearly')">Yearly <span class="save-badge">Save ~17%</span></button>
    </div>

    <div class="tiers">

      <div class="tier-card">
        <p class="tier-name">Basic</p>
        <p class="tier-price">$0</p>
        <p class="tier-price-sub">free forever</p>
        <p class="tier-desc">Everything you need to get started.</p>
        <ul class="tier-features">
          <li><span class="check">✓</span> 6 photos</li>
          <li><span class="check">✓</span> 10 MB upload limit</li>
          <li><span class="check">✓</span> Simple grid + custom HTML portfolio</li>
          <li><span class="cross">✗</span> <span class="feat-off">Ads-free profile</span></li>
          <li><span class="cross">✗</span> <span class="feat-off">Pro badge</span></li>
          <li><span class="cross">✗</span> <span class="feat-off">Boosted search ranking</span></li>
        </ul>
        ${tierBtn('basic')}
      </div>

      <div class="tier-card featured">
        <p class="tier-name">Plus</p>
        <p class="tier-price" id="plus-price">$${TIERS.plus.monthlyPrice}</p>
        <p class="tier-price-sub" id="plus-period">per month</p>
        <p class="tier-desc">More photos and a cleaner profile experience.</p>
        <ul class="tier-features">
          <li><span class="check">✓</span> 12 photos</li>
          <li><span class="check">✓</span> 18 MB upload limit</li>
          <li><span class="check">✓</span> Simple grid + custom HTML portfolio</li>
          <li><span class="check">✓</span> No ads on your profile</li>
          <li><span class="cross">✗</span> <span class="feat-off">Pro badge</span></li>
          <li><span class="cross">✗</span> <span class="feat-off">Boosted search ranking</span></li>
        </ul>
        ${tierBtn('plus')}
      </div>

      <div class="tier-card">
        <p class="tier-name">Pro</p>
        <p class="tier-price" id="pro-price">$${TIERS.pro.monthlyPrice}</p>
        <p class="tier-price-sub" id="pro-period">per month</p>
        <p class="tier-desc">Maximum photos, top search placement, and a Pro badge.</p>
        <ul class="tier-features">
          <li><span class="check">✓</span> 24 photos</li>
          <li><span class="check">✓</span> 26 MB upload limit</li>
          <li><span class="check">✓</span> Simple grid + custom HTML portfolio</li>
          <li><span class="check">✓</span> No ads on your profile</li>
          <li><span class="check">✓</span> ⚡ Pro badge on profile + cards</li>
          <li><span class="check">✓</span> Boosted search ranking</li>
        </ul>
        ${tierBtn('pro')}
      </div>

    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    var billing = 'monthly';
    var isPhotographer = ${isPhotographer ? 'true' : 'false'};

    function setBilling(mode) {
      billing = mode;
      document.getElementById('btn-monthly').classList.toggle('active', mode === 'monthly');
      document.getElementById('btn-yearly').classList.toggle('active', mode === 'yearly');
      var plusAmt  = mode === 'yearly' ? ${TIERS.plus.yearlyPrice} : ${TIERS.plus.monthlyPrice};
      var proAmt   = mode === 'yearly' ? ${TIERS.pro.yearlyPrice}  : ${TIERS.pro.monthlyPrice};
      var period   = mode === 'yearly' ? 'per year' : 'per month';
      document.getElementById('plus-price').textContent = '$' + plusAmt;
      document.getElementById('plus-period').textContent = period;
      document.getElementById('pro-price').textContent = '$' + proAmt;
      document.getElementById('pro-period').textContent = period;
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 3000);
    }

    async function checkout(tier) {
      if (!isPhotographer) { window.location.href = '/login'; return; }
      var btn = document.getElementById('btn-' + tier);
      if (btn) { btn.disabled = true; btn.textContent = 'Redirecting…'; }
      var res = await fetch('/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier, billing: billing })
      });
      var data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast('Error: ' + (data.error || 'Something went wrong'));
        if (btn) { btn.disabled = false; btn.textContent = 'Upgrade to ' + tier.charAt(0).toUpperCase() + tier.slice(1); }
      }
    }
  </script>
${footer}
  </body>
</html>`;

  return c.html(html);
}