import type { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Inline sitemap generation to avoid import issues
function generateSitemapXML(): string {
  const routes = [
    { loc: 'https://nucigenlabs.com/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 1.0 },
    { loc: 'https://nucigenlabs.com/intelligence', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
    { loc: 'https://nucigenlabs.com/case-studies', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/pricing', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.9 },
    { loc: 'https://nucigenlabs.com/papers', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/partners', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
    { loc: 'https://nucigenlabs.com/learn-more', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
    { loc: 'https://nucigenlabs.com/request-access', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/level/geopolitical', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/level/industrial', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/level/supply-chain', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
    { loc: 'https://nucigenlabs.com/level/market', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
  ];

  const urls = routes.map(route => {
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

export function sitemapPlugin(): Plugin {
  return {
    name: 'vite-plugin-sitemap',
    buildStart() {
      // Generate sitemap at build start
      try {
        const sitemap = generateSitemapXML();
        const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
        writeFileSync(outputPath, sitemap, 'utf-8');
        console.log('✅ Sitemap.xml generated successfully');
      } catch (error) {
        console.warn('⚠️ Could not generate sitemap:', error);
      }
    },
    buildEnd() {
      // Also generate at build end to ensure it's up to date
      try {
        const sitemap = generateSitemapXML();
        const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
        writeFileSync(outputPath, sitemap, 'utf-8');
      } catch (error) {
        console.warn('⚠️ Could not generate sitemap:', error);
      }
    },
  };
}

