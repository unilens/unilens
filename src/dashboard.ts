import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar, footer } from './theme';
import { universities, getUniversitySvg } from './universities';
import { TIERS, getTier } from './tiers';
import { esc } from './escape';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function dashboardPage(c: AppContext) {
  const user = c.get('user');

  if (user.role !== 'photographer') {
    return c.redirect('/dashboard/client');
  }

  const profile = await c.env.unilens_db.prepare(`
    SELECT * FROM photographer_profiles WHERE user_id = ?
  `).bind(user.id).first<{
    bio: string; portfolio_html: string; slug: string;
    price_min: number; price_max: number; commission_open: number;
    avatar_url: string; university: string; subscription_level: string;
    layout_mode: string; grid_images: string; also_serves: string;
  }>();

  const tierConfig = TIERS[getTier(profile?.subscription_level ?? 'basic')];
  // Resolve the currently-selected university for server-side render
  const currentUniv = universities.find(u => u.name === profile?.university);
  const rawIcon = currentUniv?.svg ?? '';
  const currentIcon = rawIcon.replace(/`/g, '&#96;').replace(/\$\{/g, '&#36;{');
  const currentLabel = profile?.university ?? 'Select university...';
  const layoutMode = profile?.layout_mode ?? 'simple';
  const gridImages: string[] = JSON.parse(profile?.grid_images ?? '[]');
  const alsoServesInit: string[] = JSON.parse(profile?.also_serves ?? '[]');
  const alsoServesLimit = tierConfig.alsoServesLimit;
  const gridThumbsHtml = gridImages.map((url, i) => `
    <div class="grid-thumb" id="thumb-${i}">
      <img src="${url}" alt="">
      <button class="thumb-remove" onclick="removeGridImage('${url}')">&times;</button>
    </div>`).join('');

  // Build the dropdown option list
  const safeSvg = (s: string) => s.replace(/`/g, '&#96;').replace(/\$\{/g, '&#36;{');
  const univOptions = universities.map(u => {
    const selected = profile?.university === u.name ? ' selected' : '';
    const safeName = u.name.replace(/"/g, '&quot;');
    return `
      <div class="univ-option${selected}" data-name="${safeName}">
        <span class="univ-opt-icon">${safeSvg(u.svg)}</span>
        <span>${u.name}</span>
      </div>`;
  }).join('');

  function alsoServesTagHtml(name: string) {
    const svg = getUniversitySvg(name);
    return `<span class="also-tag" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:4px 10px;border:1.5px solid var(--color-border);border-radius:var(--radius-full);background:white;">
      ${svg ? svg.replace('<svg ', '<svg width="14" height="14" ') : ''}
      ${esc(name)}
      <button class="also-tag-remove" data-name="${esc(name)}" style="background:none;border:none;cursor:pointer;padding:0;font-size:14px;line-height:1;color:var(--color-text-muted);">×</button>
    </span>`;
  }
  
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


    .plan-section {
  padding: 12px 14px;
  background: var(--color-hover);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}
.plan-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.plan-label { font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-muted); }
.plan-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); }
.plan-basic { background: #f0f0f0; color: #666; }
.plan-plus  { background: #dbeafe; color: #1d4ed8; }
.plan-pro   { background: #1a1a2e; color: #c9a84c; }
.plan-meta  { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.plan-upgrade-btn { font-size: 12px; font-weight: 500; color: var(--color-accent); text-decoration: none; }
.plan-upgrade-btn:hover { text-decoration: underline; }
.plan-manage-btn { background: none; border: none; font-family: var(--font-sans); font-size: 12px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; padding: 0; }
.plan-manage-btn:hover { color: var(--color-primary); }
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 1px 1fr;
      min-height: calc(100vh - 65px);
    }
      @media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
  .divider { display: none; }
}
  @media (max-width: 480px) {
  .fields-grid { grid-template-columns: 1fr; }
}

    .divider { background: var(--color-border); }

    .panel { padding: 2rem; }

    .panel-title {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
    }

    .avatar-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .avatar-wrap {
      width: 80px; height: 80px;
      border-radius: 50%;
      border: 2.5px solid var(--color-primary);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
    }

    .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-wrap svg { width: 55%; height: 55%; }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
      border-radius: 50%;
    }

    .avatar-wrap:hover .avatar-overlay { opacity: 1; }

    .avatar-overlay svg { width: 28px; height: 28px; color: white; }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .form-group { margin-bottom: 12px; }
    .form-group.full { grid-column: 1 / -1; }

    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      margin-bottom: 5px;
    }

    input[type=text], input[type=number], textarea {
      width: 100%;
      padding: 9px 12px;
      font-family: var(--font-sans);
      font-size: 13px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.15s;
      color: var(--color-text);
      background: white;
    }

    input:focus, textarea:focus { border-color: var(--color-primary); }

    /* ── University dropdown ── */
    .univ-select {
      position: relative;
      width: 100%;
    }

    .univ-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13px;
      background: white;
      transition: border-color 0.15s;
      user-select: none;
      min-height: 38px;
    }

    .univ-trigger:hover,
    .univ-select.open .univ-trigger {
      border-color: var(--color-primary);
    }

    .univ-trigger-icon {
      width: 22px; height: 22px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .univ-trigger-icon svg { width: 22px; height: 22px; display: block; }

    .univ-trigger-label {
      flex: 1;
      color: var(--color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .univ-trigger-label.placeholder { color: var(--color-text-muted); }

    .univ-chevron {
      flex-shrink: 0;
      transition: transform 0.15s;
    }

    .univ-select.open .univ-chevron { transform: rotate(180deg); }

    .univ-options {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: white;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      z-index: 50;
      max-height: 220px;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .univ-select.open .univ-options { display: block; }

    .univ-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.1s;
    }

    .univ-option:hover { background: var(--color-hover); }

    .univ-option.selected { background: var(--color-primary-light); font-weight: 500; }

    .univ-opt-icon {
      width: 24px; height: 24px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .univ-opt-icon svg { width: 24px; height: 24px; display: block; }
    /* ── end university dropdown ── */

    .price-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price-row span { font-size: 13px; color: var(--color-text-muted); }

    .commission-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 13px;
    }

    .toggle {
      width: 40px; height: 22px;
      background: var(--color-border);
      border-radius: 11px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      flex-shrink: 0;
    }

    .toggle.on { background: #1a6e3c; }

    .toggle::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      background: white;
      border-radius: 50%;
      top: 3px; left: 3px;
      transition: transform 0.2s;
    }

    .toggle.on::after { transform: translateX(18px); }

    .html-zone {
      width: 100%;
      min-height: 340px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      outline: none;
      resize: vertical;
      transition: border-color 0.15s;
      color: var(--color-text);
      line-height: 1.5;
    }

    .html-zone:focus { border-color: var(--color-primary); }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      background: white;
      transition: border-color 0.15s;
      margin-bottom: 12px;
    }

    .upload-btn:hover { border-color: var(--color-primary); }

    .uploaded-urls {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-bottom: 12px;
      max-height: 80px;
      overflow-y: auto;
    }

    .uploaded-urls a {
      display: block;
      color: var(--color-accent);
      text-decoration: none;
      cursor: pointer;
      margin-bottom: 3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      margin-top: 1rem;
    }

    .undo-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      transition: background 0.15s;
    }

    .undo-btn:hover { background: var(--color-hover); }

    .save-btn {
      padding: 10px 32px;
      background: var(--color-accent);
      color: white;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .save-btn:hover { opacity: 0.85; }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-primary);
      color: white;
      padding: 10px 24px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 100;
    }

    .toast.show { opacity: 1; }

    /* Preview panel */
    .preview-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .preview-avatar {
      width: 80px; height: 80px;
      border-radius: 50%;
      border: 2.5px solid var(--color-primary);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      flex-shrink: 0;
    }

    .preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .preview-avatar svg { width: 55%; height: 55%; }

    .preview-name {
      font-family: var(--font-serif);
      font-size: 22px;
      font-weight: 400;
      margin-bottom: 6px;
    }

    .preview-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-muted);
      margin-bottom: 5px;
    }

    .preview-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 10px;
      border-radius: var(--radius-full);
      background: #e6f4ee;
      color: #1a6e3c;
      margin-top: 4px;
    }

    .preview-badge.closed { background: #fdecea; color: #a32d2d; }

    .preview-divider {
      border: none;
      border-top: 0.5px solid var(--color-border);
      margin: 1rem 0;
    }

    .preview-portfolio-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    .preview-area {
      border: 2.5px solid var(--color-primary);
      border-radius: var(--radius-sm);
      min-height: 300px;
      overflow: hidden;
    }

    .preview-area iframe {
      width: 100%;
      min-height: 300px;
      border: none;
      display: block;
    }

    /* ── Layout toggle ── */
    .layout-toggle {
      display: flex;
      gap: 0;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-bottom: 12px;
      width: fit-content;
    }
    .layout-btn {
      padding: 7px 16px;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 500;
      border: none;
      background: white;
      cursor: pointer;
      color: var(--color-text-muted);
      transition: background 0.15s, color 0.15s;
    }
    .layout-btn:first-child { border-right: 1.5px solid var(--color-border); }
    .layout-btn.active { background: var(--color-primary); color: white; }

    /* ── Simple grid thumbs ── */
    .grid-thumbs {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
      min-height: 40px;
    }
    .grid-thumb {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1.5px solid var(--color-border);
    }
    .grid-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb-remove {
  position: absolute; top: 3px; right: 3px;
  width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); color: white;
  border: none; border-radius: 50%;
  font-size: 12px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.thumb-move {
  position: absolute; bottom: 3px;
  width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); color: white;
  border: none; border-radius: 50%;
  font-size: 11px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.thumb-move.left { left: 3px; }
.thumb-move.right { right: 3px; }
    .grid-empty {
      font-size: 12px;
      color: var(--color-text-muted);
      padding: 12px 0;
    }

    /* Uploaded photos gallery */
    .upload-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .upload-gallery-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1.5px solid var(--color-border);
    }
    .upload-gallery-item img { width:100%;height:100%;object-fit:cover;display:block; }
    .upload-gallery-actions {
      position: absolute; bottom: 0; left: 0; right: 0;
      display: flex; gap: 2px;
      background: rgba(0,0,0,0.65);
      opacity: 0;
      transition: opacity 0.15s;
      padding: 3px;
    }
    .upload-gallery-item:hover .upload-gallery-actions { opacity: 1; }
      .gal-btn {
        flex: 1; background: rgba(255,255,255,0.15); border: none;
        color: white; font-size: 10px; cursor: pointer;
        border-radius: 3px; padding: 3px 0;
        font-family: var(--font-sans); font-weight: 500;
        transition: background 0.1s;
      }
      .gal-btn:hover { background: rgba(255,255,255,0.3); }
      .gal-btn.del { color: #ff9090; }
      .gal-btn.del:hover { background: rgba(180,0,0,0.4); color: white; }
  
      .univ-search-wrap { padding: 6px 8px; border-bottom: 1px solid var(--color-border); }
      .univ-search-input { width: 100%; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); padding: 5px 8px; font-family: var(--font-sans); font-size: 12px; outline: none; }
      .univ-search-input:focus { border-color: var(--color-primary); }
    </style>
