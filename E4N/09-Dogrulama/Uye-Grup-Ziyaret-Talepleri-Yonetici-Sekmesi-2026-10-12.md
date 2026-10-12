# Üyelerin grup ziyaret talepleri — 12 Ekim 2026

## Diamond görünürlük düzeltmesi

- Kullanıcının ekran görüntüsü sonrası salt okunur inceleme: canlı Diamond kaydı status=NULL,11aktif üyelik ve1başkan; keşif API'si yalnız groups.status='ACTIVE' okuyor. UI ek filtreyle Diamond'ı gizlemiyor.
- Kullanıcı “tamam yap” dedi. e4n Supabase projesinde yalnız id=97ebe739-9246-4ffb-b270-54577d092fab/name=Diamond/status IS NULL koşullu UPDATE ile status=ACTIVE yapıldı; RETURNING tek kayıt.
- Ayrı SELECT, aynı status='ACTIVE' filtresinde Diamond dahil dört grubu ve Diamond11aktif üyelik kaydını doğruladı. Kod değişikliği/deploy yapılmadı; kullanıcının panelde Yenile ile sonucu görmesi beklenir. Canlı oturumlu tarayıcı testi yapılmadı.

Kullanıcı kararı: kişi önce hesabını oluşturur, panelinden ziyaret etmek istediği gruba istek gönderir; yönetim /admin/visitors içinde görür. Eski formlarla karışması halinde ayrı sekme kullanılabilir.

## Teslim

- Mevcut GroupDiscovery → POST /user/request-visitor akışı korundu. Yeni ziyaret kayıtları artık PENDING; gönderilmeyen davet e-postası vaat edilmez. Mevcut ücretsiz iki ziyaret ve meslek/abonelik kuralları değişmedi.
- /admin/visitors varsayılan sekmesi Üyelerin Ziyaret Talepleri. Yalnız free_member_visitor kaynağını gösterir; üye/iletişim/şirket/meslek, istenen grup, not, kayıt tarihi, durum ve üye profil bağlantısı. Grup/durum filtresi, detay, yenileme, hata/tekrar ve mevcut iletişim işaretlemesi vardır. Yeni kabul/ret/grup üyeliği işlemi eklenmedi.
- GET /admin/visitor-queue?kind=member-requests sunucuda ilgili kaynağı filtreler; güncel DB ADMIN kontrolü, read-only snapshot, private/no-store ve metadata allowlist korunur. Anonim /visitors/apply bu üye istek kaynağını kullanamaz. Eğitim ve eski form kayıtları yeni sekmede görünmez; eski sekmeler korunur. visitor_free toplantı kayıtlarının filtre eksikliği de giderildi.
- Yeni tablo/migration yok; gerçek kullanıcı kaydı, gerçek mail/ödeme veya canlı DB testi yok. CONTACTED yalnız yönetici inceleme kuyruğunun iletişim durumudur; ziyaret katılımı veya grup üyeliği sağlamaz.

## Kanıt ve sınırlar

- npm run check ve npm run build PASS; route ownership 233 rota. node --check server index/queue, git diff --check PASS.
- server/test/member-visitor-admin-queue-contract.mjs PASS: gerçek request/admin HTTP handler + TypeScript DTO, üye/grup/not aktarımı, PENDING, anonim kaynak taklidi400, oturumsuz401, güncel rol403, query400, iletişim güncelleme ve hata500. DB sorgu adaptörü izoledir; gerçek PostgreSQL testi değildir. Docker kapalı olduğu için PG regresyonu çalıştırılmadı.
- free-member-visitor-flow-contract PASS.
- Playwright gerçek sayfa + izole API fixture: varsayılan sekme, iki üye isteği/eski kaydın ayrılması, grup filtresi, detay/not, profil URL, iletişim işaretleme ve GET500→Tekrar dene→veri geri dönüşü doğrulandı. Screenshot output/playwright/member-visitor-admin.png görsel incelendi. Snapshot kanıtları output/playwright/member-visitor-{detail,group-filter,contact,legacy,error,retry}.txt. Dış analitik istekleri testte engellendi.
- ESLint tam PASS değil: önceki HEAD'de de bulunan 14 no-explicit-any hatası (AdminVisitors11, API3) devam eder. Yeni hata yok; bu kural hariç hedefli lint PASS.
- Kullanıcı “Evet, bunu da canlıya al” onayı verdi. Ürün646b02a origin/main ve foundation'a push; Vercel production dpl_8nbf2Ds6dASovCyeTs3x9a3G5v5B READY, www.event4network.com/event4network.com aliasları doğrulandı. Canlı /admin/visitors HTTP200; index-CEVNzsvP.js içinde yeni sekme, member-requests, grup/durum filtre kodları mevcut. Oturumsuz queue?kind=member-requests HTTP401. Gerçek yönetici hesabı/üretim kayıtlarıyla E2E yapılmadı. Ana E4N-111 kapsamı açık; küçük sekme değişikliği için yeni teslim görevi oluşturulmadı.
