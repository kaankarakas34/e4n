async page=>{
  const f=/*E4N_BROWSER_FIXTURE*/null,cases=[],requests=[],errors=[];
  page.setDefaultTimeout(12000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin==='http://localhost:4005'){
      try{const response=await route.fetch({url:f.apiBase+url.pathname+url.search});requests.push({method:req.method(),path:url.pathname,status:response.status()});return route.fulfill({response});}
      catch{return route.abort('failed').catch(()=>{});}
    }
    if(url.origin===f.webBase)return route.continue();return route.abort();
  });
  const check=(condition,message)=>{if(!condition)throw Error(message);};
  async function test(name,action){try{const before=errors.length;await action();check(errors.length===before,'Uncaught browser error');cases.push({name,status:'PASS'});}catch(error){cases.push({name,status:'FAIL',error:error.message});await page.screenshot({path:f.runDir+'/'+name+'-failed.png',fullPage:true});}}
  async function login(who){
    await page.addInitScript(()=>{if(location.pathname==='/auth/login')localStorage.clear();});
    await page.goto(f.webBase+'/auth/login');await page.getByLabel('E-posta Adresi').fill(who+'@example.invalid');await page.getByLabel('Şifre',{exact:true}).fill(f.password);
    await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();await page.waitForURL('**/dashboard');
  }
  async function reapply(){
    await login('applicant');const result=await page.evaluate(async group=>{const token=JSON.parse(localStorage.getItem('auth-storage')).state.token;const r=await fetch('http://localhost:4005/api/groups/'+group+'/join',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});return r.status;},f.ids.group);check(result===200,'Fixture reapplication failed');
  }
  const row=name=>page.locator('tr').filter({hasText:'Browser '+name}).first();
  const memberPath='/api/groups/'+f.ids.group+'/members/';
  await test('manager-requested-visible-capacity-error',async()=>{
    await login('president');await page.goto(f.webBase+'/group-management');await page.getByRole('button',{name:/Başvurular/}).click();
    await page.getByText('Browser applicant',{exact:true}).waitFor();await page.getByRole('button',{name:'Onayla',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Grup dolu'}).waitFor();check(await page.getByRole('button',{name:'Reddet',exact:true}).isDisabled(),'Unverified operation was retryable');
    const writes=requests.filter(r=>r.method==='PUT'&&r.path===memberPath+f.ids.applicant).length;
    await page.getByRole('button',{name:'Listeyi kontrol et',exact:true}).click();await page.getByRole('button',{name:'Reddet',exact:true}).waitFor();
    check(requests.filter(r=>r.method==='PUT'&&r.path===memberPath+f.ids.applicant).length===writes,'Read reconciliation repeated mutation');
  });
  await test('manager-rejects-requested-through-delete',async()=>{
    await page.getByRole('button',{name:'Reddet',exact:true}).click();await page.getByText('Bekleyen grup katılım isteği yok.',{exact:true}).waitFor();
    check(requests.filter(r=>r.method==='DELETE'&&r.path===memberPath+f.ids.applicant&&r.status===200).length===1,'Rejection did not delete exact request once');
  });
  await test('admin-invalid-removal-ack-read-reconciliation',async()=>{
    await reapply();await login('admin');await page.goto(f.webBase+'/admin/groups/'+f.ids.group);await row('applicant').waitFor();
    const pattern='**'+memberPath+f.ids.applicant;let deletes=0;
    await page.route(pattern,async route=>{if(route.request().method()!=='DELETE')return route.fallback();deletes++;const r=await route.fetch({url:f.apiBase+memberPath+f.ids.applicant});check(r.status()===200,'Server removal failed');return route.fulfill({status:200,json:{success:true,removed:true,groupId:f.ids.group,userId:f.ids.member}});});
    try{
      await row('applicant').getByRole('button',{name:'Reddet',exact:true}).click();await page.getByRole('alert').filter({hasText:'sonucu doğrulanamadı'}).waitFor();
      check(await row('applicant').count()===1,'Invalid ACK optimistically removed applicant');check(await row('applicant').getByRole('button',{name:'Reddet',exact:true}).isDisabled(),'Unknown operation could be repeated');
      await page.getByRole('button',{name:'Listeyi kontrol et',exact:true}).click();await row('applicant').waitFor({state:'detached'});check(deletes===1,'Reconciliation repeated DELETE');
    }finally{await page.unroute(pattern);}
  });
  await test('group-detail-single-submit-lost-approval-ack',async()=>{
    // Free one confirmed existing seat, then reapply without changing target policy.
    const removed=await page.evaluate(async ({group,member})=>{const token=JSON.parse(localStorage.getItem('auth-storage')).state.token;return(await fetch('http://localhost:4005/api/groups/'+group+'/members/'+member,{method:'DELETE',headers:{Authorization:'Bearer '+token}})).status;},{group:f.ids.group,member:f.ids.member});check(removed===200,'Could not free fixture seat');
    await reapply();await login('admin');await page.goto(f.webBase+'/groups/'+f.ids.group);await row('applicant').waitFor();
    const pattern='**'+memberPath+f.ids.applicant;let puts=0;
    await page.route(pattern,async route=>{if(route.request().method()!=='PUT')return route.fallback();puts++;const r=await route.fetch({url:f.apiBase+memberPath+f.ids.applicant});check(r.status()===200,'Actual approval failed');return route.abort('failed');});
    try{
      await row('applicant').getByRole('button',{name:'Onayla',exact:true}).evaluate(button=>{button.click();button.click();});
      await page.getByRole('alert').filter({hasText:'sonucu doğrulanamadı'}).waitFor();check(puts===1,'Double click sent more than one PUT');
      check(await row('applicant').getByRole('button',{name:'Onayla',exact:true}).isDisabled(),'Unknown approval could be repeated');
      await page.getByRole('button',{name:'Listeyi kontrol et',exact:true}).click();await row('applicant').getByText('Aktif',{exact:true}).waitFor();check(puts===1,'Canonical read repeated PUT');
    }finally{await page.unroute(pattern);}
  });
  await test('group-detail-revoked-role-denies-remove',async()=>{
    // A MEMBER session cannot turn a forged persisted role into server authority.
    await login('applicant');await page.goto(f.webBase+'/groups/'+f.ids.group);await row('president').waitFor();
    await page.evaluate(async()=>{const {useAuthStore}=await import('/src/stores/authStore.ts');const store=useAuthStore.getState();useAuthStore.setState({user:{...store.user,role:'ADMIN'}});});
    await row('president').getByRole('button',{name:'Üye Çıkar',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'yetkiniz'}).waitFor();check(await row('president').count()===1,'Forbidden removal changed roster');
  });
  await test('group-detail-old-scope-ack-is-ignored',async()=>{
    await login('admin');await page.goto(f.webBase+'/groups/'+f.ids.group);await row('applicant').waitFor();
    const pattern='**'+memberPath+f.ids.applicant;let release,markStarted;
    const held=new Promise(resolve=>release=resolve),started=new Promise(resolve=>markStarted=resolve);
    await page.route(pattern,async route=>{if(route.request().method()!=='DELETE')return route.fallback();const r=await route.fetch({url:f.apiBase+memberPath+f.ids.applicant});check(r.status()===200,'Held deletion failed');markStarted();await held;return route.fulfill({response:r}).catch(()=>{});});
    try{
      await row('applicant').getByRole('button',{name:'Üye Çıkar',exact:true}).click();await started;
      for(const role of ['MEMBER','ADMIN']){
        await Promise.all([page.waitForResponse(r=>r.url().includes(memberPath.slice(0,-1))),page.evaluate(async role=>{const {useAuthStore}=await import('/src/stores/authStore.ts');const state=useAuthStore.getState();useAuthStore.setState({user:{...state.user,role}});},role)]);
        await row('president').waitFor();
      }
      const reads=requests.filter(r=>r.method==='GET'&&r.path===memberPath.slice(0,-1)).length;
      release();await page.waitForLoadState('networkidle');check(requests.filter(r=>r.method==='GET'&&r.path===memberPath.slice(0,-1)).length===reads,'Old scope ACK started a new roster read');
      check(await row('applicant').count()===0,'Old scope restored removed member');
    }finally{release();await page.unroute(pattern);}
  });
  await page.screenshot({path:f.runDir+'/group-roster-final.png',fullPage:true});
  return {cases,passed:cases.filter(c=>c.status==='PASS').length,failed:cases.filter(c=>c.status==='FAIL').length,requests};
}
