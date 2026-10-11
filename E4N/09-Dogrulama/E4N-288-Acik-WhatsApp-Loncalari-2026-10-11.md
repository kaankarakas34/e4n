# E4N-288 — Açık WhatsApp loncaları

Linear: https://linear.app/e4n/issue/E4N-288/ic-lonca-modulunu-kaldir-ve-whatsapp-loncalarini-herkese-ac

## Karar ve kapsam
Loncalar, uygulama içi üyelik ve yönetim modülü yerine herkese açık WhatsApp topluluklarıdır. `/topluluklarimiz` anonim erişime açıktır; 2 genel topluluk ve 8 sektörel lonca için mevcut doğrudan davet bağlantıları görünür. Normal kapalı iş grupları, grup yönetici rolleri, başvurular, toplantı ve yoklamalar korunur.

## Uygulama
- Topluluk sayfasının oturum kapısı kaldırıldı; kayıt veya giriş gerekmez.
- İç lonca liste/katılım/yönetim ekranları ve yönetici sayaçları kaldırıldı. Kullanılmayan PowerTeams sayfası silindi. Referans ve faaliyet katılımcı kapsamı kapalı gruplarla sınırlandı.
- Eski `/power-teams`, `/power-teams/:id` ve `/admin/power-teams/:id` adresleri açık topluluk sayfasına yönlendirilir.
- JSON ve form ayrıştırıcılarından sonra, bütün API yönlendiricilerinden önce emeklilik kapısı çalışır. İç lonca API’leri, POWER_TEAM rol atamaları ve lonca bağlamında yeni yazmalar 410 / INTERNAL_GUILDS_RETIRED döndürür. Büyük/küçük harf ve son eğik çizgi varyantları kapsanır.
- Eski lonca üyelikleri artık `/user/friends` erişim kapsamını genişletmez. Veritabanı geçmişi silinmedi; aktif platform/grup yönetici rolleri değiştirilmedi.
- Mobil grup keşfi, yönetim, referanslar ve menü de iç lonca akışlarından arındırıldı. Eski mobil lonca detay bağlantısı veri okumaz.

## Doğrulama
- Web tip kontrolü ve üretim derlemesi: başarılı.
- Mobil TypeScript kontrolü: başarılı; cihaz/APK testi yapılmadı.
- `node server/test/retired-guilds.mjs`: 48 eski lonca isteği işleyicilerden önce engellendi; 5 normal grup isteği korundu.
- `node server/test/admin-group-catalog-contract.mjs`: izole PostgreSQL/Express kataloğu başarılı; liste, mevcut rol, yetki ve sayım sınırları doğrulandı.
- `node server/test/group-meeting-attendance-contract.mjs`: izole PostgreSQL/Express toplantı ve yoklama akışı başarılı; yetki, eşzamanlılık, geçmiş ve yeniden deneme kontrolü geçti.
- Playwright: anonim oturumda 10 doğrudan davet; üç eski adresin yönlendirmesi başarılı. Görsel: `output/playwright/public-whatsapp.png`. Davetlerin WhatsApp tarafındaki geçerliliği/katılım onayı sınanmadı.

## Teslim sınırı
Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`. Ana e4n2 ve Overseas checkout’larına dokunulmadı. Mobil alt depoda önceden mevcut çalışmalar korundu; bu pakette ilgili kaynak dosyalarına hedefli düzenleme yapıldı. Canlı dağıtım, canlı DB yazması veya mobil mağaza yayını yapılmadı.


## 11 Ekim — GitHub push ve yayın engeli
- Kullanıcı GitHub push üzerinden canlı yayın istedi; Antigravity değişiklikleri korunacak. Parent 4d59990 üzerine 491ff662d281ab41273da3899f8ca2fb877fd1f4 main’e fast-forward push edildi. Root kaynak temiz; mevcut dirty mobile submodule commit’e dahil değil. Build ve retirement contract PASS.
- Vercel GitHub gitSource(main, tam SHA) production isteği 400: Hobby planı mevcut */10 * * * * event-completion cron’unu kabul etmiyor. Cron e2d8adb ile daha önce eklenmiş; kullanıcı seçimi bekleniyor: Pro ile 10 dakika korunsun veya günlük sıklık onayı. Kendiliğinden cron değişikliği yok.
- Canlı hâlâ dpl_DkkJWrXQ7EQkmrTzGGT5WSKDKRK1 / bad2bbe; lonca kaldırma henüz canlı değil. Sonraki: kullanıcı kararı ardından GitHub kaynaklı deployment, production READY/SHA doğrulama ve output/playwright/verify-guild-live.mjs + scripts/verify-public-guilds.mjs ile anonim canlı kontrol.


## 11 Ekim — Canlı yayın tamamlandı
- Kullanıcı günlük event-completion sıklığını açıkça seçti ve devamı onayladı. vercel.json tek satır değişikliği 4f3d8b6a2edf05c0d3fd8ac286211f968d4130cd commit’iyle GitHub main’e fast-forward push edildi. 0 5 * * * UTC: Hobby saat esnekliğiyle Türkiye 08.00–08.59; subscription-reminders değişmedi.
- GitHub main/tam SHA kaynağından Vercel production dpl_69iwAcC8V16oRLiYDGu7mZbBQxSs READY; www.event4network.com ve event4network.com aliasları bu yayında. Önceki main/Antigravity geçmişi korundu; force push yok. Mobil yayın kapsam dışı.
- Canlı PASS: anonim tarayıcıda 10 doğrudan WhatsApp daveti, eski üç lonca web adresi açık topluluk sayfasına yönleniyor; 5 eski lonca API yolu + POWER_TEAM rol yazması 410; normal grup ve admin üyeler 401 ile korunuyor. Ana sayfa/login/hakkımızda 200. Canlı asset /assets/index-C8a1LFyM.js. Kanıt output/playwright/guild-live-verification.json ve public-whatsapp.png. Özel hesap işlemleri için kapsamlı regresyon veya cron’un fiilî günlük çalışması doğrulanmadı; canlı DB yazması/migration uygulanmadı.
- E4N-288 uygulama ve web canlı yayın tamamlandı. Overseas S11 ayrı; sıradaki NAV-04 header için kullanıcı onayı şartı geçerli, yeni görev otomatik başlatılmadı.
