import { Context } from 'hono';
import { Env, Variables } from './types';
import { theme, favicon, topbarStyles, topbar } from './theme';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export function roleSelectPage(c: AppContext) {
  const pending = c.req.query('pending') ?? '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One more step — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page-content {
      max-width: 460px;
      margin: 5rem auto;
      padding: 0 1.5rem;
      text-align: center;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 30px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }
    .role-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 2rem;
    }
    .role-option {
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.5rem 1rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .role-option:hover { border-color: var(--color-primary); }
    .role-option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }
    .role-icon { font-size: 32px; margin-bottom: 8px; }
    .role-label { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
    .role-desc { font-size: 12px; color: var(--color-text-muted); }
    .submit-btn {
      padding: 12px 40px;
      background: var(--color-primary);
      color: white;
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 500;
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .submit-btn:hover { opacity: 0.8; }
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
    <h1 class="page-title">One more step</h1>
    <p class="page-subtitle">How will you be using UniLens?</p>

    <div id="error" class="error-msg" style="display:none;"></div>

    <div class="role-group">
      <div class="role-option selected" id="role-photographer" onclick="selectRole('photographer')">
        <div class="role-icon">📷</div>
        <div class="role-label">Photographer</div>
        <div class="role-desc">List my portfolio and get hired</div>
      </div>
      <div class="role-option" id="role-client" onclick="selectRole('client')">
        <div class="role-icon">🔍</div>
        <div class="role-label">Client</div>
        <div class="role-desc">Find and hire a photographer</div>
      </div>
    </div>

    <button class="submit-btn" onclick="handleSubmit()">Get started</button>
  </div>

  <script>
    let selectedRole = 'photographer';

    function selectRole(role) {
      selectedRole = role;
      document.getElementById('role-photographer').classList.toggle('selected', role === 'photographer');
      document.getElementById('role-client').classList.toggle('selected', role === 'client');
    }

    async function handleSubmit() {
      const errorEl = document.getElementById('error');
      errorEl.style.display = 'none';

      const res = await fetch('/auth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: '${pending}', role: selectedRole })
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/';
      } else {
        errorEl.textContent = data.error ?? 'Something went wrong';
        errorEl.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;
  return c.html(html);
}