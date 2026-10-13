import { readFile, writeFile } from 'node:fs/promises';
export const catalog = JSON.parse(await readFile(new URL('../src/seo/routeCatalog.json', import.meta.url), 'utf8'));
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
export const redirects = [...appSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate to="([^"]+)" replace \/>\}\s*\/>/g)].map(m => ({ source: m[1], destination: m[2], statusCode: 301 }));
redirects.push(
  { source: '/is-agi-rehberi/:slug', destination: '/blog/:slug', statusCode: 301 },
  { source: '/degerlendirme-basvurusu', destination: '/ziyaretci-basvurusu', has: [{ type: 'query', key: 'refId' }], statusCode: 301 },
  { source: '/degerlendirme-basvurusu', destination: '/auth/register', statusCode: 301 },
);
export const clientPaths = [...new Set([...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]))]
  .filter(path => path !== '*' && !catalog.some(row => row.path === path) && path !== '/networking/:city' && !redirects.some(row => row.source === path));
export const rewrites = [
  { source: '/api/(.*)', destination: '/api/index' },
  ...clientPaths.map(source => ({ source, destination: source.startsWith('/event/') || source.startsWith('/blog/') ? '/_content' : '/_app' })),
];
export const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + catalog.filter(row => row.index).map(row => '  <url><loc>https://www.event4network.com' + row.path + '</loc><lastmod>' + row.lastmod + '</lastmod></url>').join('\n') + '\n</urlset>\n';
if (process.argv.includes('--write')) {
  const file = new URL('../vercel.json', import.meta.url);
  const config = JSON.parse(await readFile(file, 'utf8'));
  config.cleanUrls = true;
  config.redirects = redirects;
  config.rewrites = rewrites;
  const generatedSources = new Set([
    ...rewrites.filter(row => row.destination === '/_app').map(row => row.source),
    ...catalog.filter(row => !row.index).map(row => row.path),
    '/_app', '/_content', '/seo-manifest.json', '/assets/(.*)',
  ]);
  config.headers = config.headers.filter(row => !generatedSources.has(row.source));
  config.headers.push(...[...generatedSources].filter(source => source !== '/assets/(.*)').map(source => ({
    source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
  })));
  config.headers.push({ source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] });
  // Explicit application fallback never rewrites an unknown public URL.
  await writeFile(file, JSON.stringify(config, null, 2) + '\n');
  await writeFile(new URL('../public/sitemap.xml', import.meta.url), sitemap);
  console.log('SEO routes: ' + catalog.length + ' public pages; ' + redirects.length + ' 301 rules; ' + clientPaths.length + ' explicit client routes.');
}
