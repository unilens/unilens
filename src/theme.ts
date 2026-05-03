export const theme = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:       #111111;
    --color-accent:        #cc0000;
    --color-primary-light: color-mix(in srgb, var(--color-primary) 15%, white);
    --color-primary-dark:  color-mix(in srgb, var(--color-primary) 85%, black);
    --color-accent-light:  color-mix(in srgb, var(--color-accent) 15%, white);
    --color-accent-dark:   color-mix(in srgb, var(--color-accent) 85%, black);
    --color-bg:            #ffffff;
    --color-text:          var(--color-primary);
    --color-text-muted:    color-mix(in srgb, var(--color-primary) 50%, white);
    --color-border:        color-mix(in srgb, var(--color-primary) 20%, white);
    --color-hover:         var(--color-primary-light);
    --color-badge-bg:      var(--color-accent-light);
    --color-badge-text:    var(--color-accent-dark);
    --color-star:          #e2a800;
    --color-star-empty:    #ddd;
    --font-serif:          'Playfair Display', serif;
    --font-sans:           'DM Sans', sans-serif;
    --radius-sm:           6px;
    --radius-md:           12px;
    --radius-lg:           20px;
    --radius-full:         9999px;
  }

  body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
  }

  a { color: inherit; text-decoration: none; }
`;
export const topbarStyles = `
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    border-bottom: 1.5px solid var(--color-border);
    margin-bottom: 2rem;
  }
    .topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
  }
  .logo-title {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 400;
  }
  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    font-size: 14px;
  }
  .nav-links a { color: var(--color-text); text-decoration: none; }
  .nav-links a:hover { color: var(--color-accent); }
  .btn {
    background: var(--color-accent);
    color: white;
    padding: 8px 18px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
    text-decoration: none;
  }
  .btn:hover { opacity: 0.85; }
  .hamburger { display: none; }
