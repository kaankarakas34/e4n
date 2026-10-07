async page=>{
  const f=/*E4N_BROWSER_FIXTURE*/null;
  if(!f)throw Error('Inject the disposable fixture descriptor first');
  const cases=[],requests=[],pageErrors=[],external=[];
  await page.unroute('**/*');
  page.on('pageerror',e=>pageErrors.push(e.message));
  // CLI owns native dialogs; use deterministic confirmation in this local fixture.
  await page.addInitScript(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await page.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.origin==='http://localhost:4005'){
      const r=await route.fetch({url:f.apiBase+u.pathname+u.search});
      requests.push({method:req.method(),path:u.pathname,status:r.status()});
      return route.fulfill({response:r});
    }
    if(u.origin===f.webBase)return route.continue();
    external.push(u.origin+u.pathname);return route.abort();
  });
  const check=(condition,message)=>{if(!condition)throw Error(message);};
  async function test(name,action){const start=requests.length,errorStart=pageErrors.length;try{await action();await page.waitForLoadState('networkidle');check(pageErrors.length===errorStart,'Uncaught page error: '+pageErrors.slice(errorStart).join(';'));check(!requests.slice(start).some(r=>r.status>=500),'Unexpected API 5xx');await page.screenshot({path:f.runDir+'/'+name+'.png',fullPage:true});cases.push({name,status:'PASS',requests:requests.slice(start)});}catch(e){cases.push({name,status:'FAIL',error:e.message,requests:requests.slice(start)});await page.screenshot({path:f.runDir+'/'+name+'-failed.png',fullPage:true}).catch(()=>{});}}
  async function login(actor){
    // Clear the previous actor before React/session hydration can redirect login.
    await page.addInitScript(({actor})=>{const key='e4n-fixture-login-reset-'+actor;if(!sessionStorage.getItem(key)){localStorage.clear();sessionStorage.setItem(key,'1');}},{actor});
    await page.goto(f.webBase+'/auth/login');await page.getByLabel('E-posta Adresi').fill(actor+'@example.invalid');await page.getByLabel('Şifre',{exact:true}).fill(f.password);await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();await page.waitForURL('**/dashboard');await page.getByText('Browser '+actor,{exact:true}).first().waitFor();
  }
  async function visit(url,heading){await page.goto(f.webBase+url);await page.getByRole('heading',{name:heading,exact:true}).first().waitFor();}
  await test('admin-login',()=>login('admin'));
  await test('application-styles-loaded',async()=>{
    const styles=await page.evaluate(()=>{
      const probe=document.createElement('div');probe.className='hidden fixed p-4';document.body.append(probe);
      const css=getComputedStyle(probe),result={display:css.display,position:css.position,padding:css.paddingTop};probe.remove();return result;
    });
    check(styles.display==='none'&&styles.position==='fixed'&&styles.padding==='16px','Application Tailwind styles are missing');
  });
  for(const [name,url,heading] of [
    ['admin-dashboard','/dashboard','Admin Panel'],['admin-reports','/admin/reports','Yönetici Raporları'],
    ['admin-members','/admin/members','Üye Hesap Dizini'],['admin-visitors','/admin/visitors','Ziyaretçi Başvuruları'],
    ['admin-accounting','/admin/accounting','Muhasebe & Fatura Yönetimi'],['admin-group-catalog','/admin/groups','Grup Yönetimi'],
  ])await test(name,()=>visit(url,heading));
  await test('admin-membership-records-owned-detail',async()=>{
    await visit('/admin/membership-records','Üyelik ve Ödeme Kayıtları');
    await page.getByText(/Hesaba bağlanmamış ödeme kaydı: 1/).waitFor();
    await page.getByRole('button',{name:'Hesap kayıtlarını göster: Browser member',exact:true}).click();
    await page.getByRole('heading',{name:'Kayıtlı Hesap ve Üyelik',exact:true}).waitFor();
    await page.getByText('Hesap durumu: ACTIVE · Plan: LEGACY_PLAN',{exact:true}).waitFor();
    await page.getByRole('cell',{name:'browser-owned-membership',exact:true}).waitFor();
    await page.getByRole('cell',{name:'120.50',exact:true}).waitFor();
    check(await page.getByText('browser-unowned-payment',{exact:true}).count()===0,'Unowned transaction inferred as membership');
  });
  await test('admin-event-participant-count',async()=>{
    await visit('/admin/events','Etkinlik Yönetimi');await page.getByText('2 / 50 katılımcı',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Katılımcılar',exact:true}).click();await page.getByText('Browser member',{exact:true}).last().waitFor();await page.getByText('Browser president',{exact:true}).last().waitFor();
  });
  await test('admin-group-capacity-rejection',async()=>{
    await page.goto(f.webBase+'/admin/groups/'+f.ids.group);await page.getByText('35 / 35 üye · 1 başkan',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Onayla',exact:true}).click();await page.getByRole('alert').filter({hasText:'Grup dolu:'}).waitFor();
    check(await page.getByRole('button',{name:'Onayla',exact:true}).count()===1,'Failed admission hid applicant');
    for(const tab of ['Yoklama','Ziyaretçiler','Yönlendirmeler','Genel Bakış'])await page.getByRole('button',{name:tab,exact:true}).click();
    check(requests.some(r=>r.method==='PUT'&&r.status===409),'No real capacity rejection response');
  });
  await test('admin-document-upload',async()=>{
    await visit('/documents','Doküman Merkezi');await page.getByRole('button',{name:'Doküman Yükle',exact:true}).click();
    await page.getByLabel('Başlık',{exact:true}).fill('Browser Shared Contract');
    await page.getByLabel(/Dosya \(PDF/).setInputFiles({name:'browser-contract.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nBrowser isolated contract\n%%EOF')});
    await page.getByRole('button',{name:'Yükle',exact:true}).click();await page.getByRole('heading',{name:'Browser Shared Contract',exact:true}).waitFor();
  });
  await test('admin-member-profile-history',async()=>{
    await page.goto(f.webBase+'/admin/members/'+f.ids.member);await page.getByText('Browser member',{exact:true}).last().waitFor();
    await page.getByRole('heading',{name:'Son 1\'e 1 Görüşmeler',exact:true}).waitFor();
    check(await page.getByText('Browser president ile Görüşme',{exact:true}).count()===3,'Latest meeting history missing');
    await page.getByText(/Aşağıdaki sayılar tüm kayıt geçmişini kapsar/).waitFor();
    await page.getByText('Aktif gruplar: Browser Full Group',{exact:true}).waitFor();
    check(await page.getByText('Liderler Global',{exact:true}).count()===0,'Hardcoded group displayed');
  });
  await test('admin-shuffle-current-records',async()=>{
    await visit('/admin/shuffle','Grup Shuffle Yönetimi');
    await page.getByRole('heading',{name:'Mevcut Aktif Grup Üyelikleri',exact:true}).waitFor();
    await page.getByText('Grup durumu: ACTIVE · 36 Üye',{exact:true}).waitFor();
    await page.getByText('Grup durumu: ACTIVE · 0 Üye',{exact:true}).waitFor();
    await page.getByRole('heading',{name:'Aktif Grubu Olmayan Üyeler (1)',exact:true}).waitFor();
    check(await page.getByRole('button',{name:'Dağıtımı Kaydet',exact:true}).isDisabled(),'Current records enabled save without a draft');
    check(await page.getByText(/Planlanan Shuffle:/).count()===0,'Invented schedule is still displayed');
  });
  await test('admin-shuffle-preview-no-write',async()=>{
    await page.getByRole('button',{name:'Yerinde kilitle: Browser member',exact:true}).click();
    await page.getByRole('button',{name:'Dağıtım Taslağı Hazırla',exact:true}).click();
    await page.getByRole('heading',{name:'Dağıtım Taslağı',exact:true}).waitFor();
    check(await page.getByRole('button',{name:'Dağıtımı Kaydet',exact:true}).isEnabled(),'Valid draft could not be saved');
    check(await page.getByRole('button',{name:'Kilidi aç: Browser member',exact:true}).count()===1,'Locked member lost');
    check(!requests.some(r=>r.path==='/api/shuffle/save'),'Preview wrote to API');
  });
  await test('admin-shuffle-stale-draft-rejected',async()=>{
    const changed=await page.request.post(f.controlBase+'/shuffle-stale',{headers:{'x-fixture-key':f.secret}});check(changed.ok(),'Could not create isolated stale-data condition');
    await page.getByRole('button',{name:'Dağıtımı Kaydet',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Kayıtlar değişmiş'}).waitFor();
    check(requests.some(r=>r.path==='/api/shuffle/save'&&r.status===409),'No actual stale draft rejection');
    check(!requests.some(r=>r.path==='/api/shuffle/notify'),'Missing notification route was called');
    await page.getByRole('button',{name:'Güncel Dağılımı Yükle',exact:true}).click();
    await page.getByText('Grup durumu: ACTIVE · 36 Üye',{exact:true}).waitFor();
    check(await page.getByRole('button',{name:'Dağıtımı Kaydet',exact:true}).isDisabled(),'Stale rejection retained a savable draft');
  });
  await test('admin-shuffle-success-and-history',async()=>{
    await page.getByRole('button',{name:'Dağıtım Taslağı Hazırla',exact:true}).click();
    await page.getByRole('button',{name:'Dağıtımı Kaydet',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Dağıtım kaydedildi.'}).waitFor();
    await page.getByRole('button',{name:'Kayıt Geçmişi',exact:true}).click();
    await page.getByRole('heading',{name:'Shuffle Kayıt Geçmişi',exact:true}).waitFor();
    await page.getByRole('button',{name:/Dağıtım ayrıntısı /}).click();
    await page.getByRole('heading',{name:'Kaydedilen Önceki ve Sonraki Yerleşim',exact:true}).waitFor();
    const presidentRow=page.getByRole('row').filter({hasText:'Browser president'});
    await presidentRow.getByRole('cell',{name:'PRESIDENT',exact:true}).waitFor();
    await presidentRow.getByRole('cell',{name:'MEMBER',exact:true}).waitFor();
    await page.getByRole('button',{name:'Geçmişi Yenile',exact:true}).click();
    await page.getByRole('button',{name:/Dağıtım ayrıntısı /}).waitFor();
    check(await page.getByRole('button',{name:/Dağıtım ayrıntısı /}).count()===1,'Duplicate history on refresh');
  });
  await test('admin-web-job-history-and-run',async()=>{
    await visit('/admin/web-jobs','Web İşlemleri ve Çalışma Geçmişi');
    await page.getByText('Henüz çalışma kaydı yok.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Etkinlik Tamamlama Çalıştır',exact:true}).click();
    await page.getByRole('status').filter({hasText:'İş tamamlandı.'}).waitFor();
    await page.getByRole('cell',{name:'Tamamlandı',exact:true}).waitFor();
    await page.getByRole('cell',{name:'Yönetici',exact:true}).waitFor();
    await page.getByText('Güncellenen etkinlik: 0',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Geçmişi Yenile',exact:true}).click();
    await page.getByRole('cell',{name:'Tamamlandı',exact:true}).waitFor();
    check(requests.filter(r=>r.path==='/api/admin/web-jobs/event-completion/run').length===1,'Refresh retriggered the job');
  });
  await test('member-login',()=>login('member'));
  await test('member-web-job-history-hidden',async()=>{
    await page.goto(f.webBase+'/admin/web-jobs');
    await page.getByText('Bu ekran için yönetici yetkisi gerekir.',{exact:true}).waitFor();
    check(await page.getByRole('table').count()===0,'Previous admin execution history visible');
  });
  await test('member-membership-records-and-invoice',async()=>{
    await visit('/membership-records','Üyelik ve Ödeme Kayıtlarım');
    await page.getByText('Hesap durumu: ACTIVE · Plan: LEGACY_PLAN',{exact:true}).waitFor();
    await page.getByRole('cell',{name:'browser-owned-membership',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Üyelik Hatırlatma Kayıtları',exact:true}).waitFor();
    await page.getByRole('cell',{name:'UNKNOWN',exact:true}).waitFor();
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Faturayı indir: browser-membership.pdf',exact:true}).click();check((await download).suggestedFilename()==='browser-membership.pdf','Wrong membership invoice filename');
    check(await page.getByText('browser-unowned-payment',{exact:true}).count()===0,'Unowned transaction disclosed');
  });
  await test('member-admin-membership-records-hidden',async()=>{
    await page.goto(f.webBase+'/admin/membership-records');await page.getByText('Bu ekran için yönetici yetkisi gerekir.',{exact:true}).waitFor();check(await page.getByRole('table').count()===0,'Previous administrator membership records visible');
  });
  await test('member-shuffle-history-hidden',async()=>{
    await page.goto(f.webBase+'/admin/shuffle-history');await page.getByText('Bu ekran için yönetici yetkisi gerekir.',{exact:true}).waitFor();check(await page.getByRole('table').count()===0,'Previous shuffle detail leaked');
  });
  for(const [name,url,heading] of [
    ['member-reports','/reports','Kişisel Aktivite Raporu'],['member-groups','/chapter-management','Gruplarım ve Ağ'],
    ['member-activities-calendar','/activities','Aktivite Merkezi'],['member-documents','/documents','Doküman Merkezi'],
  ])await test(name,()=>visit(url,heading));
  await test('member-calendar-event-data',async()=>{
    await visit('/activities','Aktivite Merkezi');const calendar=page.getByRole('region',{name:'Aktivite takvimi'});
    const day=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+2);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');});
    await calendar.getByRole('button',{name:day,exact:true}).click();await calendar.getByText('Browser Participant Event',{exact:true}).waitFor();
  });
  await test('member-event-registration-view',async()=>{
    await page.goto(f.webBase+'/events');await page.getByText('Browser Participant Event',{exact:true}).waitFor();await page.getByText('Kayıtlısınız',{exact:true}).waitFor();
    await page.getByRole('button',{name:/Katılacağım Etkinlikler/}).click();await page.getByText('Browser Participant Event',{exact:true}).waitFor();
  });
  await test('member-document-download',async()=>{
    await visit('/documents','Doküman Merkezi');const card=page.getByRole('article').filter({hasText:'Browser Shared Contract'});await card.waitFor();
    const download=page.waitForEvent('download');await card.getByRole('button',{name:'İndir',exact:true}).click();check((await download).suggestedFilename()==='browser-contract.pdf','Wrong download filename');
  });
  await test('member-message-send',async()=>{
    await page.goto(f.webBase+'/messages?recipient='+f.ids.president);await page.getByLabel('Mesaj metni',{exact:true}).waitFor();
    await page.getByLabel('Mesaj metni',{exact:true}).fill('Browser local message');await page.getByRole('button',{name:'Gönder',exact:true}).click();await page.getByRole('paragraph').filter({hasText:/^Browser local message$/}).waitFor();
  });
  await test('member-admin-data-hidden',async()=>{
    await page.goto(f.webBase+'/admin/groups');await page.getByRole('heading',{name:'Erişim Kısıtlı',exact:true}).waitFor();check(await page.getByRole('article').count()===0,'Previous admin catalog visible');
  });
  await test('member-private-profile-denied',async()=>{
    await page.goto(f.webBase+'/admin/members/'+f.ids.president);await page.getByRole('alert').filter({hasText:'Üye bilgileri yüklenemedi'}).waitFor();
    check(await page.getByRole('heading',{name:'Son 1\'e 1 Görüşmeler',exact:true}).count()===0,'Previous target private metrics visible');
  });
  const failed=cases.filter(r=>r.status==='FAIL').length;
  return {scope:'Full application browser against disposable actual Express/PostgreSQL, existing flows only',cases,passed:cases.length-failed,failed,pageErrors,externalBlocked:[...new Set(external)],requests,releaseReady:false,productionWrites:false,realMail:false,realPayment:false};
}
