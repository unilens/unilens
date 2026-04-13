import { Hono } from 'hono';
import { Env, Variables } from './types';
import { register, login, requireAuth } from './auth';
import { savePortfolio, getProfile } from './portfolio';



const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Public routes
app.post('/auth/register', register);
app.post('/auth/login', login);

// Protected route example
app.get('/me', requireAuth, c => {
  const user = c.get('user');
  return c.json({ id: user.id, name: user.name, role: user.role });
});

app.post('/portfolio',  requireAuth, savePortfolio);
app.get('/p/:slug', getProfile);


export default app;