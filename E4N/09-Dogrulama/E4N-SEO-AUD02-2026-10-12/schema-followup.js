async (page) => {
 const report={};
 await page.goto('https://www.event4network.com/sikca-sorulan-sorular',{waitUntil:'domcontentloaded'});
 await page.locator('main h1').first().waitFor({state:'visible',timeout:10000});
 report.faq=await page.evaluate(()=>{const schema=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='FAQPage');const text=document.body.textContent;return {count:schema?.mainEntity?.length,questions:schema?.mainEntity?.map(q=>({question:q.name,questionInDOM:text.includes(q.name),answerInDOM:text.includes(q.acceptedAnswer?.text),hasAnswer:!!q.acceptedAnswer?.text})),parseOnly:true}});
 report.schemaResources=[];
 for(const path of ['/e4n-logo.png','/logo.png','/biz_kimiz_network.png']){
  const r=await page.request.get('https://www.event4network.com'+path);report.schemaResources.push({path,status:r.status(),contentType:r.headers()['content-type']});
 }
 report.placeholders=[];
 for(const path of ['/on-bilgilendirme-formu','/kullanim-kosullari','/cerez-politikasi','/mesafeli-satis-sozlesmesi','/iptal-ve-iade-kosullari']){
  await page.goto('https://www.event4network.com'+path);await page.locator('main h1').first().waitFor({state:'visible',timeout:5000}).catch(()=>{});
  report.placeholders.push(await page.evaluate(()=>({url:location.href,h1:[...document.querySelectorAll('main h1')].map(x=>x.textContent),mainText:document.querySelector('main')?.innerText.slice(0,700)})));
 }
 return report;
}
