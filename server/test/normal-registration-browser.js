async page=>{
 const f=/*E4N_BROWSER_FIXTURE*/null,cases=[],errors=[];
 page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin==='http://localhost:4005')return route.fulfill({response:await route.fetch({url:f.apiBase+url.pathname+url.search})});if(url.origin===f.webBase)return route.continue();return route.abort();});
 const check=(v,m)=>{if(!v)throw Error(m);};
 async function test(name,fn){try{await fn();check(errors.length===0,'Uncaught browser error');cases.push({name,status:'PASS'});}catch(e){cases.push({name,status:'FAIL',error:e.message});await page.screenshot({path:f.runDir+'/'+name+'-failed.png',fullPage:true});}}
 async function form(email,tax){await page.getByPlaceholder('Ad Soyad',{exact:true}).fill('Browser Signup');await page.getByPlaceholder('E-posta Adresi',{exact:true}).fill(email);await page.getByPlaceholder('05xx xxx xx xx').fill('05000000000');await page.getByLabel('Bulunduğunuz İl',{exact:true}).selectOption('İstanbul');await page.getByPlaceholder('Meslek seçmek için yazın...').fill('Synthetic Engineer');await page.getByLabel('Şirket İsmi',{exact:true}).fill('Browser Company');await page.getByLabel('VKN veya TCKN').fill(tax);await page.getByLabel('Vergi Dairesi',{exact:true}).fill('Browser Tax Office');await page.getByLabel('Fatura Adresi',{exact:true}).fill('Browser Company Address');await page.getByPlaceholder('Şifre Oluştur').fill(f.password);await page.getByPlaceholder('Şifre Tekrar').fill(f.password);await page.locator('#kvkk-consent').check();await page.locator('#explicit-consent').check();}
 await test('public-signup-login-normal-member',async()=>{
  await page.goto(f.webBase+'/auth/register');await page.getByRole('button',{name:'Üye Ol',exact:true}).waitFor();
  await form(f.signupEmail,'0000000100');
  for(const label of ['Bulunduğunuz İl','Vergi Dairesi','Fatura Adresi']){const input=page.getByLabel(label,{exact:true});check(await input.getAttribute('required')!==null,label+' not required');const saved=await input.inputValue();if(label==='Bulunduğunuz İl')await input.selectOption('');else await input.fill('');await page.getByRole('button',{name:'Üye Ol',exact:true}).click();check(await input.evaluate(el=>el.validity.valueMissing),'Empty billing field allowed');if(label==='Bulunduğunuz İl')await input.selectOption(saved);else await input.fill(saved);}
  await page.screenshot({path:f.runDir+'/normal-registration-form.png',fullPage:true});
  const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/register')&&r.request().method()==='POST');await page.getByRole('button',{name:'Üye Ol',exact:true}).click();check((await response).status()===201,'Signup failed');
  await page.getByText('Üyeliğiniz oluşturuldu',{exact:true}).waitFor();check(await page.getByText('Hemen giriş yapabilirsiniz.',{exact:false}).isVisible(),'Signup still requires approval');await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();
  await page.getByLabel('E-posta Adresi').fill(f.signupEmail);await page.getByLabel('Şifre',{exact:true}).fill(f.password);await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();await page.waitForURL('**/dashboard');
  const user=await page.evaluate(()=>JSON.parse(localStorage.getItem('auth-storage')).state.user);check(user.role==='MEMBER','Wrong role');check(user.account_status==='UNSUBSCRIBED','Signup granted subscription');await page.getByRole('link',{name:'Gruplar',exact:true}).waitFor();
 });
 await test('duplicate-tax-shows-error-no-false-success',async()=>{
  await page.evaluate(()=>localStorage.clear());await page.goto(f.webBase+'/auth/register');await form('duplicate-'+f.signupEmail,'0000000100');const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/register')&&r.request().method()==='POST');await page.getByRole('button',{name:'Üye Ol',exact:true}).click();check((await response).status()===409,'Duplicate accepted');await page.getByRole('alert').filter({hasText:'Bu vergi numarası'}).waitFor();check(await page.getByRole('button',{name:'Üye Ol',exact:true}).isEnabled(),'Retry form disabled');
 });
 await test('old-community-link-preserves-query-public-header',async()=>{
  await page.goto(f.webBase+'/auth/register-community?token=legacy-source');await page.waitForURL('**/auth/register?token=legacy-source');await page.getByLabel('VKN veya TCKN').waitFor();
  await page.evaluate(()=>localStorage.clear());await page.goto(f.webBase+'/');const link=page.getByRole('link',{name:'Üye Ol',exact:true}).first();await link.waitFor();check(await link.getAttribute('href')==='/auth/register','Wrong signup target');
 });
 return {passed:cases.filter(c=>c.status==='PASS').length,failed:cases.filter(c=>c.status==='FAIL').length,cases,productionWrites:false,realMail:false,realPayment:false};
}
