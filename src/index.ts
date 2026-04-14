import { Hono } from 'hono';
import { Env, Variables } from './types';
import { register, login, requireAuth } from './auth';
import { savePortfolio, getProfile, getPhotographers } from './portfolio';
import { uploadImage } from './upload';
import { ratePhotographer } from './ratings';
import { homePage } from './home';
import { loginPage, registerPage } from './pages';


const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Public routes
app.post('/auth/register', register);
app.post('/auth/login', login);

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

app.post('/portfolio',  requireAuth, savePortfolio);
app.post('/upload', requireAuth, uploadImage);
app.post('/rate/:id', requireAuth, ratePhotographer);


export default app;