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
