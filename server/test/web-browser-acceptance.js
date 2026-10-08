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
    await page.addInitScript(()=>{if(location.pathname==='/auth/login')localStorage.clear();});
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
    await page.getByText('Kayıtlı — yoklama yapılmadı',{exact:true}).waitFor();
    await page.getByText('PRESENT — yoklama ayrıntısını açın',{exact:true}).waitFor();
  });
  await test('admin-event-new-booking-is-not-attendance',async()=>{
    await page.goto(f.webBase+'/event/'+f.ids.event);
    await page.getByRole('button',{name:'Hemen Kayıt Ol',exact:true}).click();
    await page.getByText('Kayıtlısınız',{exact:true}).waitFor();
    await page.reload();await page.getByText('Kayıtlısınız',{exact:true}).waitFor();
    check(requests.filter(r=>r.path==='/api/events/'+f.ids.event+'/register'&&r.method==='POST').length===1,'Reload repeated the registration');
    await visit('/admin/events','Etkinlik Yönetimi');await page.getByText('3 / 50 katılımcı',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Katılımcılar',exact:true}).click();await page.getByText('Browser admin',{exact:true}).last().waitFor();
    check(await page.getByText('Kayıtlı — yoklama yapılmadı',{exact:true}).count()===2,'New booking incorrectly marked present');
    await page.getByText('PRESENT — yoklama ayrıntısını açın',{exact:true}).waitFor();
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
    for(const name of ['Browser member','Browser president']){const lock=page.getByRole('button',{name:'Yerinde kilitle: '+name,exact:true});if(await lock.count())await lock.click();}
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
  await test('admin-group-membership-history',async()=>{
    await visit('/admin/membership-history/'+f.ids.member,'Grup Üyelik Geçmişi');
    await page.getByRole('button',{name:'Daha Eski Kayıtları Yükle',exact:true}).click();
    await page.getByRole('heading',{name:'Bağlantı eklendi',exact:true}).first().waitFor();
    await page.getByRole('heading',{name:'Bağlantı değişti',exact:true}).first().waitFor();
    check(await page.getByRole('article').count()>=3,'Shuffle changes did not persist in membership history');
    check(requests.some(r=>r.path==='/api/admin/membership-history/'+f.ids.member&&r.status===200),'No actual authorized history request');
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
  await test('member-group-membership-history',async()=>{
    await page.getByRole('button',{name:'Grup Üyelik Geçmişini Gör',exact:true}).click();
    await page.getByRole('heading',{name:'Grup Üyelik Geçmişim',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Bağlantı değişti',exact:true}).first().waitFor();
    await page.getByRole('button',{name:'Daha Eski Kayıtları Yükle',exact:true}).click();await page.getByRole('heading',{name:'Bağlantı eklendi',exact:true}).first().waitFor();
    check(await page.getByRole('article').count()>50,'Own history did not include shuffle changes');
    check(await page.getByText('Browser president',{exact:true}).count()===0,'Another owner appeared in personal history');
    await page.getByRole('button',{name:'Geçmişi Yenile',exact:true}).click();await page.getByRole('button',{name:'Daha Eski Kayıtları Yükle',exact:true}).waitFor();check(await page.getByRole('article').count()===50,'Refresh did not reset pagination');
  });
  await test('member-admin-group-membership-history-hidden',async()=>{
    await page.goto(f.webBase+'/admin/membership-history/'+f.ids.president);
    await page.getByText('Bu ekran için yönetici yetkisi gerekir.',{exact:true}).waitFor();
    check(await page.getByRole('article').count()===0,'Previous owner history retained');
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

  await test('member-support-create-and-reload',async()=>{
    await visit('/support','Destek Taleplerim');await page.getByRole('button',{name:'Yeni Destek Talebi',exact:true}).click();
    await page.getByPlaceholder('Örn: Ödeme Sorunu').fill('Browser lifecycle support');
    await page.getByPlaceholder('Sorununuzu detaylı bir şekilde açıklayınız...').fill('Browser initial support message');
    await page.getByRole('button',{name:'Gönder',exact:true}).click();await page.getByText('Browser lifecycle support',{exact:true}).first().waitFor();
    await page.reload();await page.getByText('Browser lifecycle support',{exact:true}).first().click();
    await page.getByText('Browser initial support message',{exact:true}).last().waitFor();
  });
  await test('member-referral-create-and-reload',async()=>{
    await visit('/referrals','İş Yönlendirmeleri');await page.getByRole('button',{name:'Yeni referans',exact:true}).click();
    const state=await (await page.request.get(f.controlBase+'/state',{headers:{'x-fixture-key':f.secret}})).json();
    const ownGroup=state.activeMemberships.find(m=>m.user_id===f.ids.member)?.group_id;
    const sameGroup=state.activeMemberships.some(m=>m.user_id===f.ids.president&&m.group_id===ownGroup);
    check(sameGroup,'Saved shuffle lost the two existing same-group locks');
    await page.getByLabel('Yönlendirme türü',{exact:true}).selectOption('INTERNAL');
    if(sameGroup)await page.getByLabel('Grup veya lonca',{exact:true}).selectOption('group:'+ownGroup);
    await page.getByLabel('Alıcı',{exact:true}).selectOption(f.ids.president);
    await page.getByLabel('Referans açıklaması',{exact:true}).fill('Browser lifecycle referral');
    await page.getByLabel('Tahmini iş hacmi',{exact:true}).fill('125.50');
    await page.getByRole('button',{name:'Referansı gönder',exact:true}).click();
    await page.getByRole('button',{name:'Gönderdiklerim',exact:true}).click();
    await page.getByText('Browser lifecycle referral',{exact:true}).waitFor();await page.reload();await page.getByText('Browser lifecycle referral',{exact:true}).waitFor();
    check(await page.getByRole('button',{name:/^Başarılı:/}).count()===0,'Sender can settle received business');
  });
  await test('member-meeting-request-create-and-reload',async()=>{
    await page.goto(f.webBase+'/profile/'+f.ids.president);await page.getByRole('button',{name:'1-e-1 Toplantı Planla',exact:true}).click();
    await page.getByLabel('Toplantı Konusu',{exact:true}).fill('Browser lifecycle meeting');
    await page.getByLabel('Tarih',{exact:true}).fill('2099-01-20');await page.getByLabel('Saat',{exact:true}).fill('15:30');
    await page.getByRole('button',{name:'İsteği Gönder',exact:true}).click();
    await visit('/meetings','Toplantı Talepleri');await page.getByRole('heading',{name:'Browser lifecycle meeting',exact:true}).waitFor();
    check(await page.getByRole('button',{name:'Kabul Et',exact:true}).count()===0,'Sender can accept own request');
    await page.reload();await page.getByRole('heading',{name:'Browser lifecycle meeting',exact:true}).waitFor();
  });
  await test('president-login',()=>login('president'));
  await test('receiver-referral-settle-and-reload',async()=>{
    await visit('/referrals','İş Yönlendirmeleri');await page.getByRole('button',{name:'Aldıklarım',exact:true}).click();
    const card=page.getByRole('article').filter({hasText:'Browser lifecycle referral'});await card.waitFor();
    await card.getByRole('textbox',{name:/^Ciro:/}).fill('120.50');await card.getByRole('button',{name:/^Başarılı:/}).click();
    await card.getByText('Başarılı',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Aldıklarım',exact:true}).click();
    await page.getByRole('article').filter({hasText:'Browser lifecycle referral'}).getByText('Başarılı',{exact:true}).waitFor();
    check(await page.getByRole('button',{name:/^Başarılı:/}).count()===0,'Settlement remained writable');
  });
  await test('receiver-meeting-accept-and-reload',async()=>{
    await visit('/meetings','Toplantı Talepleri');await page.getByRole('heading',{name:'Browser lifecycle meeting',exact:true}).waitFor();
    await page.getByRole('button',{name:'Kabul Et',exact:true}).click();await page.getByRole('button',{name:'Takvime Ekle',exact:true}).waitFor();
    await page.reload();await page.getByRole('button',{name:'Takvime Ekle',exact:true}).waitFor();
    check(await page.getByRole('button',{name:'Kabul Et',exact:true}).count()===0,'Accepted request remained actionable');
  });
  await test('unrelated-account-login',()=>login('applicant'));
  await test('unrelated-account-lifecycle-data-hidden',async()=>{
    await visit('/referrals','İş Yönlendirmeleri');await page.getByRole('button',{name:'Referansları yenile',exact:true}).click();await page.waitForLoadState('networkidle');
    check(await page.getByText('Browser lifecycle referral',{exact:true}).count()===0,'Foreign outgoing referral visible');
    await page.getByRole('button',{name:'Aldıklarım',exact:true}).click();check(await page.getByText('Browser lifecycle referral',{exact:true}).count()===0,'Foreign incoming referral visible');
    await visit('/meetings','Toplantı Talepleri');await page.getByText('Henüz bir toplantı talebi bulunmuyor.',{exact:true}).waitFor();
    check(await page.getByRole('heading',{name:'Browser lifecycle meeting',exact:true}).count()===0,'Foreign meeting request visible');
    await visit('/support','Destek Taleplerim');await page.getByText('Henüz bir destek talebiniz yok.',{exact:true}).waitFor();
    check(await page.getByText('Browser lifecycle support',{exact:true}).count()===0,'Foreign support ticket visible');
  });
  await test('admin-support-login',()=>login('admin'));
  await test('admin-support-answer-close-and-reload',async()=>{
    await page.goto(f.webBase+'/admin/support');await page.getByText('Browser lifecycle support',{exact:true}).first().click();
    const reply=page.getByPlaceholder('Yanıtınız...');await reply.fill('Browser administrator support answer');await reply.locator('..').getByRole('button').click();
    await page.getByText('Browser administrator support answer',{exact:true}).last().waitFor();
    await page.getByRole('button',{name:'Talebi Kapat',exact:true}).click();await page.getByRole('button',{name:'Tekrar Aç',exact:true}).waitFor();
    await page.reload();await page.getByText('Browser lifecycle support',{exact:true}).first().click();await page.getByRole('button',{name:'Tekrar Aç',exact:true}).waitFor();
  });
  await test('member-support-return-login',()=>login('member'));
  await test('member-support-closed-read-and-no-reply',async()=>{
    await visit('/support','Destek Taleplerim');await page.getByText('Browser lifecycle support',{exact:true}).first().click();
    await page.getByText('Browser administrator support answer',{exact:true}).last().waitFor();
    check(await page.getByPlaceholder('Bir mesaj yazın...').count()===0,'Closed ticket still accepts a reply');
  });

  await test('admin-attendance-return-login',()=>login('admin'));
  async function openAttendance(title){await visit('/admin/events','Etkinlik Yönetimi');const card=page.getByText(title,{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');await card.getByRole('button',{name:'Katılımcılar',exact:true}).click();await page.getByRole('button',{name:'Yoklama ve geçmiş',exact:true}).click();await page.getByRole('heading',{name:'Etkinlik yoklaması ve düzeltme geçmişi',exact:true}).waitFor();await page.getByText(title+' · 2 kayıt · 0 yönetici tarafından kaydedilmiş katılım',{exact:true}).waitFor();}
  await test('admin-attendance-observe-lost-ack-recovery',async()=>{
    const seed=await fetch(f.controlBase+'/attendance-seed',{method:'POST',headers:{'x-fixture-key':f.secret}});check(seed.ok,'Attendance fixture could not seed');
    await openAttendance('Browser Attendance Event');await page.getByLabel('Yoklama katılımcısı').selectOption(f.ids.member);await page.getByLabel('Yoklama açıklaması').fill('Browser observed attendance');
    const pattern='**/api/admin/events/'+f.ids.pastEvent+'/attendance/'+f.ids.member;
    await page.route(pattern,async route=>{const req=route.request(),u=new URL(req.url());const r=await route.fetch({url:f.apiBase+u.pathname});requests.push({method:req.method(),path:u.pathname,status:r.status()});await route.abort();});
    await page.getByRole('button',{name:'Yoklamayı kaydet',exact:true}).click();await page.getByText('Yoklama kaydı doğrulandı.',{exact:true}).waitFor();await page.unroute(pattern);
    await page.getByText('Browser member — Katıldı — yönetici kaydı',{exact:false}).waitFor();
    check(requests.filter(r=>r.path==='/api/admin/events/'+f.ids.pastEvent+'/attendance/'+f.ids.member&&r.method==='PUT').length===1,'Lost ACK repeated attendance write');
  });
  await test('admin-attendance-correction-and-reload',async()=>{
    await page.getByLabel('Yoklama durumu').selectOption('ABSENT');await page.getByLabel('Yoklama açıklaması').fill('Browser attendance correction');await page.getByRole('button',{name:'Yoklamayı kaydet',exact:true}).click();await page.getByText('Yoklama kaydedildi ve kayıtlar yeniden okundu.',{exact:true}).waitFor();
    await page.reload();await openAttendance('Browser Attendance Event');await page.getByText('Browser member — Katılmadı — yönetici kaydı',{exact:false}).waitFor();await page.getByText('Browser attendance correction',{exact:false}).waitFor();await page.getByText('Browser observed attendance',{exact:false}).waitFor();
  });
  await test('admin-attendance-retract-and-registration-count',async()=>{
    await page.getByLabel('Yoklama katılımcısı').selectOption(f.ids.member);await page.getByLabel('Yoklama durumu').selectOption('REGISTERED');await page.getByLabel('Yoklama açıklaması').fill('Browser observation retracted');await page.getByRole('button',{name:'Yoklamayı kaydet',exact:true}).click();await page.getByText('Yoklama kaydedildi ve kayıtlar yeniden okundu.',{exact:true}).waitFor();
    await page.getByText('Browser member — Kayıtlı — yoklama yapılmadı',{exact:false}).waitFor();await page.getByText('Toplam 3 işlem; en son 3 işlem gösteriliyor.',{exact:true}).waitFor();await page.getByRole('button',{name:'Kapat',exact:true}).click();
  });
  await test('admin-future-event-attendance-read-only',async()=>{
    await visit('/admin/events','Etkinlik Yönetimi');const card=page.getByText('Browser Participant Event',{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');await card.getByRole('button',{name:'Katılımcılar',exact:true}).click();await page.getByRole('button',{name:'Yoklama ve geçmiş',exact:true}).click();await page.getByText('Yoklama yalnız başlamış, iptal edilmemiş etkinlik için kaydedilebilir.',{exact:true}).waitFor();check(await page.getByRole('button',{name:'Yoklamayı kaydet',exact:true}).count()===0,'Future attendance can be recorded');
  });

  await test('member-accepted-connections-login',()=>login('member'));
  const network=page.getByRole('region',{name:'Kabul edilmiş bağlantılar',exact:true});
  async function openNetwork(){await page.goto(f.webBase+'/chapter-management');await page.getByRole('button',{name:'Bağlantılarım (Network)',exact:true}).click();await network.getByRole('heading',{name:'Bağlantılarım (Network)',exact:true}).waitFor();}
  await test('accepted-connections-error-retry-and-no-common-member-substitution',async()=>{
    const seed=await fetch(f.controlBase+'/connections-seed',{method:'POST',headers:{'x-fixture-key':f.secret}});check(seed.ok,'Connection fixture failed');
    const pattern='**/api/user/connections';await page.route(pattern,route=>route.fulfill({status:500,json:{error:'Isolated read failure'}}));
    await openNetwork();await network.getByRole('alert').waitFor();check(await network.getByRole('article').count()===0,'Read error replaced by old network');
    await page.unroute(pattern);await network.getByRole('button',{name:'Bağlantıları yenile',exact:true}).click();await network.getByRole('heading',{name:'Browser admin',exact:true}).waitFor();
    check(await network.getByRole('article').count()===2,'Network must contain exactly accepted president/admin');
    check(await network.getByText('Browser applicant',{exact:true}).count()===0,'Pending connection displayed as accepted');
    check(await network.getByText(/Browser seat /).count()===0,'Common group members displayed as accepted');
    await page.getByLabel('Bağlantı ara',{exact:true}).fill('Browser admin');check(await network.getByRole('article').count()===1,'Search mismatch');await page.getByLabel('Bağlantı ara',{exact:true}).fill('missing');await network.getByText('Arama kriterlerine uygun bağlantı bulunamadı.',{exact:true}).waitFor();await page.getByLabel('Bağlantı ara',{exact:true}).fill('');
  });
  await test('accepted-connections-profile-and-message-navigation',async()=>{
    const card=network.getByRole('article').filter({hasText:'Browser admin'});await card.getByRole('link',{name:'Profili Gör',exact:true}).click();await page.waitForURL('**/profile/'+f.ids.admin);await page.getByRole('heading',{name:'Browser admin',exact:true}).waitFor();
    await openNetwork();await network.getByRole('article').filter({hasText:'Browser admin'}).getByRole('link',{name:'Mesaj',exact:true}).click();await page.waitForURL('**/messages?recipient='+f.ids.admin);await page.getByPlaceholder('Mesajınızı yazın...').waitFor();
  });
  await test('external-referral-accepted-source-lost-ack-replay-and-reload',async()=>{
    await visit('/referrals','İş Yönlendirmeleri');await page.getByRole('button',{name:'Yeni referans',exact:true}).click();await page.getByLabel('Yönlendirme türü',{exact:true}).selectOption('EXTERNAL');
    const select=page.getByLabel('Alıcı',{exact:true});await select.locator('option[value="'+f.ids.admin+'"]').waitFor({state:'attached'});
    check(await select.locator('option').count()===3,'External options must be accepted connections only');
    check(await select.locator('option[value="'+f.ids.applicant+'"]').count()===0,'Pending external recipient');await select.selectOption(f.ids.admin);await page.getByLabel('Referans açıklaması',{exact:true}).fill('Browser external connection referral');
    let once=true;const pattern='**/api/referrals';await page.route(pattern,async route=>{if(route.request().method()!=='POST'||!once)return route.fallback();once=false;const r=await route.fetch({url:f.apiBase+'/api/referrals'});requests.push({method:'POST',path:'/api/referrals',status:r.status()});await route.abort();});
    await page.getByRole('button',{name:'Referansı gönder',exact:true}).click();await page.getByRole('status').filter({hasText:'İşlem sonucu doğrulanamadı'}).waitFor();
    await page.getByRole('button',{name:'Referansı gönder',exact:true}).click();await page.getByText('Referans kaydedildi.',{exact:true}).waitFor();await page.unroute(pattern);await page.getByRole('button',{name:'Gönderdiklerim',exact:true}).click();await page.getByText('Browser external connection referral',{exact:true}).waitFor();await page.reload();await page.getByText('Browser external connection referral',{exact:true}).waitFor();
  });
  await test('accepted-connection-revocation-refresh-clears-selection',async()=>{
    await page.getByRole('button',{name:'Yeni referans',exact:true}).click();await page.getByLabel('Yönlendirme türü',{exact:true}).selectOption('EXTERNAL');const select=page.getByLabel('Alıcı',{exact:true});await select.locator('option[value="'+f.ids.admin+'"]').waitFor({state:'attached'});await select.selectOption(f.ids.admin);
    const revoke=await fetch(f.controlBase+'/connections-revoke',{method:'POST',headers:{'x-fixture-key':f.secret}});check(revoke.ok,'Revoke fixture failed');await page.getByRole('button',{name:'Üyeleri yeniden yükle',exact:true}).click();await select.locator('option[value="'+f.ids.admin+'"]').waitFor({state:'detached'});check(await select.inputValue()==='','Revoked selected recipient retained');
    await openNetwork();await network.getByRole('heading',{name:'Browser president',exact:true}).waitFor();check(await network.getByText('Browser admin',{exact:true}).count()===0,'Revoked network card retained');
  });
  await test('accepted-connections-unrelated-owner-empty',async()=>{
    await login('applicant');await openNetwork();await network.getByText('Henüz kabul edilmiş bağlantınız yok.',{exact:true}).waitFor();check(await network.getByText('Browser president',{exact:true}).count()===0,'Previous owner network retained');
    await visit('/referrals','İş Yönlendirmeleri');await page.getByRole('button',{name:'Yeni referans',exact:true}).click();await page.getByLabel('Yönlendirme türü',{exact:true}).selectOption('EXTERNAL');await page.getByText('Seçilebilir alıcı yok.',{exact:true}).waitFor();check(await page.getByLabel('Alıcı',{exact:true}).locator('option').count()===1,'Other owner external recipients leaked');
  });


  await test('admin-guild-catalog-error-retry',async()=>{
    await login('admin');await visit('/admin/groups','Grup Yönetimi');
    let first=true;await page.route('**/api/admin/power-team-settings',async route=>{if(first){first=false;return route.fulfill({status:500,contentType:'application/json',body:'{}'});}const r=await route.fetch({url:f.apiBase+'/api/admin/power-team-settings'});return route.fulfill({response:r});});
    await page.getByRole('button',{name:'Loncalar',exact:true}).click();await page.getByRole('button',{name:'Loncaları tekrar yükle',exact:true}).click();await page.getByText('Henüz hiç lonca yok.',{exact:true}).waitFor();await page.unroute('**/api/admin/power-team-settings');
  });
  await test('admin-guild-create-lost-ack-same-id-retry',async()=>{
    await page.getByRole('button',{name:'Lonca Oluştur',exact:true}).click();await page.getByLabel('Lonca Adı',{exact:true}).fill('Browser guild settings');
    let first=true;const ids=[];await page.route('**/api/power-teams',async route=>{if(route.request().method()!=='POST')return route.continue();ids.push(route.request().postDataJSON().id);const r=await route.fetch({url:f.apiBase+'/api/power-teams'});if(first){first=false;return route.abort();}return route.fulfill({response:r});});
    const modal=page.getByRole('dialog');await modal.getByRole('button',{name:'Oluştur',exact:true}).click();await modal.getByRole('button',{name:'Aynı işlemi tekrar dene',exact:true}).waitFor();check(await page.getByLabel('Lonca Adı').isDisabled(),'Pending name must stay fixed');await modal.getByRole('button',{name:'Kapat — işlem anahtarı korunur',exact:true}).click();await page.getByRole('button',{name:'Gruplar',exact:true}).click();await page.getByRole('button',{name:'Loncalar',exact:true}).click();await page.getByRole('button',{name:'Bekleyen lonca işlemini aç',exact:true}).click();await modal.getByRole('button',{name:'Aynı işlemi tekrar dene',exact:true}).click();await page.getByRole('heading',{name:'Browser guild settings',exact:true}).waitFor();check(ids.length===2&&ids[0]===ids[1],'Guild retry changed UUID');check(await page.getByRole('heading',{name:'Browser guild settings',exact:true}).count()===1,'Duplicate guild card');await page.unroute('**/api/power-teams');
    await page.getByLabel('Lonca ara').fill('bulunmayan');await page.getByText('Aramaya uygun lonca bulunamadı.',{exact:true}).waitFor();await page.getByLabel('Lonca ara').fill('BROWSER GUİLD');await page.getByRole('heading',{name:'Browser guild settings',exact:true}).waitFor();await page.screenshot({path:f.runDir+'/guild-catalog.png',fullPage:true});
  });
  await test('admin-guild-ack-list-error-retry-no-second-post',async()=>{
    await page.getByLabel('Lonca ara').fill('');await page.getByRole('button',{name:'Lonca Oluştur',exact:true}).click();await page.getByLabel('Lonca Adı').fill('Browser guild acknowledged');
    let failRead=false,posts=0;await page.route('**/api/admin/power-team-settings',async route=>{if(failRead){failRead=false;return route.fulfill({status:500,contentType:'application/json',body:'{}'});}const r=await route.fetch({url:f.apiBase+'/api/admin/power-team-settings'});return route.fulfill({response:r});});
    await page.route('**/api/power-teams',async route=>{if(route.request().method()!=='POST')return route.continue();posts++;const r=await route.fetch({url:f.apiBase+'/api/power-teams'});failRead=true;return route.fulfill({response:r});});await page.getByRole('dialog').getByRole('button',{name:'Oluştur',exact:true}).click();await page.getByText('Browser guild acknowledged kaydedildi.',{exact:true}).waitFor();await page.getByRole('button',{name:'Loncaları tekrar yükle',exact:true}).click();await page.getByRole('heading',{name:'Browser guild acknowledged',exact:true}).waitFor();check(posts===1,'List retry repeated acknowledged POST');await page.unroute('**/api/power-teams');await page.unroute('**/api/admin/power-team-settings');
  });
  await test('admin-guild-edit-canonical-save-and-reload',async()=>{
    await page.getByRole('button',{name:/Browser guild settings/}).click();await page.getByRole('button',{name:'Lonca Düzenle',exact:true}).waitFor();await page.getByRole('button',{name:'Lonca Düzenle',exact:true}).click();const modal=page.locator('div.fixed').filter({has:page.getByRole('heading',{name:'Lonca Düzenle',exact:true})});await modal.locator('input').first().fill('  Browser guild saved  ');await modal.locator('textarea').first().fill('  Canonical guild description  ');await modal.locator('input').nth(1).fill('Guild welcome subject');await modal.locator('textarea').nth(1).fill('<p>Guild welcome template</p>');await modal.getByRole('button',{name:'Kaydet',exact:true}).click();await page.getByRole('heading',{name:'Browser guild saved',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Lonca Düzenle',exact:true}).click();await modal.locator('input').first().waitFor();check(await modal.locator('input').first().inputValue()==='Browser guild saved','Canonical saved name missing');check(await modal.locator('textarea').first().inputValue()==='Canonical guild description','Canonical saved description missing');check(await modal.locator('textarea').nth(1).inputValue()==='<p>Guild welcome template</p>','Saved email template missing');await modal.getByRole('button',{name:'İptal',exact:true}).click();
  });
  await test('admin-guild-owner-switch-hidden',async()=>{
    await visit('/admin/groups','Grup Yönetimi');await page.getByRole('button',{name:'Loncalar',exact:true}).click();await page.getByRole('heading',{name:'Browser guild saved',exact:true}).waitFor();await login('member');check(await page.getByRole('heading',{name:'Browser guild saved',exact:true}).count()===0,'Admin guild settings leaked into member view');
  });

  const failed=cases.filter(r=>r.status==='FAIL').length;
  return {scope:'Full application browser against disposable actual Express/PostgreSQL, existing flows only',cases,passed:cases.length-failed,failed,pageErrors,externalBlocked:[...new Set(external)],requests,releaseReady:false,productionWrites:false,realMail:false,realPayment:false};
}