</head>
<body>
  ${topbar('dashboard', String(user?.role ?? ''))}

  <div class="dashboard">

    <!-- LEFT: EDITOR -->
    <div class="panel">
      <p class="panel-title">Edit profile</p>

      <div class="avatar-row">
        <div class="avatar-wrap" onclick="document.getElementById('avatar-input').click()">
          <img id="avatar-preview" src="${profile?.avatar_url ?? ''}" style="display:${profile?.avatar_url ? 'block' : 'none'};">
          <svg id="avatar-placeholder" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:${profile?.avatar_url ? 'none' : 'block'};">
            <circle cx="27" cy="20" r="10" fill="var(--color-primary)" opacity="0.8"/>
            <ellipse cx="27" cy="44" rx="16" ry="10" fill="var(--color-primary)" opacity="0.8"/>
          </svg>
          <div class="avatar-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
        </div>
        <div style="flex:1;">
          <div class="form-group">
            <label>Profile URL slug</label>
            <input type="text" id="slug" placeholder="e.g. jane-smith" value="${esc(profile?.slug ?? '')}">
          </div>
        </div>
        <input type="file" id="avatar-input" accept="image/*" style="display:none;" onchange="uploadAvatar(this)">
      </div>

      <div class="fields-grid">
        <div class="form-group">
          <label>Home University</label>
          <div class="univ-select" id="univ-select">
            <div class="univ-trigger" id="univ-trigger" onclick="toggleUnivDropdown(event)">
              <span class="univ-trigger-icon" id="univ-trigger-icon">${currentIcon}</span>
              <span class="univ-trigger-label${currentIcon ? '' : ' placeholder'}" id="univ-trigger-label">${currentLabel}</span>
              <svg class="univ-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="univ-options" id="univ-options">
              <div class="univ-search-wrap"><input class="univ-search-input" id="univ-search" type="text" placeholder="Search..." oninput="filterUnivOptions('univ-options','univ-search')" onclick="event.stopPropagation()"></div>
              <div class="univ-option${!profile?.university ? ' selected' : ''}" data-name="">
                <span class="univ-opt-icon"></span><span>None</span>
              </div>
              ${univOptions}
            </div>
          </div>
          <input type="hidden" id="university" value="${profile?.university ?? ''}">
        </div>
        <div class="form-group full" id="also-serves-group" style="grid-column:1/-1;">
          <label>Also serves <span id="also-serves-count-label" style="font-weight:400;color:var(--color-text-muted);font-size:11px;">(${alsoServesInit.length}/${alsoServesLimit} additional)</span></label>
          ${alsoServesLimit === 0 ? `<p style="font-size:12px;color:var(--color-text-muted);">Upgrade to Plus or Pro to add additional universities.</p>` : `
          <div class="univ-select" id="also-serves-select">
            <div class="univ-trigger" id="also-serves-trigger" onclick="toggleAlsoServesDropdown(event)">
              <span class="univ-trigger-icon"></span>
              <span class="univ-trigger-label placeholder" id="also-serves-trigger-label">Add a university...</span>
              <svg class="univ-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="univ-options" id="also-serves-options">
              <div class="univ-search-wrap"><input class="univ-search-input" id="also-serves-search" type="text" placeholder="Search..." oninput="filterUnivOptions('also-serves-options','also-serves-search')" onclick="event.stopPropagation()"></div>
              ${univOptions}
            </div>
          </div>
          <div id="also-serves-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${alsoServesInit.map((u: string) => alsoServesTagHtml(u)).join('')}</div>
          `}
        </div>
        <div class="form-group">
          <label>Bio</label>
          <input type="text" id="bio" placeholder="Short bio..." value="${esc(profile?.bio ?? '')}">
        </div>
        <div class="form-group">
          <label>Min price ($)</label>
          <input type="number" id="price-min" min="0" value="${profile?.price_min ?? ''}">
        </div>
        <div class="form-group">
          <label>Max price ($)</label>
          <input type="number" id="price-max" min="0" value="${profile?.price_max ?? ''}">
        </div>
      </div>

      <div class="commission-row">
        <button class="toggle ${profile?.commission_open ? 'on' : ''}" id="commission-toggle" onclick="toggleCommission()"></button>
        <span id="commission-label">${profile?.commission_open ? 'Open for Commission' : 'Not Available'}</span>
      </div>

      <div class="form-group">
        <label>Upload images to R2</label>
        <button class="upload-btn" onclick="document.getElementById('image-input').click()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload images
        </button>
        <input type="file" id="image-input" accept="image/*" style="display:none;" onchange="uploadImage(this)">
        <span id="upload-limit-msg" style="display:none;font-size:12px;color:var(--color-text-muted);">You've reached the limit of ${tierConfig.photoLimit} photos on your ${tierConfig.label} plan.</span>
        <div class="uploaded-urls" id="uploaded-urls"></div>
      </div>

      <div class="form-group">
        <label>Uploaded photos</label>
        <div id="upload-gallery-wrap">
          <div style="font-size:12px;color:var(--color-text-muted);">Loading…</div>
        </div>
      </div>

      <div class="form-group">
        <label>Portfolio layout</label>
        <div class="layout-toggle">
          <button class="layout-btn${layoutMode === 'simple' ? ' active' : ''}" id="btn-simple" onclick="setLayout('simple')">Simple Grid</button>
          <button class="layout-btn${layoutMode === 'custom' ? ' active' : ''}" id="btn-custom" onclick="setLayout('custom')">Custom HTML</button>
        </div>

        <!-- Simple grid panel -->
        <div id="panel-simple" style="display:${layoutMode === 'simple' ? 'block' : 'none'};">
          <div class="grid-thumbs" id="grid-thumbs">
            ${gridThumbsHtml || '<p class="grid-empty">No images yet — upload some above.</p>'}
          </div>
          <p style="font-size:11px;color:var(--color-text-muted);">Uploaded images appear here in a 2-column grid. Use the upload button above.</p>
        </div>

        <!-- Custom HTML panel -->
        <div id="panel-custom" style="display:${layoutMode === 'custom' ? 'block' : 'none'};">
          <textarea class="html-zone" id="portfolio-html" oninput="updatePreview()" onkeydown="handleUndo(event)">${esc(profile?.portfolio_html ?? '')}</textarea>
        </div>
      </div>

      <div class="plan-section">
  <div class="plan-row">
    <span class="plan-label">Your Plan</span>
    <span class="plan-badge plan-${tierConfig.label.toLowerCase()}">${tierConfig.label}</span>
  </div>
  <p class="plan-meta">${tierConfig.photoLimit} photos · ${tierConfig.maxFileMb} MB uploads${tierConfig.ads ? ' · Ads on profile' : ' · No ads'}${tierConfig.proBadge ? ' · ⚡ Pro badge' : ''}</p>
  ${(profile?.subscription_level ?? 'basic') !== 'basic'
      ? `<button class="plan-manage-btn" onclick="manageSubscription()">Manage subscription ↗</button>`
      : `<a href="/pricing" class="plan-upgrade-btn">Upgrade plan →</a>`}
