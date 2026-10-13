async (page) => {
 const assert=(condition,message='Assertion failed')=>{if(!condition)throw new Error(message)};
 assert.equal=(a,b)=>assert(a===b,JSON.stringify({actual:a,expected:b}));
 assert.deepEqual=(a,b)=>assert(JSON.stringify(a)===JSON.stringify(b));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const rows=[];const origin='https://www.event4network.com';
 const article='/blog/networking-etkinligine-hazirlik';
 const paths=[article,'/uyelik','/etkinlikler','/topluluklarimiz','/nasil-calisir','/auth/register'];
 for(const route of paths){
  const response=await page.goto(origin+route);assert.equal(response.status(),200);
  await page.locator(route==='/auth/register'?'form':'h1').waitFor();
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent||null,canonicalCount:document.querySelectorAll('link[rel="canonical"]').length,robots:document.querySelector('meta[name="robots"]')?.content||null}));
   assert.equal(metrics.width,width);assert(metrics.scrollWidth<=width,route+' horizontal overflow');rows.push({route,...metrics,overflow:metrics.scrollWidth>width});
   if(width===390)await page.screenshot({path:'output/playwright/e4n-cro/mobile-'+(route===article?'article':route.slice(1).replaceAll('/','-'))+'.png',fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(origin+'/uyelik');await page.getByRole('button',{name:'Ücretsiz Üye Ol & Ziyaretçi Ol',exact:true}).waitFor();
 const registrationCTA=await page.getByRole('button',{name:'Ücretsiz Üye Ol & Ziyaretçi Ol',exact:true}).boundingBox();assert(registrationCTA.height>=44);await page.getByRole('button',{name:'Ücretsiz Üye Ol & Ziyaretçi Ol',exact:true}).click();await page.waitForURL('**/auth/register');await page.getByText('Şirket bilgilerinizle doğrudan üye olun.',{exact:false}).waitFor();
 const registrationText=await page.locator('body').innerText();assert(registrationText.includes('Davetiye veya yönetici onayı gerekmez'));assert(registrationText.includes('Grup başvurusu için abonelik gerekir'));
 await page.goto(origin+'/etkinlikler');await page.getByRole('heading',{name:'Planlanmış Etkinlik Bulunmuyor'}).waitFor();
 assert.equal(await page.locator('main a[href^="/event/"]').count(),0);await page.getByRole('button',{name:'Topluluk Duyurularını Takip Et',exact:true}).first().click();await page.waitForURL('**/topluluklarimiz');
 await page.getByText('Açık WhatsApp topluluklarına katılmak için E4N hesabı açmanız veya abonelik satın almanız gerekmez.',{exact:true}).waitFor();
 const invites=await page.locator('a[href^="https://chat.whatsapp.com/"]').evaluateAll(links=>links.map(a=>({href:a.href,text:a.textContent.trim(),target:a.target,rel:a.rel})));assert.equal(invites.length,10);assert.equal(new Set(invites.map(a=>a.href)).size,10);assert(invites.every(a=>a.target==='_blank'&&a.rel.includes('noopener')));
 await page.goto(origin+article);await page.getByRole('link',{name:'üyelik bilgilerini',exact:true}).click();await page.waitForURL('**/uyelik');await page.getByRole('heading',{name:'Hesap, abonelik ve grup kabulü',exact:true}).waitFor();
 await page.goto(origin+article);await page.getByRole('link',{name:'E4N etkinlik takvimini',exact:true}).click();await page.waitForURL('**/etkinlikler');await page.getByRole('heading',{name:'Planlanmış Etkinlik Bulunmuyor'}).waitFor();
 const eventsResponse=await page.request.get(origin+'/api/events');assert.equal(eventsResponse.status(),200);const events=await eventsResponse.json();const published=events.filter(e=>e.is_public&&e.status==='PUBLISHED');assert.equal(published.length,0);
 assert.deepEqual(errors,[]);
 return {checkedAt:new Date().toISOString(),scope:'Real anonymous production browser, no mocked network or production mutations',rows,flows:{membershipToRegistration:true,accountSubscriptionSeparation:true,articleToMembership:true,articleToEvents:true,emptyEventsToCommunities:true,whatsappAnonymousInvites:10,registrationCTAHeight:registrationCTA.height},publicPublishedEventCount:published.length,pageErrors:errors,limits:['No account submitted, payment, visit request or WhatsApp join','No real future published event exists; ticket/registration flow not exercised','WhatsApp invite destinations inspected; group availability not independently checked']};
}
