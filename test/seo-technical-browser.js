async (page) => {
 const base='http://127.0.0.1:4178';
 const rows=[], errors=[];
 page.on('pageerror', e => errors.push(String(e)));
 await page.route('**/*.supabase.co/**', route => route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 const manifest=await (await page.request.get(base+'/seo-manifest.json')).json();
 for(const row of manifest){
  const raw=await page.request.get(base+row.path);
  if(raw.status()!==200)throw Error('HTTP '+raw.status()+' at '+row.path);
  await page.goto(base+row.path,{waitUntil:'domcontentloaded'});
  await page.locator('main h1').first().waitFor({state:'visible',timeout:15000});
  await page.waitForTimeout(150);
  const r=await page.evaluate(()=>({path:location.pathname,title:document.title,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),descriptions:document.querySelectorAll('meta[name=description]').length,h1:document.querySelectorAll('h1').length,robots:document.querySelector('meta[name=robots]')?.getAttribute('content'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
  if(r.canonical.length!==1 || r.canonical[0]!=='https://www.event4network.com'+row.path || r.descriptions!==1 || r.h1!==1)throw Error('Rendered contract: '+JSON.stringify(r));
  if(!row.index && !r.robots?.includes('noindex'))throw Error('Noindex lost: '+row.path);
  rows.push(r);
 }
 const redirects=[];
 for(const [source,target] of [
  ['/egitim?utm_source=seo','/uyelik?utm_source=seo'],
  ['/public-events','/etkinlikler'],
  ['/degerlendirme-basvurusu?refId=legacy-abc&utm_source=seo','/ziyaretci-basvurusu?refId=legacy-abc&utm_source=seo'],
  ['/degerlendirme-basvurusu?utm_source=seo','/auth/register?utm_source=seo'],
  ['/is-agi-rehberi/eski-baslik?utm_source=seo','/blog/eski-baslik?utm_source=seo'],
  ['/is-insanlari-kulubu','/e4n-nedir'],
 ]){
  const r=await page.request.get(base+source,{maxRedirects:0});const location=r.headers().location;
  if(r.status()!==301||location!==target)throw Error('Redirect contract: '+source+' '+r.status()+' '+location);
  redirects.push({source,status:r.status(),location});
 }
 const missing=await page.request.get(base+'/definitely-not-a-real-page');
 if(missing.status()!==404)throw Error('Unknown page not 404');
 await page.goto(base+'/auth/login');await page.getByRole('button',{name:'Giriş Yap',exact:true}).waitFor({state:'visible'});
 const auth=await page.evaluate(()=>({robots:document.querySelector('meta[name=robots]')?.getAttribute('content'),canonicals:document.querySelectorAll('link[rel=canonical]').length}));
 if(!auth.robots?.includes('noindex')||auth.canonicals)throw Error('Auth metadata leaked');
 await page.goto(base+'/dashboard');await page.waitForURL('**/auth/login');await page.getByRole('button',{name:'Giriş Yap',exact:true}).waitFor({state:'visible'});
 const mobile=[];
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/uyelik','/topluluklarimiz','/networking/istanbul']){
  await page.goto(base+path);await page.locator('main h1').first().waitFor({state:'visible'});
  const r=await page.evaluate(()=>({path:location.pathname,overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length}));
  if(r.overflow||r.h1!==1)throw Error('Mobile contract: '+JSON.stringify(r));
  await page.screenshot({path:'output/playwright/e4n-seo-technical-2026-10-12/mobile-'+(path.replace(/[^a-z0-9]/g,'')||'home')+'.png',fullPage:true});mobile.push(r);
 }
 if(errors.length)throw Error('Uncaught browser errors: '+JSON.stringify(errors));
 return {routes:rows,redirects,missingStatus:missing.status(),auth,dashboardGuard:'login',mobile,errors,scope:'Isolated local HTTP adapter and browser; Supabase/event responses are read-only fixtures. Not a deployed Vercel or GSC test.'};
}
