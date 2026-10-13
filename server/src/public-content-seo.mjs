import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {blogMetadata,eventMetadata,breadcrumb,textContent,isoDate,ORIGIN,excludedEventIds} from '../../src/seo/contentMetadata.mjs';
import {contentHtml} from '../../src/seo/contentHtml.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const eventColumns="id,title,description,start_at,end_at,location,city,is_online,status,is_public,created_at";
export function createContentHandler({query,loadTemplate=()=>readFile(resolve('dist/_content.html'),'utf8'),loadCatalog=async()=>JSON.parse(await readFile(resolve('src/seo/routeCatalog.json'),'utf8'))}) {
 return async function(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.statusCode=405;return res.end();}
  const url=new URL(req.url,ORIGIN),path=url.pathname;
  try {
   if(path==='/sitemap.xml'){
    const catalog=await loadCatalog();
    const blogs=await query("SELECT slug,canonical_url,robots,include_in_sitemap,published_at,created_at,updated_at FROM blogs WHERE status='published'");
    const events=await query(`SELECT id,created_at FROM events WHERE is_public=TRUE AND status IN ('PUBLISHED','COMPLETED','CANCELLED')`);
    const rows=catalog.filter(r=>r.index).map(r=>({url:ORIGIN+r.path,date:r.lastmod}));
    for(const b of blogs.rows){const meta=blogMetadata(b);if(b.include_in_sitemap===true && !meta.noindex && meta.canonical===ORIGIN+meta.path)rows.push({url:meta.canonical,date:isoDate(b.updated_at || b.published_at || b.created_at)});}
    // Events have no reliable modification timestamp; omit lastmod instead of inventing one.
    for(const e of events.rows)if(!excludedEventIds.has(e.id))rows.push({url:ORIGIN+'/event/'+encodeURIComponent(e.id)});
    const body='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Map(rows.map(r=>[r.url,r])).values()].map(r=>`<url><loc>${escape(r.url)}</loc>${r.date?`<lastmod>${escape(r.date)}</lastmod>`:''}</url>`).join('')+'</urlset>';
    res.statusCode=200;res.setHeader('Content-Type','application/xml; charset=utf-8');return res.end(req.method==='HEAD'?undefined:body);
   }
   const match=path.match(/^\/(blog|event)\/([^/]+)\/?$/);
   let record=null,kind=match?.[1];
   if(match){const key=decodeURIComponent(match[2]);
    if(kind==='blog')record=(await query("SELECT b.*, json_build_object('name',u.name) AS author, json_build_object('name',c.name) AS category FROM blogs b LEFT JOIN users u ON u.id=b.author_id LEFT JOIN blog_categories c ON c.id=b.category_id WHERE b.slug=$1 AND b.status='published'",[key])).rows[0];
    else if(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(key))record=(await query(`SELECT ${eventColumns} FROM events WHERE id=$1 AND is_public=TRUE AND status IN ('PUBLISHED','COMPLETED','CANCELLED')`,[key])).rows[0];
   }
   const template=await loadTemplate();let head,body;
   if(!record){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex, follow');head='<title data-rh="true">İçerik Bulunamadı | Event4Network</title><meta data-rh="true" name="robots" content="noindex, follow"/>';body='<main class="max-w-4xl mx-auto px-6 py-16"><h1>İçerik Bulunamadı</h1><p>Bu içerik yayımlanmamış veya erişime kapalı olabilir.</p><a href="/">Ana sayfa</a></main>';}
   else {
    const meta=kind==='blog'?blogMetadata(record):eventMetadata(record);res.statusCode=200;if(meta.noindex)res.setHeader('X-Robots-Tag',meta.robots || 'noindex, follow');
    head=`<title data-rh="true">${escape(meta.title)}</title><meta data-rh="true" name="description" content="${escape(meta.description)}"/><meta data-rh="true" name="robots" content="${meta.robots || (meta.noindex?'noindex, follow':'index, follow')}"/><link data-rh="true" rel="canonical" href="${escape(meta.canonical)}"/>`;
    for(const [property,value] of [['og:type',meta.ogType],['og:title',meta.title],['og:description',meta.description],['og:url',meta.canonical],['og:image',meta.image]])if(value)head+=`<meta data-rh="true" property="${property}" content="${escape(value)}"/>`;
    for(const schema of [meta.schema,breadcrumb(meta,record.title,kind)])if(schema)head+=`<script data-rh="true" type="application/ld+json">${json(schema)}</script>`;
    body=`<main class="max-w-4xl mx-auto px-6 py-16"><nav><a href="/">Event4Network</a> / <a href="${kind==='blog'?'/blog':'/etkinlikler'}">${kind==='blog'?'Blog':'Etkinlikler'}</a></nav><article><h1 class="text-4xl font-bold my-8">${escape(record.title)}</h1>`;
    if(kind==='blog'){if(record.author?.name)body+=`<p>${escape(record.author.name)}</p>`;body+=`<p>${escape(record.excerpt)}</p><div class="prose my-8">${contentHtml(record.content)}</div>`;}
    else {body+=`<p><time datetime="${escape(isoDate(record.start_at))}">${escape(new Date(record.start_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}))}</time></p><p>${escape(record.location)} ${escape(record.city)}</p><p>${record.status==='CANCELLED'?'Etkinlik iptal edildi.':record.status==='COMPLETED'?'Etkinlik tamamlandı.':'Etkinlik duyurusu'}</p><div class="whitespace-pre-wrap my-8">${escape(textContent(record.description))}</div><a href="/auth/login">Giriş yap</a>`;}
    body+='</article><a href="/uyelik">Üyelik bilgileri</a></main>';
   }
   // Remove generic shell metadata before adding record-owned head tags.
   const html=template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*data-rh="true"[^>]*>/gi,'').replace('</head>',head+'</head>').replace('<div id="root"></div>',`<div id="root">${body}</div>`);
   res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(req.method==='HEAD'?undefined:html);
  }catch(error){console.error('Public content rendering failed:',error.code || error.name);res.statusCode=503;res.setHeader('X-Robots-Tag','noindex');res.setHeader('Retry-After','60');res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end(req.method==='HEAD'?undefined:'İçerik şu anda yüklenemiyor. Lütfen tekrar deneyin.');}
 };
}
