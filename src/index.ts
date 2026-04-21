import { Hono } from 'hono';
import { Env, Variables } from './types';
import { googleLogin, googleCallback, completeRegistration, requireAuth, softAuth } from './auth';
import { savePortfolio, getProfile, getPhotographers } from './portfolio';
import { uploadImage } from './upload';
import { ratePhotographer } from './ratings';
import { homePage } from './home';
import { loginPage, registerPage, aboutPage } from './pages';
import { roleSelectPage } from './role';
import { dashboardPage } from './dashboard';
import { sendContactRequest, acceptContactRequest, declineContactRequest } from './contact';
import { clientDashboardPage } from './client-dashboard';
import { inquiriesPage } from './inquiries';
import { sanitizePortfolio } from './sanitize';
import { toggleSave } from './save';
import { getNotifications, markNotificationsSeen } from './notifications';
import { listImages, deleteImage } from './images';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

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



export default app;