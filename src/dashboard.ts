import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar } from './theme';
import { universities, getUniversitySvg } from './universities';

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
    avatar_url: string; university: string;
    layout_mode: string; grid_images: string;
  }>();

  // Resolve the currently-selected university for server-side render
  const currentUniv  = universities.find(u => u.name === profile?.university);
  const currentIcon  = currentUniv?.svg ?? '';
  const currentLabel = profile?.university ?? 'Select university...';
  const layoutMode = profile?.layout_mode ?? 'simple';
  const gridImages: string[] = JSON.parse(profile?.grid_images ?? '[]');
  const gridThumbsHtml = gridImages.map((url, i) => `
    <div class="grid-thumb" id="thumb-${i}">
      <img src="${url}" alt="">
      <button class="thumb-remove" onclick="removeGridImage('${url}')">&times;</button>
    </div>`).join('');

  // Build the dropdown option list
  const univOptions = universities.map(u => {
    const selected = profile?.university === u.name ? ' selected' : '';
    // Escape the name for use in a data-attribute
    const safeName = u.name.replace(/"/g, '&quot;');
    return `
      <div class="univ-option${selected}" data-name="${safeName}">
        <span class="univ-opt-icon">${u.svg}</span>
        <span>${u.name}</span>
      </div>`;
  }).join('');

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

    .dashboard {
      display: grid;
      grid-template-columns: 1fr 1px 1fr;
      min-height: calc(100vh - 65px);
    }

    .divider { background: var(--color-border); }

    .panel { padding: 2rem; overflow-y: auto; }

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
    .grid-empty {
      font-size: 12px;
      color: var(--color-text-muted);
      padding: 12px 0;
    }
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
            <input type="text" id="slug" placeholder="e.g. jane-smith" value="${profile?.slug ?? ''}">
          </div>
        </div>
        <input type="file" id="avatar-input" accept="image/*" style="display:none;" onchange="uploadAvatar(this)">
      </div>

      <div class="fields-grid">
        <div class="form-group">
          <label>University</label>
          <!-- Custom university dropdown -->
          <div class="univ-select" id="univ-select">
            <div class="univ-trigger" id="univ-trigger" onclick="toggleUnivDropdown(event)">
              <span class="univ-trigger-icon" id="univ-trigger-icon">${currentIcon}</span>
              <span class="univ-trigger-label${currentIcon ? '' : ' placeholder'}" id="univ-trigger-label">${currentLabel}</span>
              <svg class="univ-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="univ-options" id="univ-options">
              ${univOptions}
            </div>
          </div>
          <!-- Hidden input keeps the same id so saveProfile() is unchanged -->
          <input type="hidden" id="university" value="${profile?.university ?? ''}">
        </div>
        <div class="form-group">
          <label>Bio</label>
          <input type="text" id="bio" placeholder="Short bio..." value="${profile?.bio ?? ''}">
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
        <div class="uploaded-urls" id="uploaded-urls"></div>
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
          <textarea class="html-zone" id="portfolio-html" oninput="updatePreview()" onkeydown="handleUndo(event)">${profile?.portfolio_html ?? ''}</textarea>
        </div>
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
          <p class="preview-name">${user.name as string}</p>
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
    var commissionOn = ${profile?.commission_open ? 'true' : 'false'};
    var undoStack = [];
    var avatarUrl = '${profile?.avatar_url ?? ''}';
    var currentLayout = '${layoutMode}';
    var gridImages = ${JSON.stringify(gridImages)};

    function toggleUnivDropdown(e) {
      e.stopPropagation();
      document.getElementById('univ-select').classList.toggle('open');
    }

    function selectUniversity(name, iconHtml) {
      document.getElementById('university').value = name;
      document.getElementById('univ-trigger-icon').innerHTML = iconHtml;
      var lbl = document.getElementById('univ-trigger-label');
      lbl.textContent = name;
      lbl.classList.remove('placeholder');
      document.querySelectorAll('.univ-option').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.name === name);
      });
      document.getElementById('univ-select').classList.remove('open');
      updatePreview();
      document.getElementById('preview-university-icon').innerHTML =
        iconHtml.replace('<svg ', '<svg width="18" height="18" ');
    }

    document.querySelectorAll('.univ-option').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        selectUniversity(this.dataset.name, this.querySelector('.univ-opt-icon').innerHTML);
      });
    });

    document.addEventListener('click', function() {
      document.getElementById('univ-select').classList.remove('open');
    });

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
        return '<img src="' + url + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;">';
      }).join('');
      return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;">' + imgs + '</div>';
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
          '</div>';
      }).join('');
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

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 2500);
    }

    async function uploadAvatar(input) {
      var file = input.files[0];
      if (!file) return;
      var fd = new FormData();
      fd.append('image', file);
      var res = await fetch('/upload', { method: 'POST', body: fd });
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

    async function uploadImage(input) {
      var file = input.files[0];
      if (!file) return;
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
        }
      } else {
        showToast('Upload failed: ' + data.error);
      }
    }

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
</body>
</html>`;

  return c.html(html);
}