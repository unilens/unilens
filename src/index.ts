import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/',              c => c.text('UniLens'))
app.get('/p/:slug',       /* render photographer profile */)
app.post('/auth/register',/* create user */)
app.post('/auth/login',   /* issue session token to KV */)
app.post('/portfolio',    /* save sanitized HTML, auth required */)
app.post('/rate/:id',     /* submit rating, client only */)

export default app