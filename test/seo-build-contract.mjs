import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalog, redirects, rewrites, sitemap } from '../scripts/seo-routing.mjs';
const config = JSON.parse(await readFile('vercel.json','utf8'));
assert.deepEqual(config.redirects, redirects, 'Vercel redirects differ from route catalog');
assert.deepEqual(config.rewrites, rewrites, 'Vercel rewrites differ from route catalog');
assert(!config.cleanUrls || rewrites.every(row=>!row.destination.endsWith('.js') && !row.destination.endsWith('.html')), 'cleanUrls rewrite destinations must omit extensions');
assert(!rewrites.some(row => row.source === '/(.*)'), 'Unknown paths must not become 200 SPA fallback');
assert.equal(await readFile('dist/sitemap-static.xml','utf8'), sitemap);
await assert.rejects(readFile('dist/sitemap.xml','utf8'), {code:'ENOENT'}, 'Static sitemap must not shadow the live content function');
assert.equal(await readFile('public/sitemap.xml','utf8'), sitemap);
assert(!sitemap.includes('/egitim<') && !sitemap.includes('/degerlendirme-basvurusu<') && !sitemap.includes('/networking/'), 'Redirect/noindex pages in sitemap');
const guidePaths = ['/business-networking', '/is-cevresi-nasil-genisletilir', '/profesyonel-is-agi-nasil-kurulur', '/networking-neden-kartvizit-toplamak-degildir', '/networking-ile-satis-arasindaki-fark'];
for (const row of catalog) {
 const file=row.path==='/'?'index.html':row.path.slice(1)+'.html';
 const html=await readFile('dist/'+file,'utf8');
 const title=html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1];
 const canonicals=[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
 const descriptions=[...html.matchAll(/<meta\b[^>]*name="description"[^>]*>/g)];
 assert(title && title !== 'Event4Network', 'Route title missing: '+row.path);
 assert.equal(canonicals.length,1,'Canonical count: '+row.path);
 assert(canonicals[0][0].includes('https://www.event4network.com'+row.path),'Wrong canonical: '+row.path);
 assert.equal(descriptions.length,1,'Description count: '+row.path);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'Document heading count: '+row.path);
 assert(html.includes('<a ') && html.includes('href="/uyelik"'),'Crawlable conversion links missing: '+row.path);
 assert(html.includes(row.index ? 'index, follow' : 'noindex, follow'),'Robots missing: '+row.path);
 for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
  const schema=JSON.parse(match[1]);assert(schema['@context']==='https://schema.org');
 }
 assert(!html.includes('trae-inspector-'),'Development inspector shipped');
 if (guidePaths.includes(row.path)) {
  for (const target of guidePaths.filter(path => path !== row.path)) assert(html.includes('href="'+target+'"'), 'Guide cluster link missing: '+row.path+' -> '+target);
  const graphs = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap(match => JSON.parse(match[1])['@graph'] || []);
  const article = graphs.find(node => node['@type'] === 'Article');
  assert.equal(article?.mainEntityOfPage, 'https://www.event4network.com'+row.path, 'Article URL: '+row.path);
  assert.equal(article?.dateModified, row.lastmod, 'Visible article and sitemap dates: '+row.path);
  assert(html.includes('<time dateTime="'+row.lastmod+'"') || html.includes('<time datetime="'+row.lastmod+'"'), 'Visible modification date: '+row.path);
  assert(!/%50\+|%2-3|kesintisiz bir referans|her hafta birbirinin|Her grupta tek bir meslek dalı/.test(html), 'Unverified guide claim: '+row.path);
 }
}
const guideIndex=await readFile('dist/blog.html','utf8');
for (const target of guidePaths) assert(guideIndex.includes('href="'+target+'"'), 'Guide discovery link missing: '+target);
const missing=await readFile('dist/404.html','utf8');
assert(missing.includes('noindex, follow') && missing.includes('Sayfa Bulunamadı'));
const shell=await readFile('dist/_app.html','utf8');
assert(shell.includes('noindex, follow') && !shell.includes('rel="canonical"'));
const dynamic=await readFile('dist/_content.html','utf8');
assert(!dynamic.includes('rel="canonical"') && !dynamic.includes('noindex'));
const refRules=redirects.filter(row=>row.source==='/degerlendirme-basvurusu');
assert(refRules[0].has[0].key==='refId' && refRules[0].destination==='/ziyaretci-basvurusu');
assert(refRules[1].destination==='/auth/register');
assert(redirects.some(row=>row.source==='/is-agi-rehberi/:slug'&&row.destination==='/blog/:slug'));
console.log('SEO build contract PASS: '+catalog.length+' static pages; single canonical/description/H1; raw content/link/schema; redirects/noindex/sitemap/private/dynamic/404; inspector excluded.');
