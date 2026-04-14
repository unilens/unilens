import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar } from './theme';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export function loginPage(c: AppContext) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log in — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page-content {
      max-width: 420px;
      margin: 4rem auto;
      padding: 0 1.5rem;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 10px 14px;
      font-family: var(--font-sans);
      font-size: 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.15s;
      color: var(--color-text);
    }
    input:focus { border-color: var(--color-primary); }
    .submit-btn {
      width: 100%;
      padding: 11px;
      background: var(--color-primary);
      color: white;
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 500;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: opacity 0.15s;
      margin-top: 0.5rem;
    }
    .submit-btn:hover { opacity: 0.8; }
    .alt-link {
      text-align: center;
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 1.25rem;
    }
    .alt-link a { color: var(--color-accent); text-decoration: none; }
    .error-msg {
      background: #fdecea;
      color: #a32d2d;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
    }
  </style>
</head>
<body>
  ${topbar('login')}
  <div class="page-content">
    <h1 class="page-title">Welcome back</h1>
    <p class="page-subtitle">Log in to your UniLens account</p>

    <div id="error" class="error-msg" style="display:none;"></div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="you@university.edu">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" placeholder="••••••••">
    </div>
    <button class="submit-btn" onclick="handleLogin()">Log in</button>
    <p class="alt-link">Don't have an account? <a href="/register">Sign up</a></p>
  </div>

  <script>
    async function handleLogin() {
      const email    = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorEl  = document.getElementById('error');

      errorEl.style.display = 'none';

      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/';
      } else {
        errorEl.textContent = data.error ?? 'Login failed';
        errorEl.style.display = 'block';
      }
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  </script>
</body>
</html>`;
  return c.html(html);
}

export function registerPage(c: AppContext) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign up — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page-content {
      max-width: 420px;
      margin: 4rem auto;
      padding: 0 1.5rem;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 28px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    input, select {
      width: 100%;
      padding: 10px 14px;
      font-family: var(--font-sans);
      font-size: 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.15s;
      color: var(--color-text);
      background: white;
    }
    input:focus, select:focus { border-color: var(--color-primary); }
    .role-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .role-option {
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s, background 0.15s;
    }
    .role-option:hover { border-color: var(--color-primary); }
    .role-option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }
    .role-option .role-icon { font-size: 22px; margin-bottom: 4px; }
    .role-option .role-label { font-size: 13px; font-weight: 500; }
    .role-option .role-desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
    .submit-btn {
      width: 100%;
      padding: 11px;
      background: var(--color-primary);
      color: white;
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 500;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: opacity 0.15s;
      margin-top: 0.5rem;
    }
    .submit-btn:hover { opacity: 0.8; }
    .alt-link {
      text-align: center;
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 1.25rem;
    }
    .alt-link a { color: var(--color-accent); text-decoration: none; }
    .error-msg {
      background: #fdecea;
      color: #a32d2d;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
    }
  </style>
</head>
<body>
  ${topbar('')}
  <div class="page-content">
    <h1 class="page-title">Create an account</h1>
    <p class="page-subtitle">Join UniLens as a photographer or client</p>

    <div id="error" class="error-msg" style="display:none;"></div>

    <div class="form-group">
      <label for="name">Full name</label>
      <input type="text" id="name" placeholder="Jane Smith">
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="you@university.edu">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" placeholder="••••••••">
    </div>
    <div class="form-group">
      <label>I am a...</label>
      <div class="role-group">
        <div class="role-option selected" id="role-photographer" onclick="selectRole('photographer')">
          <div class="role-icon">📷</div>
          <div class="role-label">Photographer</div>
          <div class="role-desc">List my portfolio</div>
        </div>
        <div class="role-option" id="role-client" onclick="selectRole('client')">
          <div class="role-icon">🔍</div>
          <div class="role-label">Client</div>
          <div class="role-desc">Find a photographer</div>
        </div>
      </div>
    </div>

    <button class="submit-btn" onclick="handleRegister()">Create account</button>
    <p class="alt-link">Already have an account? <a href="/login">Log in</a></p>
  </div>

  <script>
    let selectedRole = 'photographer';

    function selectRole(role) {
      selectedRole = role;
      document.getElementById('role-photographer').classList.toggle('selected', role === 'photographer');
      document.getElementById('role-client').classList.toggle('selected', role === 'client');
    }

    async function handleRegister() {
      const name     = document.getElementById('name').value;
      const email    = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorEl  = document.getElementById('error');

      errorEl.style.display = 'none';

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: selectedRole })
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/login';
      } else {
        errorEl.textContent = data.error ?? 'Registration failed';
        errorEl.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;
  return c.html(html);
}