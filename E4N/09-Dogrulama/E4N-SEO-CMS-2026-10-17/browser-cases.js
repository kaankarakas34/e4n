async (page) => {
 await page.route('https://fixture.invalid/**',route=>route.fulfill({path:'C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/output/seo-cms-17-cover.png',contentType:'image/png'}));
 const cases=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(value,message)=>{if(!value)throw new Error(message);};
 const test=async(name,fn)=>{try{await fn();cases.push({name,status:'PASS'});}catch(error){cases.push({name,status:'FAIL',error:error.message});throw error;}};
 let id;await page.goto(page.url().split('/blog/')[0]+'/admin/blogs/new');await page.getByText('İçerik planı ve inceleme',{exact:true}).waitFor();
 await test('cluster-author-options',async()=>{check(await page.getByRole('combobox',{name:'İçerik kümesi',exact:true}).locator('option').count()===19,'Expected 18 clusters');});
 await test('invalid-upload-feedback',async()=>{await page.locator('input[type=file]').setInputFiles('C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/output/seo-cms-17-invalid.svg');await page.getByRole('alert').filter({hasText:'PNG, JPG veya WebP seçin'}).waitFor();});
 await test('server-cover-upload',async()=>{await page.locator('input[type=file]').setInputFiles('C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/output/seo-cms-17-cover.png');await page.getByRole('status').filter({hasText:'1200 × 630'}).waitFor();});
 await test('draft-persist-editorial',async()=>{
  await page.getByPlaceholder('Harika bir başlık düşünün...').fill('Browser CMS acceptance');
  await page.getByPlaceholder('Görseli anlatan SEO odaklı metin').fill('Fixture cover');
  await page.getByRole('textbox',{name:'Görsel kullanım izni ve kaynağı'}).fill('Synthetic fixture generated locally for verification only');
  await page.getByRole('combobox',{name:'İçerik kümesi',exact:true}).selectOption('02');
  await page.getByRole('combobox',{name:'Ana rehber (pillar)'}).selectOption('support-article');
  await page.getByRole('textbox',{name:'İçerik briefi ve kaynak kontrolü'}).fill('Private browser brief: preparation intent, original checklist and membership CTA verified.');
  await page.getByRole('button',{name:'Kaydet',exact:true}).click();await page.waitForURL(/\/admin\/blogs\/[0-9a-f-]{36}$/);
  id=page.url().split('/').pop();await page.getByRole('textbox',{name:'İçerik briefi ve kaynak kontrolü'}).waitFor();
  check(await page.getByRole('combobox',{name:'İçerik kümesi',exact:true}).inputValue()==='02','Cluster not persisted');
 });
 await test('publication-review-and-reconfirmation',async()=>{
  await page.getByRole('button',{name:'İçerik Editörü',exact:true}).click();await page.getByPlaceholder('Yazınızı buraya yazın...').fill('<h2>Preparation checklist</h2><p>'+('Original useful fixture preparation guidance. '.repeat(8))+'</p>');
  await page.getByRole('button',{name:'SEO Ayarları',exact:true}).click();await page.locator('textarea').fill('Useful fixture guide for event preparation with an original checklist.');
  await page.getByRole('combobox',{name:'Yayın durumu'}).selectOption('published');check(await page.getByRole('button',{name:'Kaydet',exact:true}).isDisabled(),'Publication missing review gate');
  const review=page.getByRole('checkbox',{name:'İçerik ve uzman incelemesi tamamlandı'});await review.check();
  await page.locator('textarea').fill('Updated fixture metadata requires a fresh review confirmation.');check(!await review.isChecked(),'Review did not reset after edit');await review.check();
  const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().includes('/api/admin/blogs/'+id));await page.getByRole('button',{name:'Kaydet',exact:true}).click();check((await saved).status()===200,'Full editor payload rejected');
  await page.getByRole('button',{name:'Genel Bilgiler',exact:true}).click();await page.getByText(/Son uzman onayı:/).waitFor();
 });
 await test('public-links-and-private-notes',async()=>{
  await page.goto(page.url().split('/admin/')[0]+'/blog/browser-cms-acceptance');await page.getByRole('heading',{name:'Browser CMS acceptance',exact:true}).waitFor();
  const nav=page.getByRole('navigation',{name:'İlgili içerikler'});check(await nav.getByRole('link').getAttribute('href')==='/blog/support-article','Pillar link missing');check(!await page.getByText('Private browser brief',{exact:false}).count(),'Private brief exposed');
 });
 return {cases,errors,id,failed:cases.filter(c=>c.status==='FAIL').length};
}