</div>

<div class="bottom-bar">
        <button class="undo-btn" onclick="undo()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
          Undo
        </button>
        <button class="save-btn" id="save-btn" onclick="saveProfile()">Save</button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- RIGHT: PREVIEW -->
    <div class="panel">
      <p class="panel-title">Preview</p>

      <div class="preview-header">
        <div class="preview-avatar" id="preview-avatar">
          <img id="preview-avatar-img" src="${profile?.avatar_url ?? ''}" style="display:${profile?.avatar_url ? 'block' : 'none'};">
          <svg id="preview-avatar-placeholder" viewBox="0 0 54 54" fill="none" style="width:55%;height:55%;display:${profile?.avatar_url ? 'none' : 'block'};">
            <circle cx="27" cy="20" r="10" fill="var(--color-primary)" opacity="0.8"/>
            <ellipse cx="27" cy="44" rx="16" ry="10" fill="var(--color-primary)" opacity="0.8"/>
          </svg>
        </div>
        <div>
          <p class="preview-name">${esc(user.name)}</p>
          <div class="preview-meta">
            <span id="preview-university-icon" style="width:18px;height:18px;flex-shrink:0;display:flex;align-items:center;">
  ${profile?.university && getUniversitySvg(profile.university)
      ? getUniversitySvg(profile.university).replace('<svg ', '<svg width="18" height="18" ')
      : `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-3.75-4-3.75z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`
    }
