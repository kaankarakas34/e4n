import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {excludedEventIds} from '../../../../src/seo/contentMetadata.mjs';
const approved=JSON.parse(readFileSync('E4N/07-Sprintler/E4N-SEO-Icerik-Paket-1-2026-10-13/cms-draft.json','utf8'));
const origin='https://www.event4network.com';
const api=await fetch(origin+'/api/blogs/'+approved.slug);assert.equal(api.status,200);const blog=await api.json();
assert.equal(blog.id,'fe1a5375-6d52-4811-9375-b5cd13945219');assert.equal(blog.status,'published');assert.equal(blog.content,approved.content);assert.equal(blog.canonical_url,approved.canonical_url);assert(blog.published_at);assert.equal(blog.author_id,null);
const response=await fetch(approved.canonical_url);const html=await response.text();assert.equal(response.status,200);assert(!response.headers.get('x-robots-tag')?.includes('noindex'));
assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert(html.includes(approved.meta_title));assert(html.includes(approved.meta_description));assert(html.includes('name="robots" content="index, follow"'));
const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));const article=schemas.find(s=>s['@type']==='BlogPosting');assert(article);assert.equal(article.author['@type'],'Organization');assert.equal(article.author.name,'Event4Network');assert.equal(article.datePublished,new Date(blog.published_at).toISOString());assert(schemas.some(s=>s['@type']==='BreadcrumbList'));
const sm=await fetch(origin+'/sitemap.xml');const xml=await sm.text();assert.equal(sm.status,200);assert.equal((xml.match(/<loc>/g)||[]).length,23);assert(xml.includes(approved.canonical_url));
const events=[];for(const id of excludedEventIds){assert(!xml.includes(id));const r=await fetch(origin+'/event/'+id);assert.equal(r.status,200);assert(r.headers.get('x-robots-tag')?.includes('noindex'));events.push({id,status:r.status,robots:r.headers.get('x-robots-tag')});}
const result={checkedAt:new Date().toISOString(),url:approved.canonical_url,id:blog.id,status:blog.status,publishedAt:blog.published_at,htmlStatus:response.status,singleH1:true,singleCanonical:true,robots:'index, follow',schemaTypes:schemas.map(s=>s['@type']),author:article.author,sitemapCount:23,legacyEvents:events};writeFileSync('output/article-production-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
