import { Hono } from 'hono';
import { Env, Variables } from './types';
import { googleLogin, googleCallback, completeRegistration, requireAuth, softAuth } from './auth';
import { savePortfolio, getProfile, getPhotographers } from './portfolio';
import { ratePhotographer } from './ratings';
import { homePage } from './home';
import { loginPage, registerPage, aboutPage, privacyPage, termsPage } from './pages';
import { roleSelectPage } from './role';
import { dashboardPage } from './dashboard';
import { sendContactRequest, acceptContactRequest, declineContactRequest } from './contact';
import { clientDashboardPage } from './client-dashboard';
import { inquiriesPage } from './inquiries';
import { sanitizePortfolio } from './sanitize';
import { toggleSave } from './save';
import { getNotifications, markNotificationsSeen } from './notifications';
import { listImages, deleteImage } from './images';
import { uploadImage, uploadAvatar } from './upload';
import { csrfMiddleware } from './csrf';
import { createCheckoutSession, stripeWebhook, createPortalSession } from './stripe';
import { pricingPage } from './pricing';
import { adminPage, adminLogin, adminSetTier, adminLogout } from './admin';
import { theme, favicon, topbarStyles, topbar, logoSvg } from './theme';
import { sitemapXml } from './sitemap';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use('*', csrfMiddleware);

// Public routes
app.get('/auth/login',    googleLogin);
app.get('/auth/callback', googleCallback);
app.post('/auth/complete', completeRegistration);
app.get('/dashboard', requireAuth, dashboardPage);
app.get('/dashboard/client', requireAuth, clientDashboardPage);
app.get('/inquiries', requireAuth, inquiriesPage);
app.get('/', softAuth, homePage);
app.post('/save/:id', requireAuth, toggleSave);
app.get('/about', aboutPage);
app.get('/privacy', privacyPage);
app.get('/terms', termsPage);
app.get('/p/:slug', softAuth, getProfile);
app.get('/photographers', getPhotographers);
app.get('/login',    loginPage);
app.get('/register', registerPage);
app.get('/register/role', roleSelectPage);
app.post('/portfolio',  requireAuth, savePortfolio);
app.post('/upload', requireAuth, uploadImage);
app.post('/rate/:id', requireAuth, ratePhotographer);
app.post('/contact/:id', requireAuth, sendContactRequest);
app.post('/contact/:id/accept', requireAuth, acceptContactRequest);
app.post('/contact/:id/decline', requireAuth, declineContactRequest);
app.get('/notifications', requireAuth, getNotifications);
app.post('/notifications/seen', requireAuth, markNotificationsSeen);
app.get('/images', requireAuth, listImages);
app.post('/images/delete', requireAuth, deleteImage);
app.post('/upload/avatar', requireAuth, uploadAvatar);
app.get('/pricing', softAuth, pricingPage);
app.post('/stripe/checkout', requireAuth, createCheckoutSession);
app.post('/stripe/webhook', stripeWebhook);   // no auth — verified by Stripe signature
app.post('/stripe/portal',  requireAuth, createPortalSession);
app.get('/admin',           adminPage);
app.post('/admin/login',    adminLogin);
app.post('/admin/set-tier', adminSetTier);
app.get('/admin/logout',    adminLogout);
app.get('/sitemap.xml', sitemapXml);
app.get('/robots.txt', c => c.text(`User-agent: *\nAllow: /\nSitemap: https://unilens.net/sitemap.xml`));
app.get('/favicon.svg', c => c.body(logoSvg, 200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }));
app.get('/ads.txt', c => c.text('google.com, pub-8886855956034386, DIRECT, f08c47fec0942fa0'));


// Protected routes
app.get('/me', requireAuth, c => {
  const user = c.get('user');
  return c.json({ id: user.id, name: user.name, role: user.role });
});
app.get('/auth/logout', async (c) => {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie.split(';').find(s => s.trim().startsWith('session='))?.split('=')[1];
  if (token) await c.env.SESSIONS.delete(token);
  c.header('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
  return c.redirect('/');
});
app.post('/sanitize', requireAuth, async (c) => {
  const { html } = await c.req.json();
  return c.json({ html: sanitizePortfolio(html ?? '') });
});


app.notFound(c => c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — UniLens</title>
  ${favicon}
  <style>
    ${theme}
    ${topbarStyles}
    body { padding: 0; }
    .page { max-width: 480px; margin: 6rem auto; padding: 0 1.5rem; text-align: center; }
    .code { font-family: var(--font-serif); font-size: 80px; font-weight: 400; color: var(--color-border); line-height: 1; margin-bottom: 1rem; }
    .msg { font-size: 20px; font-weight: 400; font-family: var(--font-serif); margin-bottom: 0.5rem; }
    .sub { font-size: 14px; color: var(--color-text-muted); margin-bottom: 2rem; }
    .home-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: var(--color-primary); color: white; border-radius: var(--radius-full); font-size: 14px; font-weight: 500; text-decoration: none; transition: opacity 0.15s; }
    .home-btn:hover { opacity: 0.8; }
  </style>
</head>
<body>
  ${topbar('', '')}
  <div class="page">
    <div class="code">404</div>
    <p class="msg">Page not found</p>
    <p class="sub">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" class="home-btn">Go home</a>
  </div>
</body>
</html>`, 404));
export default {
  fetch: app.fetch.bind(app),
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    await message.forward("arimweber@gmail.com");
  }
};