</span>
<span id="preview-university">${profile?.university ?? 'University not set'}</span>
          </div>
          <div class="preview-meta">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h6M5 11.5L8 13l3-1.5V3.5a1 1 0 00-1-1H6a1 1 0 00-1 1v8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span id="preview-price">$${profile?.price_min ?? '?'} – $${profile?.price_max ?? '?'}</span>
          </div>
          <span class="preview-badge ${profile?.commission_open ? '' : 'closed'}" id="preview-commission">
            ${profile?.commission_open ? 'Open for Commission' : 'Not Available'}
          </span>
        </div>
      </div>

      <hr class="preview-divider">
      <p class="preview-portfolio-label">Portfolio</p>
      <div class="preview-area">
        <iframe id="preview-frame" sandbox="allow-same-origin" srcdoc="${(profile?.portfolio_html ?? '').replace(/"/g, '&quot;')}" style="width:100%;min-height:300px;border:none;display:block;"></iframe>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // Show upgrade success toast
    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 2500);
    }

    if (new URLSearchParams(location.search).get('upgrade') === 'success') {
      showToast('🎉 Plan upgraded successfully!');
    }

    async function manageSubscription() {
      var res = await fetch('/stripe/portal', { method: 'POST' });
      var data = await res.json();
      if (res.ok && data.url) window.location.href = data.url;
      else if (res.ok && data.admin_granted) showToast('Your plan was granted by an admin — no billing to manage.');
      else showToast('Error: ' + (data.error || 'Could not open billing portal'));
    }
    var commissionOn = ${profile?.commission_open ? 'true' : 'false'};
    var undoStack = [];
    var avatarUrl = ${JSON.stringify(profile?.avatar_url ?? null)};
    var currentLayout = '${layoutMode}';
    var gridImages = ${JSON.stringify(gridImages)};

    // ── Shared university dropdown helpers ──
    function filterUnivOptions(optionsId, searchId) {
      var q = document.getElementById(searchId).value.toLowerCase();
      document.querySelectorAll('#' + optionsId + ' .univ-option').forEach(function(el) {
        var name = (el.dataset.name || '').toLowerCase();
        el.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
    }

    function toggleUnivDropdown(e) {
      e.stopPropagation();
      var sel = document.getElementById('univ-select');
      var wasOpen = sel.classList.contains('open');
      closeAllUnivDropdowns();
      if (!wasOpen) {
        sel.classList.add('open');
        document.getElementById('univ-search').value = '';
        filterUnivOptions('univ-options', 'univ-search');
        document.getElementById('univ-search').focus();
      }
    }

    function toggleAlsoServesDropdown(e) {
      e.stopPropagation();
      var sel = document.getElementById('also-serves-select');
      if (!sel) return;
      var wasOpen = sel.classList.contains('open');
      closeAllUnivDropdowns();
      if (!wasOpen) {
        sel.classList.add('open');
        document.getElementById('also-serves-search').value = '';
        filterUnivOptions('also-serves-options', 'also-serves-search');
        document.getElementById('also-serves-search').focus();
      }
    }

    function closeAllUnivDropdowns() {
      document.getElementById('univ-select').classList.remove('open');
      var as = document.getElementById('also-serves-select');
      if (as) as.classList.remove('open');
    }

    document.addEventListener('click', closeAllUnivDropdowns);

    // Home university selection
    document.querySelectorAll('#univ-options .univ-option').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = this.dataset.name;
        var iconHtml = this.querySelector('.univ-opt-icon').innerHTML;
        document.getElementById('university').value = name;
        document.getElementById('univ-trigger-icon').innerHTML = iconHtml;
        var lbl = document.getElementById('univ-trigger-label');
        lbl.textContent = name || 'None';
        lbl.classList.toggle('placeholder', !name);
        document.querySelectorAll('#univ-options .univ-option').forEach(function(o) {
          o.classList.toggle('selected', o.dataset.name === name);
        });
        document.getElementById('univ-select').classList.remove('open');
        document.getElementById('preview-university').textContent = name || 'University not set';
        document.getElementById('preview-university-icon').innerHTML =
          name ? iconHtml.replace('<svg ', '<svg width="18" height="18" ') : '';
        updatePreview();
      });
    });

    // Also serves
    var alsoServes = ${JSON.stringify(alsoServesInit)};
    var alsoServesLimit = ${alsoServesLimit};

    function renderAlsoServesTags() {
      var container = document.getElementById('also-serves-tags');
      if (!container) return;
      container.innerHTML = alsoServes.map(function(name) {
        var opt = document.querySelector('#also-serves-options .univ-option[data-name="' + name.replace(/"/g, '&quot;') + '"]');
        var iconHtml = opt ? opt.querySelector('.univ-opt-icon').innerHTML : '';
        return '<span class="also-tag" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:4px 10px;border:1.5px solid var(--color-border);border-radius:var(--radius-full);background:white;">' +
          iconHtml.replace('<svg ', '<svg width="14" height="14" ') +
          name +
          '<button class="also-tag-remove" data-name="' + name.replace(/"/g, '&quot;') + '" style="background:none;border:none;cursor:pointer;padding:0;font-size:14px;line-height:1;color:var(--color-text-muted);">\xd7</button>' +
          '</span>';
      }).join('');
      var lbl = document.getElementById('also-serves-count-label');
      if (lbl) lbl.textContent = '(' + alsoServes.length + '/' + alsoServesLimit + ' additional)';
    }
    document.getElementById('also-serves-tags').addEventListener('click', function(e) {
      var btn = e.target.closest('.also-tag-remove');
      if (!btn) return;
      e.stopPropagation();
      removeAlsoServes(btn.dataset.name);
    });

    function removeAlsoServes(name) {
      alsoServes = alsoServes.filter(function(u) { return u !== name; });
      renderAlsoServesTags();
      updateAlsoServesOptions();
    }

    function updateAlsoServesOptions() {
      var homeUniv = document.getElementById('university').value;
      document.querySelectorAll('#also-serves-options .univ-option').forEach(function(el) {
        var name = el.dataset.name;
        var taken = alsoServes.includes(name) || name === homeUniv || !name;
        el.style.opacity = taken ? '0.35' : '';
        el.style.pointerEvents = taken ? 'none' : '';
      });
    }

    document.querySelectorAll('#also-serves-options .univ-option').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = this.dataset.name;
        if (!name || alsoServes.includes(name)) return;
        if (alsoServes.length >= alsoServesLimit) {
          showToast('Limit reached: ' + alsoServesLimit + ' additional universities on your plan');
          return;
        }
        alsoServes.push(name);
        renderAlsoServesTags();
        updateAlsoServesOptions();
        document.getElementById('also-serves-select').classList.remove('open');
      });
    });

    updateAlsoServesOptions();

    function setLayout(mode) {
      currentLayout = mode;
      document.getElementById('btn-simple').classList.toggle('active', mode === 'simple');
      document.getElementById('btn-custom').classList.toggle('active', mode === 'custom');
      document.getElementById('panel-simple').style.display = mode === 'simple' ? 'block' : 'none';
      document.getElementById('panel-custom').style.display = mode === 'custom' ? 'block' : 'none';
      updatePreview();
    }

    function buildGridHtml(images) {
      if (!images.length) return '<p style="font-family:sans-serif;color:#aaa;padding:40px;text-align:center;">No images yet.</p>';
      var imgs = images.map(function(url) {
        return '<img src="' + url + '" style="width:100%;display:block;margin-bottom:2px;">';
      }).join('');
      return '<div style="column-count:2;column-gap:2px;background:#2e2e2e;padding:0;margin:0;">' + imgs + '</div>';
    }

    function renderGridThumbs() {
  var container = document.getElementById('grid-thumbs');
  if (!gridImages.length) {
    container.innerHTML = '<p class="grid-empty">No images yet \u2014 upload some above.</p>';
    return;
  }
  container.innerHTML = gridImages.map(function(url, i) {
    return '<div class="grid-thumb" id="thumb-' + i + '">' +
      '<img src="' + url + '" alt="">' +
      '<button class="thumb-remove" onclick="removeGridImage(' + i + ')">&times;</button>' +
      (i > 0 ? '<button class="thumb-move left" onclick="moveGridImage(' + i + ',-1)">&#8592;</button>' : '') +
      (i < gridImages.length - 1 ? '<button class="thumb-move right" onclick="moveGridImage(' + i + ',1)">&#8594;</button>' : '') +
      '</div>';
  }).join('');
}

