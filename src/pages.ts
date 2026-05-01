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
  <title>Log in - UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page-content {
      max-width: 420px;
      margin: 6rem auto;
      padding: 0 1.5rem;
      text-align: center;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 32px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }
    .google-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 28px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-full);
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 500;
      color: var(--color-text);
      background: white;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .google-btn:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .alt-link {
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 1.5rem;
    }
    .alt-link a { color: var(--color-accent); text-decoration: none; }
  </style>
</head>
<body>
  ${topbar('login', '')}
  <div class="page-content">
    <h1 class="page-title">Welcome back</h1>
    <p class="page-subtitle">Sign in to your UniLens account</p>
    <a href="/auth/login" class="google-btn">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </a>
    <p class="alt-link">Don't have an account? <a href="/register">Sign up</a></p>
  </div>
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
  <title>Sign up - UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page-content {
      max-width: 420px;
      margin: 6rem auto;
      padding: 0 1.5rem;
      text-align: center;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 32px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }
    .google-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 28px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-full);
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 500;
      color: var(--color-text);
      background: white;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .google-btn:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .alt-link {
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 1.5rem;
    }
    .alt-link a { color: var(--color-accent); text-decoration: none; }
  </style>
</head>
<body>
  ${topbar('login', '')}
  <div class="page-content">
    <h1 class="page-title">Join UniLens</h1>
    <p class="page-subtitle">Connect with photographers at your college</p>
    <a href="/auth/login" class="google-btn">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </a>
    <p class="alt-link">Already have an account? <a href="/login">Log in</a></p>
  </div>
</body>
</html>`;
  return c.html(html);
}

export function aboutPage(c: AppContext) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page {
      max-width: 680px;
      margin: 0 auto;
      padding: 3rem 1.5rem 6rem;
    }
    .page-title {
      font-family: var(--font-serif);
      font-size: 40px;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .lead {
      font-size: 17px;
      color: var(--color-text-muted);
      line-height: 1.7;
      margin-bottom: 3rem;
    }
    .section {
      margin-bottom: 2.5rem;
    }
    .section h2 {
      font-family: var(--font-serif);
      font-size: 22px;
      font-weight: 400;
      margin-bottom: 0.75rem;
    }
    .section p {
      font-size: 15px;
      line-height: 1.8;
      color: var(--color-text-muted);
    }
    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 1rem;
    }
    .step {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-text { font-size: 15px; line-height: 1.7; color: var(--color-text-muted); }
    .step-text strong { color: var(--color-text); }
    hr { border: none; border-top: 1px solid var(--color-border); margin: 2.5rem 0; }
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      transition: opacity 0.15s;
      margin-top: 1rem;
    }
    .cta:hover { opacity: 0.8; }
  </style>
</head>
<body>
  ${topbar('about', '')}
  <div class="page">
    <h1 class="page-title">About UniLens (α)</h1>
    <p class="lead">Unilens is currently in the pre-α stage. Please note that this is a prototype and not all features may be fully functional. We're actively developing the platform and appreciate your understanding as we work towards a full launch. If you're interested in testing or providing feedback, please don't hesitate to reach out!</p>
    <p class="lead">UniLens connects college students with talented photographers on their campus. We make it easy to find someone who knows your school, your style, and your budget.</p>

    <div class="section">
      <h2>Why UniLens?</h2>
      <p>Finding a good photographer as a student is harder than it should be. Generic platforms are expensive and impersonal. Instagram DMs get lost. UniLens is built specifically for the college market so that photographers can list their portfolio and pricing, clients can browse and reach out, and trust is built through real peer reviews.</p>
    </div>

    <hr>

    <div class="section">
      <h2>How it works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text"><strong>Browse photographers</strong> - filter by university, price, and availability.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text"><strong>Send an inquiry</strong> - introduce yourself and describe your shoot.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text"><strong>Get accepted</strong> - the photographer reviews your request and accepts or declines.</div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-text"><strong>Leave a rating</strong> - after your shoot, rate your experience to help the community.</div>
        </div>
      </div>
    </div>

    <hr>

    <div class="section">
      <h2>For photographers</h2>
      <p>Set up your profile in minutes. Upload your portfolio, set your price range, and toggle your availability. You control who you work with - accept inquiries that fit your schedule and decline the rest.</p>
    </div>

    <div class="section">
      <h2>For clients</h2>
      <p>Every photographer on UniLens is a fellow student. Browse real portfolios, see honest peer reviews, and reach out directly. No middlemen, no booking fees.</p>
    </div>

    <hr>

    <div class="section">
      <h2>Get started</h2>
      <p>Sign up with your Google account and pick your role. It takes under a minute.</p>
      <a href="/register" class="cta">Join UniLens</a>
    </div>
  </div>
</body>
</html>`;
  return c.html(html);
}