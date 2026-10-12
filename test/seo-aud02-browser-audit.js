async (page) => {
 const base='https://www.event4network.com';
 const sitemap=await page.request.get(base+'/sitemap.xml');
 const xml=await sitemap.text();
 const urls=Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g),m=>m[1]);
 const targets=[...new Set([...urls,base+'/ziyaretci-basvurusu',base+'/public-events',base+'/auth/login',base+'/auth/register',base+'/dashboard',base+'/seo-audit-missing-20261012'])];
 const results=[];
 for(const url of targets){
  const row={url,checkedAt:new Date().toISOString()};
  try{
   const raw=await page.request.get(url,{maxRedirects:0});
   const html=await raw.text();row.status=raw.status();row.headers=Object.fromEntries(Object.entries(raw.headers()).filter(([k])=>['content-type','location','x-robots-tag','etag','last-modified'].includes(k)));
   row.raw=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.title,canonical:[...d.querySelectorAll('link[rel=canonical]')].map(x=>x.href),description:[...d.querySelectorAll('meta[name=description]')].map(x=>x.content),robots:[...d.querySelectorAll('meta[name=robots]')].map(x=>x.content),h1:[...d.querySelectorAll('h1')].map(x=>x.textContent),anchors:d.querySelectorAll('a[href]').length,scripts:[...d.querySelectorAll('script[src]')].map(x=>x.getAttribute('src'))}},html);
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});row.navigationStatus=response?.status();
   await page.locator('h1').first().waitFor({state:'visible',timeout:10000}).catch(()=>{});
   await page.waitForTimeout(500);
   row.rendered=await page.evaluate(()=>({
    url:location.href,title:document.title,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),
    description:[...document.querySelectorAll('meta[name=description]')].map(x=>x.content),robots:[...document.querySelectorAll('meta[name=robots]')].map(x=>x.content),
    h1:[...document.querySelectorAll('h1')].map(x=>x.textContent?.trim()),h2:[...document.querySelectorAll('h2')].map(x=>x.textContent?.trim()),
    textLength:document.querySelector('main')?.textContent?.length||document.body.textContent?.length,
    links:[...document.querySelectorAll('a[href]')].map(x=>({href:x.getAttribute('href'),text:x.textContent?.trim().slice(0,100)})),
    missingAlt:[...document.querySelectorAll('img:not([alt])')].map(x=>x.getAttribute('src')),
    schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>{try{return {data:JSON.parse(x.textContent)}}catch(e){return {error:String(e)}}}),
    overflow:document.documentElement.scrollWidth>innerWidth+1
   }));
  }catch(e){row.error=String(e)}
  results.push(row);
 }
 const mobile=[];
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/uyelik','/nasil-calisir','/etkinlikler','/topluluklarimiz','/sikca-sorulan-sorular']){
  await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.locator('h1').first().waitFor({state:'visible',timeout:10000}).catch(()=>{});await page.waitForTimeout(500);
  const row=await page.evaluate(()=>({url:location.href,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent?.trim()),overflow:document.documentElement.scrollWidth>innerWidth+1}));
  await page.screenshot({path:'output/playwright/e4n-seo-aud02-2026-10-12/mobile-'+(path.replace(/[^a-z0-9]/g,'')||'home')+'.png',fullPage:true});mobile.push(row);
 }
 const resources=[];
 for(const path of ['/robots.txt','/llms.txt']){
  const r=await page.request.get(base+path);resources.push({url:base+path,status:r.status(),text:await r.text()});
 }
 return {date:'2026-10-12',sitemap:{status:sitemap.status(),xml,urls},results,mobile,resources,scope:'Isolated anonymous browser; raw HTTP and rendered DOM. No GSC Googlebot or field-performance assertion.'};
}
