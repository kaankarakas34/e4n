async page => {
  const fixture=/*FIXTURE*/null;
  const cases=[];
  const add=name=>cases.push(name);
  const publicRoutes=['/','/uyelik','/nasil-calisir','/e4n-nedir','/sikca-sorulan-sorular','/topluluklarimiz','/hakkimizda'];
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    for(const route of publicRoutes) {
      await page.goto(fixture.webBase+route);
      await page.locator('h1:visible').first().waitFor();
      const text=await page.locator('body').innerText();
      for(const stale of ['Üyelik, doğrudan bir kayıt işlemi değil','üyelikler belirli aşamalardan geçerek onaylanır','Ücretsiz Topluluk Profili Oluşturun','Değerlendirme Başvurusu Yap','Kulüp üyeliği yalnızca sınırlı kontenjanla'])if(text.includes(stale))throw Error(route+' retains '+stale);
      if(await page.locator('a[href="/egitim"]').count())throw Error('Deferred LMS link remains');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
      if(overflow)throw Error(route+' horizontal overflow at '+width);
      add(route+' consistent public copy at '+width);
    }
    await page.goto(fixture.webBase+'/uyelik');
    await page.getByRole('heading',{name:'Kayıttan gruba katılıma',exact:true}).waitFor();
    if(await page.locator('ol > li').count()!==4)throw Error('Missing membership stages');
    await page.getByText('Abonelik ve grup kabulü',{exact:true}).waitFor();
    if(width===390){await page.getByRole('button',{name:'Gezinme menüsünü aç/kapat'}).click();await page.locator('header').getByRole('link',{name:'Üyelik',exact:true}).click();}
    await page.locator('main').getByRole('link',{name:'Üye Ol',exact:true}).click();
    await page.waitForURL('**/auth/register');
    await page.getByLabel('Şirket İsmi',{exact:true}).waitFor();
    for(const label of ['Şirket İsmi','VKN veya TCKN','Vergi Dairesi','Fatura Adresi','Bulunduğunuz İl'])if(await page.getByLabel(label,{exact:true}).getAttribute('required')===null)throw Error('Missing required company/province field '+label);
    add('Public membership CTA → required company registration at '+width);
  }
  await page.goto(fixture.webBase+'/degerlendirme-basvurusu');await page.waitForURL('**/auth/register');add('Old membership evaluation URL → normal registration');
  const ref='12345678-1234-4123-8123-123456789abc';await page.goto(fixture.webBase+'/degerlendirme-basvurusu?refId='+ref);await page.waitForURL('**/ziyaretci-basvurusu?refId='+ref);await page.getByRole('heading',{name:'Ziyaretçi Başvurusu',exact:true}).waitFor();add('Legacy visitor referral keeps route and refId');
  for(const route of ['/egitim','/egitim-basvuru']){await page.goto(fixture.webBase+route);await page.waitForURL('**/uyelik');add(route+' deferred');}
  await page.setViewportSize({width:1440,height:900});
  return {cases,issues:[],productionWrites:false};
}