function moveGridImage(index, dir) {
  var target = index + dir;
  if (target < 0 || target >= gridImages.length) return;
  var tmp = gridImages[index];
  gridImages[index] = gridImages[target];
  gridImages[target] = tmp;
  renderGridThumbs();
  updatePreview();
}

    function removeGridImage(index) {
      gridImages.splice(index, 1);
      renderGridThumbs();
      updatePreview();
    }

    function toggleCommission() {
      commissionOn = !commissionOn;
      document.getElementById('commission-toggle').classList.toggle('on', commissionOn);
      document.getElementById('commission-label').textContent = commissionOn ? 'Open for Commission' : 'Not Available';
      var badge = document.getElementById('preview-commission');
      badge.textContent = commissionOn ? 'Open for Commission' : 'Not Available';
      badge.classList.toggle('closed', !commissionOn);
    }

    function updatePreview() {
      var html = currentLayout === 'simple'
        ? buildGridHtml(gridImages)
        : document.getElementById('portfolio-html').value;
      document.getElementById('preview-frame').srcdoc = html;
      document.getElementById('preview-university').textContent =
        document.getElementById('university').value || 'University not set';
      var min = document.getElementById('price-min').value;
      var max = document.getElementById('price-max').value;
      document.getElementById('preview-price').textContent = '$' + (min || '?') + ' \u2013 $' + (max || '?');
    }

    document.getElementById('price-min').addEventListener('input', updatePreview);
    document.getElementById('price-max').addEventListener('input', updatePreview);
    loadUploadedPhotos();
    renderGridThumbs();
    document.getElementById('portfolio-html').addEventListener('input', function() {
      undoStack.push(this.value);
      if (undoStack.length > 50) undoStack.shift();
      updatePreview();
    });

    function handleUndo(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    }

    function undo() {
      if (undoStack.length > 0) {
        document.getElementById('portfolio-html').value = undoStack.pop();
        updatePreview();
      }
    }

    async function uploadAvatar(input) {
  var file = input.files[0];
  if (!file) return;

  var maxMb = ${tierConfig.maxFileMb};
  var maxBytes = maxMb * 1024 * 1024;

  if (file.size > maxBytes * 2.5) {
    showToast('Image too large to compress, please use a smaller file');
    return;
  }

  if (file.size > maxBytes) {
    showToast('Compressing image...');
    file = await compressImage(file, maxBytes);
  }

  var fd = new FormData();
  fd.append('image', file);
  var res = await fetch('/upload/avatar', { method: 'POST', body: fd });
  var data = await res.json();
  if (res.ok) {
    avatarUrl = data.url;
    var img = document.getElementById('avatar-preview');
    img.src = avatarUrl;
    img.style.display = 'block';
    document.getElementById('avatar-placeholder').style.display = 'none';
    var previewImg = document.getElementById('preview-avatar-img');
    previewImg.src = avatarUrl;
    previewImg.style.display = 'block';
    document.getElementById('preview-avatar-placeholder').style.display = 'none';
    showToast('Avatar uploaded!');
  } else {
    showToast('Upload failed: ' + data.error);
  }
}

