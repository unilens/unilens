import { Hono } from 'hono';
import { Env, Variables } from './types';
import { googleLogin, googleCallback, completeRegistration, requireAuth } from './auth';
import { savePortfolio, getProfile, getPhotographers } from './portfolio';
import { uploadImage } from './upload';
import { ratePhotographer } from './ratings';
import { homePage } from './home';
import { loginPage, registerPage } from './pages';
import { roleSelectPage } from './role';


const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Public routes
app.get('/auth/login',    googleLogin);
app.get('/auth/callback', googleCallback);
app.post('/auth/complete', completeRegistration);

// Protected route example
app.get('/me', requireAuth, c => {
  const user = c.get('user');
  return c.json({ id: user.id, name: user.name, role: user.role });
});
app.get('/p/:slug', getProfile);
app.get('/photographers', getPhotographers);
app.get('/', homePage);
app.get('/login',    loginPage);
app.get('/register', registerPage);
app.get('/register/role', roleSelectPage);

app.post('/portfolio',  requireAuth, savePortfolio);
app.post('/upload', requireAuth, uploadImage);
app.post('/rate/:id', requireAuth, ratePhotographer);


export default app;