@media (max-width: 640px) {
  .topbar { padding: 0.75rem 1rem; position: relative; }
  .logo-title { font-size: 18px; }
  .nav-links { display: none; flex-direction: column; gap: 0; position: absolute; top: 100%; left: 0; right: 0; background: var(--color-bg); border-bottom: 1.5px solid var(--color-border); z-index: 100; padding: 0.5rem 0; }
  .nav-links.open { display: flex; }
  .nav-links a, .nav-links .btn { padding: 10px 1.5rem; font-size: 14px; width: 100%; box-sizing: border-box; border-radius: 0; }
  .nav-links .btn { background: none; color: var(--color-accent); border: none; text-align: left; }
  .hamburger { display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
  .hamburger span { display: block; width: 20px; height: 1.5px; background: var(--color-text); }
}
`;

export const logoSvg = `<svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle fill="#000000" cx="24" cy="24" r="24"/>
  <path fill="#ffffff" d="m 5,1.5 h 38 c 0.554,0 1,0.446 1,1 v 43 c 0,0.554 -0.446,1 -1,1 H 5 c -0.554,0 -1,-0.446 -1,-1 v -43 c 0,-0.554 0.446,-1 1,-1 z"/>
  <rect fill="#000000" width="37.5" height="30" x="5.25" y="3" ry="1" rx="1"/>
  <rect fill="#c8c8c8" width="37.5" height="11.5" x="5.25" y="-45.5" ry="1.15" transform="scale(1,-1)" rx="1"/>
  <text font-weight="bold" font-size="11.84" font-family="Arial,sans-serif" fill="#000000" x="8.455" y="43.397" transform="scale(0.9835,1.0168)">LENS</text>
  <text font-weight="bold" font-size="21.87" font-family="Arial,sans-serif" fill="#ffffff" x="7.282" y="25.275" transform="scale(0.9164,1.0912)">UNI</text>
</svg>`;

export function topbar(
  active: 'home' | 'inquiries' | 'about' | 'login' | 'dashboard' | '',
  userRole?: string | unknown
) {
  const isLoggedIn = userRole !== '' && userRole !== ' ' && userRole !== undefined && userRole !== null;
  return `
  <nav class="topbar">
    <a href="/" class="logo">
      ${logoSvg}
      <span class="logo-title">UniLens (α)</span>
    </a>
    <div class="topbar-right">
      ${isLoggedIn ? `
      <div class="notif-wrap" id="notif-wrap">
        <button class="notif-btn" id="notif-btn" onclick="toggleNotifDropdown(event)" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="notif-badge" id="notif-badge" style="display:none;">0</span>
        </button>
        <div class="notif-dropdown" id="notif-dropdown">
          <div class="notif-header">Notifications</div>
          <div id="notif-list"><div class="notif-loading">Loading\u2026</div></div>
        </div>
      </div>` : ''}
      <button class="hamburger" id="hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/" ${active === 'home' ? 'style="color:var(--color-accent);"' : ''}>Home</a>
        <a href="/inquiries" ${active === 'inquiries' ? 'style="color:var(--color-accent);"' : ''}>Inquiries</a>
        <a href="/about" ${active === 'about' ? 'style="color:var(--color-accent);"' : ''}>About</a>
        ${isLoggedIn ? `<a href="/dashboard" ${active === 'dashboard' ? 'style="color:var(--color-accent);"' : ''}>Dashboard</a>` : ''}
        ${isLoggedIn ? '<a href="/auth/logout">Log out</a>' : `<a href="/login" ${active === 'login' ? 'style="color:var(--color-accent);"' : ''}>Log in</a>`}
        ${!isLoggedIn ? '<a href="/register" class="btn">Sign up</a>' : ''}
      </div>
    </div>
    ${isLoggedIn ? `
    <style>
      .notif-wrap { position: relative; display: flex; align-items: center; }
      .notif-btn {
        position: relative;
        background: none; border: none; cursor: pointer;
        padding: 6px; border-radius: var(--radius-sm);
        color: var(--color-text);
        display: flex; align-items: center;
        transition: background 0.15s;
      }
      .notif-btn:hover { background: var(--color-hover); }
      .notif-badge {
        position: absolute; top: 1px; right: 1px;
        min-width: 16px; height: 16px;
        background: var(--color-accent); color: white;
        font-size: 10px; font-weight: 600;
        border-radius: var(--radius-full);
        display: flex; align-items: center; justify-content: center;
        padding: 0 3px; pointer-events: none;
      }
      .notif-dropdown {
        display: none;
        position: absolute; top: calc(100% + 10px); right: 0;
        width: 300px;
        background: white;
        border: 1.5px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        z-index: 200;
        overflow: hidden;
      }
      .notif-wrap.open .notif-dropdown { display: block; }
      .notif-header {
        padding: 12px 16px;
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.07em; text-transform: uppercase;
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
      }
      .notif-loading { padding: 20px 16px; font-size: 13px; color: var(--color-text-muted); }
      .notif-empty { padding: 20px 16px; font-size: 13px; color: var(--color-text-muted); }
      .notif-item {
        display: block; padding: 12px 16px;
        font-size: 13px; line-height: 1.4;
        border-bottom: 1px solid var(--color-border);
        color: var(--color-text); text-decoration: none;
        transition: background 0.1s;
      }
      .notif-item:last-child { border-bottom: none; }
      .notif-item:hover { background: var(--color-hover); }
      .notif-item.unread { background: var(--color-primary-light); font-weight: 500; }
      .notif-item.unread:hover { background: color-mix(in srgb, var(--color-primary) 20%, white); }
      .notif-time { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; font-weight: 400; }
    </style>
    <script>
      (function() {
        var loaded = false;
        var lastSeen = 0;

        function timeAgo(ts) {
          var diff = Math.floor(Date.now() / 1000) - ts;
          if (diff < 60) return 'just now';
          if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
          if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
          return Math.floor(diff / 86400) + 'd ago';
        }

        async function loadNotifications() {
          var res = await fetch('/notifications');
          var data = await res.json();
          var badge = document.getElementById('notif-badge');
          if (data.unread > 0) {
            badge.textContent = data.unread > 99 ? '99+' : data.unread;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
          var list = document.getElementById('notif-list');
          if (!data.items || data.items.length === 0) {
            list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
            return;
          }
          list.innerHTML = data.items.map(function(item) {
            var isUnread = item.time > lastSeen;
            return '<a class="notif-item' + (isUnread ? ' unread' : '') + '" href="' + item.href + '">' +
              item.text +
              '<div class="notif-time">' + timeAgo(item.time) + '</div>' +
              '</a>';
          }).join('');
          lastSeen = data.items[0] ? data.items[0].time : 0;
        }

        window.toggleNotifDropdown = function(e) {
          e.stopPropagation();
          var wrap = document.getElementById('notif-wrap');
          var isOpen = wrap.classList.contains('open');
          wrap.classList.toggle('open');
          if (!isOpen) {
            if (!loaded) { loadNotifications(); loaded = true; }
            fetch('/notifications/seen', { method: 'POST' });
            document.getElementById('notif-badge').style.display = 'none';
          }
        };

        document.addEventListener('click', function() {
          document.getElementById('notif-wrap').classList.remove('open');
        });
        document.getElementById('notif-dropdown').addEventListener('click', function(e) {
          e.stopPropagation();
        });

        loadNotifications();
      })();
    <\/script>` : ''}
    <script>
      (function() {
        var hamburger = document.getElementById('hamburger');
        var navLinks = document.getElementById('nav-links');
        if (!hamburger || !navLinks) return;
        hamburger.addEventListener('click', function(e) {
          e.stopPropagation();
          navLinks.classList.toggle('open');
        });
        document.addEventListener('click', function() {
          navLinks.classList.remove('open');
        });
        navLinks.querySelectorAll('a').forEach(function(a) {
          a.addEventListener('click', function() {
            navLinks.classList.remove('open');
          });
        });
      })();
    <\/script>
  </nav>`;
}

export const adsenseScript = (clientId: string) =>
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}" crossorigin="anonymous"></script>`;

export function ogTags({ title, description, image }: {
  title: string; description: string; image?: string;
}) {
  const img = image ?? 'https://unilens.net/favicon.svg';
  return `
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="UniLens">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${img}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${img}">`;
}

export const favicon = `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`;