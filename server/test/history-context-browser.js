async page=>{
 const f=/*E4N_BROWSER_FIXTURE*/null,cases=[],errors=[];
 page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await page.route('**/*',async route=>{const url=new URL(route.request().url());
  if(url.origin==='http://localhost:4005'){try{return route.fulfill({response:await route.fetch({url:f.apiBase+url.pathname+url.search})});}catch{return route.abort();}}
  if(url.origin===f.webBase)return route.continue();return route.abort();
 });
 const check=(value,message)=>{if(!value)throw Error(message);};
 async function test(name,fn){try{const before=errors.length;await fn();check(errors.length===before,'Uncaught browser error');cases.push({name,status:'PASS'});}catch(error){cases.push({name,status:'FAIL',error:error.message});await page.screenshot({path:f.runDir+'/'+name+'-failed.png',fullPage:true});}}
 async function login(who){await page.addInitScript(()=>{if(location.pathname==='/auth/login')localStorage.clear();});await page.goto(f.webBase+'/auth/login');await page.getByLabel('E-posta Adresi').fill(who+'@example.invalid');await page.getByLabel('Şifre',{exact:true}).fill(f.password);await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();await page.waitForURL('**/dashboard');}
 async function write(path,body={},method='POST'){return page.evaluate(async({path,body,method})=>{const token=JSON.parse(localStorage.getItem('auth-storage')).state.token;const r=await fetch('http://localhost:4005/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});return r.status;},{path,body,method});}
 await test('president-removal-owner-history-and-unknown-baseline',async()=>{
  await login('president');await page.goto(f.webBase+'/groups/'+f.ids.group);const applicant=page.locator('tr').filter({hasText:'Browser applicant'}).first();await applicant.getByRole('button',{name:'Reddet',exact:true}).click();await applicant.waitFor({state:'detached'});
  await login('applicant');await page.goto(f.webBase+'/membership-history');await page.getByText('İşlemi yapan: Browser president',{exact:true}).waitFor();await page.getByText('İşlem: Üyelik bağlantısı silindi',{exact:true}).waitFor();await page.getByText('İşlemi yapan: Kaydedilmemiş',{exact:true}).waitFor();
  await page.getByText('İşlem kaydı kimliği',{exact:true}).click();check(/^[0-9a-f-]{36}$/.test(await page.locator('code').innerText()),'Missing transaction operation ID');
 });
 await test('application-and-admin-transfer-provenance',async()=>{
  const ready=await page.request.post(f.controlBase+'/history-application-ready',{headers:{'x-fixture-key':f.secret}});check(ready.status()===200,'Eligible fixture preparation failed');
  check(await write('/groups/'+f.ids.group+'/join')===200,'Applicant API join failed');await page.getByRole('button',{name:'Geçmişi Yenile'}).click();await page.getByText('İşlemi yapan: Browser applicant',{exact:true}).waitFor();await page.getByText('İşlem: Grup başvurusu',{exact:true}).waitFor();
  await login('admin');check(await write('/admin/move-member',{userId:f.ids.applicant,groupId:f.ids.emptyGroup})===200,'Transfer setup failed');await page.goto(f.webBase+'/admin/membership-history/'+f.ids.applicant);await page.getByText('İşlemi yapan: Browser admin',{exact:true}).waitFor();await page.getByText('İşlem: Grup taşıma',{exact:true}).waitFor();
 });
 await test('invalid-provenance-is-not-rendered',async()=>{
  const target='**/api/admin/membership-history/'+f.ids.applicant;await page.route(target,async route=>{const response=await route.fetch({url:f.apiBase+new URL(route.request().url()).pathname});const body=await response.json();body.events[0].operation_context={actorId:'invalid',actorName:'Fake Actor',action:'SHUFFLE',operationId:f.ids.group};return route.fulfill({response,json:body});});
  await page.getByRole('button',{name:'Geçmişi Yenile'}).click();await page.getByRole('alert').filter({hasText:'Grup üyelik geçmişi yüklenemedi'}).waitFor();check(await page.getByText('Fake Actor',{exact:false}).count()===0,'Invalid actor was displayed');await page.unroute(target);await page.getByRole('button',{name:'Geçmişi Yenile'}).click();await page.getByText('İşlem: Grup taşıma',{exact:true}).waitFor();
 });
 await test('deleted-subject-history-preserves-actor',async()=>{
  check(await write('/admin/members/'+f.ids.applicant,{},'DELETE')===200,'Deletion setup failed');await page.getByRole('button',{name:'Geçmişi Yenile'}).click();await page.getByText('İşlem: Hesap silme',{exact:true}).first().waitFor();check(await page.getByText('İşlemi yapan: Browser admin',{exact:true}).count()>=2,'Deletion actor snapshot missing');
 });
 await test('ordinary-user-cannot-read-admin-history',async()=>{await login('member');await page.goto(f.webBase+'/admin/membership-history/'+f.ids.applicant);await page.getByText('Bu ekran için yönetici yetkisi gerekir.',{exact:true}).waitFor();check(await page.getByText('İşlemi yapan: Browser admin',{exact:true}).count()===0,'Previous owner actor leaked');});
 return {cases,passed:cases.filter(c=>c.status==='PASS').length,failed:cases.filter(c=>c.status==='FAIL').length};
}
