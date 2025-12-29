// Utility to generate sitemap dynamically
// This can be used to generate sitemap.xml at build time or runtime

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const siteRoutes: SitemapUrl[] = [
  {
    loc: 'https://nucigenlabs.com/',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: 'https://nucigenlabs.com/intelligence',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: 'https://nucigenlabs.com/case-studies',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/pricing',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.9,
  },
  {
    loc: 'https://nucigenlabs.com/papers',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/partners',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    loc: 'https://nucigenlabs.com/learn-more',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    loc: 'https://nucigenlabs.com/request-access',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/level/geopolitical',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/level/industrial',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/level/supply-chain',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: 'https://nucigenlabs.com/level/market',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  },
];

export function generateSitemapXML(): string {
  const urls = siteRoutes.map(route => {
    let url = `  <url>\n    <loc>${route.loc}</loc>`;
    if (route.lastmod) {
      url += `\n    <lastmod>${route.lastmod}</lastmod>`;
    }
    if (route.changefreq) {
      url += `\n    <changefreq>${route.changefreq}</changefreq>`;
    }
    if (route.priority !== undefined) {
      url += `\n    <priority>${route.priority}</priority>`;
    }
    url += `\n  </url>`;
    return url;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`;
}

