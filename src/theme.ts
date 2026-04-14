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
`;

export const logoSvg = `<svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle fill="#000000" cx="24" cy="24" r="24"/>
  <path fill="#ffffff" d="m 5,1.5 h 38 c 0.554,0 1,0.446 1,1 v 43 c 0,0.554 -0.446,1 -1,1 H 5 c -0.554,0 -1,-0.446 -1,-1 v -43 c 0,-0.554 0.446,-1 1,-1 z"/>
  <rect fill="#000000" width="37.5" height="30" x="5.25" y="3" ry="1" rx="1"/>
  <rect fill="#c8c8c8" width="37.5" height="11.5" x="5.25" y="-45.5" ry="1.15" transform="scale(1,-1)" rx="1"/>
  <text font-weight="bold" font-size="11.8" font-family="sans-serif" fill="#000000" x="7.04" y="43.4" transform="scale(0.984,1.017)">LENS</text>
  <text font-weight="bold" font-size="18.5" font-family="sans-serif" fill="#ffffff" x="9.38" y="23.04" transform="scale(0.916,1.091)">UNI</text>
</svg>`;

export function topbar(active: 'home' | 'photographers' | 'about' | 'login' | '') {
  return `
  <nav class="topbar">
    <a href="/" class="logo">
      ${logoSvg}
      <span class="logo-title">UniLens</span>
    </a>
    <div class="nav-links">
      <a href="/" ${active === 'home' ? 'style="color:var(--color-accent);"' : ''}>Home</a>
      <a href="/photographers" ${active === 'photographers' ? 'style="color:var(--color-accent);"' : ''}>Photographers</a>
      <a href="/about" ${active === 'about' ? 'style="color:var(--color-accent);"' : ''}>About</a>
      <a href="/login" ${active === 'login' ? 'style="color:var(--color-accent);"' : ''}>Log in</a>
      <a href="/register" class="btn">Sign up</a>
    </div>
  </nav>`;
}

export const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'><circle fill='%23000000' cx='24' cy='24' r='24'/><path fill='%23ffffff' d='m 5,1.5 h 38 c .554,0 1,.446 1,1 v 43 c 0,.554-.446,1-1,1 H 5 c-.554,0-1-.446-1-1 v-43 c 0-.554.446-1 1-1 z'/><rect fill='%23000000' width='37.5' height='30' x='5.25' y='3' rx='1'/><rect fill='%23c8c8c8' width='37.5' height='11.5' x='5.25' y='-45.5' transform='scale(1,-1)' rx='1'/><text font-weight='bold' font-size='11.8' font-family='sans-serif' fill='%23000000' x='7' y='43' transform='scale(.984,1.017)'>LENS</text><text font-weight='bold' font-size='18.5' font-family='sans-serif' fill='%23ffffff' x='9' y='23' transform='scale(.916,1.091)'>UNI</text></svg>">`;