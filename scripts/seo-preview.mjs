import { createServer } from 'node:http';
import { createContentHandler } from '../server/src/public-content-seo.mjs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { redirects, rewrites } from './seo-routing.mjs';
const dist = resolve('dist');
const port = Number(process.env.PORT || 4178);
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const contentHandler=createContentHandler({query:async()=>({rows:[]})});
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon' };
export function matchRoute(source, path) {
  const names = [];
  const escaped = source.split('/').map(part => part.startsWith(':') ? (names.push(part.slice(1)), '([^/]+)') : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');
  const match = path.match(new RegExp('^' + escaped + '$'));
  return match ? Object.fromEntries(names.map((name, index) => [name, match[index + 1]])) : null;
}
async function sendFile(res, file, status = 200, robots, acceptsGzip = false) {
  const absolute = resolve(dist, file.replace(/^\//, ''));
  if (!absolute.startsWith(dist + sep) && absolute !== dist) throw new Error('Path outside dist');
  let body = await readFile(absolute);
  const compressed = acceptsGzip && ['.html','.js','.css','.json','.xml','.txt','.svg'].includes(extname(file));
  if (compressed) body = gzipSync(body);
  res.writeHead(status, { 'Content-Type':mime[extname(file)] || 'application/octet-stream', ...(robots ? { 'X-Robots-Tag':robots } : {}), ...(compressed ? { 'Content-Encoding':'gzip', Vary:'Accept-Encoding' } : {}) });
  res.end(body);
}
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  try {
    for (const rule of config.headers) {
      const wildcard = rule.source.endsWith('/(.*)');
      const applies = rule.source === '/(.*)' || (wildcard && url.pathname.startsWith(rule.source.slice(0, -4))) || (!wildcard && matchRoute(rule.source, url.pathname));
      if (applies) for (const header of rule.headers) res.setHeader(header.key, header.value);
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    for (const rule of redirects) {
      const params = matchRoute(rule.source, url.pathname);
      if (!params || rule.has?.some(condition => !url.searchParams.has(condition.key))) continue;
      const target = rule.destination.replace(/:([a-z]+)/g, (_, key) => params[key]);
      res.writeHead(rule.statusCode, { Location:target + url.search }); res.end(); return;
    }
    if (url.pathname.startsWith('/api/')) {
      // Local, read-only fixtures; production API ownership is unchanged.
      const data = url.pathname === '/api/events' ? [] : { error:'Isolated SEO preview: no production API or data connection' };
      res.writeHead(url.pathname === '/api/events' ? 200 : 401, { 'Content-Type':'application/json' }); res.end(JSON.stringify(data)); return;
    }
    const clean = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
    if(clean==='/sitemap.xml' || /^\/(blog|event)\/[^/]+$/.test(clean)) { await contentHandler(req,res);return; }
    for (const file of [clean === '/' ? '/index.html' : clean, clean + '.html']) {
      try { if ((await stat(resolve(dist, '.' + file))).isFile()) { await sendFile(res, file, 200, undefined, acceptsGzip); return; } } catch { /* explicit rewrites below */ }
    }
    const rewrite = rewrites.find(rule => rule.source !== '/api/(.*)' && matchRoute(rule.source, clean));
    if (rewrite) { await sendFile(res, rewrite.destination + '.html', 200, rewrite.destination === '/_app' ? 'noindex, follow' : undefined, acceptsGzip); return; }
    await sendFile(res, '/404.html', 404, 'noindex, follow', acceptsGzip);
  } catch { res.writeHead(500); res.end('SEO preview error'); }
}).listen(port, '127.0.0.1', () => console.log('Isolated SEO preview: http://127.0.0.1:' + port + ' (local read-only fixtures, no DB/API proxy)'));
