import { Context } from 'hono';
import { Env, Variables } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

const STATIC_PAGES = [
  { url: '/',        priority: '1.0', changefreq: 'daily' },
  { url: '/about',   priority: '0.4', changefreq: 'monthly' },
  { url: '/pricing', priority: '0.6', changefreq: 'monthly' },
];

export async function sitemapXml(c: AppContext) {
  const base = 'https://unilens.net';

  const profiles = await c.env.unilens_db.prepare(
    `SELECT slug FROM photographer_profiles WHERE slug IS NOT NULL`
  ).all<{ slug: string }>();

  const staticEntries = STATIC_PAGES.map(p => `
  <url>
    <loc>${base}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const profileEntries = profiles.results.map(p => `
  <url>
    <loc>${base}/p/${p.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${profileEntries}
</urlset>`;

  return c.body(xml, 200, {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=3600',
  });
}