function compressImage(file, targetBytes) {
  return new Promise(function(resolve) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function() {
      URL.revokeObjectURL(url);
      var canvas = document.createElement('canvas');
      var scale = Math.min(1, Math.sqrt(targetBytes / file.size));
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      // Iteratively reduce quality until under target
      var quality = 0.92;
      function tryExport() {
        canvas.toBlob(function(blob) {
          if (blob.size <= targetBytes || quality < 0.3) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            quality -= 0.1;
            tryExport();
          }
        }, 'image/jpeg', quality);
      }
      tryExport();
    };
    img.src = url;
  });
}

    async function uploadImage(input) {
  var file = input.files[0];
  if (!file) return;

  var maxMb = ${tierConfig.maxFileMb};
  var maxBytes = maxMb * 1024 * 1024;

  if (file.size > maxBytes * 2.5) {
    showToast('Image too large to compress, please use a smaller file');
    return;
  }

  if (file.size > maxBytes) {
    showToast('Compressing image...');
    file = await compressImage(file, maxBytes);
  }

  var fd = new FormData();
  fd.append('image', file);
  var res = await fetch('/upload', { method: 'POST', body: fd });
  var data = await res.json();
if (res.ok) {
        if (currentLayout === 'simple') {
          gridImages.push(data.url);
          renderGridThumbs();
          updatePreview();
          showToast('Image added to grid!');
        } else {
      var container = document.getElementById('uploaded-urls');
      var link = document.createElement('a');
      link.textContent = data.url;
      link.title = 'Click to copy';
      link.onclick = function() {
        navigator.clipboard.writeText('<img src="' + data.url + '" alt="">');
        showToast('Copied img tag to clipboard!');
      };
      container.prepend(link);
      showToast('Image uploaded! Click URL to copy img tag.');
    } loadUploadedPhotos();
      renderGridThumbs();
  } else {
    showToast('Upload failed: ' + data.error);
  }
}

    var uploadedImages = [];

    async function loadUploadedPhotos() {
      var res = await fetch('/images');
      var data = await res.json();
      uploadedImages = data.images || [];
      renderUploadGallery();
      updateUploadBtn();
    }

    function updateUploadBtn() {
      var btn = document.querySelector('.upload-btn');
      var limitMsg = document.getElementById('upload-limit-msg');
      if (uploadedImages.length >= ${tierConfig.photoLimit}) {
        btn.style.opacity = '0.4';
        btn.style.pointerEvents = 'none';
        btn.style.cursor = 'default';
        btn.style.borderColor = 'var(--color-border)';
        limitMsg.style.display = 'inline';
      } else {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        btn.style.cursor = '';
        btn.style.borderColor = '';
        limitMsg.style.display = 'none';
      }
    }

    function renderUploadGallery() {
      var wrap = document.getElementById('upload-gallery-wrap');
      if (!uploadedImages.length) {
        wrap.innerHTML = '<div style="font-size:12px;color:var(--color-text-muted);">No uploaded photos yet.</div>';
        return;
      }
      wrap.innerHTML = '<div class="upload-gallery-grid">' +
        uploadedImages.map(function(img, i) {
          return '<div class="upload-gallery-item">' +
            '<img src="' + img.url + '" loading="lazy">' +
            '<div class="upload-gallery-actions">' +
              '<button class="gal-btn" data-action="copy" data-index="' + i + '">Copy</button>' +
              '<button class="gal-btn del" data-action="delete" data-index="' + i + '">Del</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    document.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var idx = parseInt(btn.dataset.index);
      var img = uploadedImages[idx];
      if (!img) return;
      if (btn.dataset.action === 'copy') {
        navigator.clipboard.writeText('<img src="' + img.url + '" alt="">');
        showToast('Copied img tag to clipboard!');
      } else if (btn.dataset.action === 'delete') {
        if (!confirm('Delete this image? This cannot be undone and will remove it from R2.')) return;
        btn.disabled = true;
        var res = await fetch('/images/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: img.key })
        });
        if (!res.ok) { showToast('Delete failed'); btn.disabled = false; return; }
        var gridIdx = gridImages.indexOf(img.url);
        if (gridIdx !== -1) { gridImages.splice(gridIdx, 1); renderGridThumbs(); updatePreview(); }
        document.querySelectorAll('#uploaded-urls a').forEach(function(a) {
          if (a.textContent === img.url) a.remove();
        });
        uploadedImages.splice(idx, 1);
        renderUploadGallery();
        updateUploadBtn();
        showToast('Image deleted.');
      }
    });

    async function saveProfile() {
      var btn = document.getElementById('save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      var portfolioHtml = currentLayout === 'simple'
        ? buildGridHtml(gridImages)
        : document.getElementById('portfolio-html').value;

      var body = {
        slug:            document.getElementById('slug').value,
        bio:             document.getElementById('bio').value,
        university:      document.getElementById('university').value,
        price_min:       parseInt(document.getElementById('price-min').value) || null,
        price_max:       parseInt(document.getElementById('price-max').value) || null,
        commission_open: commissionOn ? 1 : 0,
        avatar_url:      avatarUrl || null,
        portfolio_html:  portfolioHtml,
        layout_mode:     currentLayout,
        grid_images:     JSON.stringify(gridImages),
        also_serves:     alsoServes,
      };

      var res = await fetch('/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      var data = await res.json();
      btn.disabled = false;
      btn.textContent = 'Save';
      showToast(res.ok ? 'Profile saved!' : 'Error: ' + (data.error || 'Save failed'));
    }
  </script>
${footer}
  </body>
</html>`;

  return c.html(html);
}