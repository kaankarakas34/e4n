async (page) => {
 const rows=[];
 for(const path of ['/networking/istanbul','/networking/ankara','/networking/izmir','/is-agi-rehberi']){
  const url='https://www.event4network.com'+path;
  const r=await page.request.get(url,{maxRedirects:0});const html=await r.text();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('main h1').first().waitFor({state:'visible',timeout:5000}).catch(()=>{});
  await page.waitForTimeout(400);
  const rendered=await page.evaluate(()=>({url:location.href,title:document.title,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),robots:[...document.querySelectorAll('meta[name=robots]')].map(x=>x.content),h1:[...document.querySelectorAll('main h1')].map(x=>x.textContent),text:document.querySelector('main')?.innerText.slice(0,600)}));
  rows.push({url,status:r.status(),location:r.headers()['location'],rawCanonical:html.match(/<link[^>]*rel="canonical"[^>]*>/g),rendered});
 }
 return rows;
}
