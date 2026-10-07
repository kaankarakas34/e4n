# PAR-04 — Etkinlik liste okuması ve cache

3 Ekim 2026. `fa17ead` yönetilen dala gönderildi.

eventStore okuma ayrı readLoading/readError/loadedFor taşır, yazma loading/error değerlerinden ayrıdır. Yanıt array ve geçerli kayıt biçiminde doğrulanır; bozuk/error durumunda cache korunur ama taze sayılmaz. Gerçek[] kabul edilir. Son istek sırası ve user id/rol bağlamı eski sonucun cache'e yazılmasını engeller; tazelik persist edilmez.

ADMIN mevcut getEvents(mode=admin), diğer roller ve anonim getPublicEvents yolunu kullanır. AdminEvents/AdminDashboard ADMIN olmadıkça kendi etkinlik fetch'ini başlatmaz; UserEvents oturum değişiminde yeniden okur. Mevcut public liste yayınlanmış/bitmemiş kayıtları server'dan getirir; yeni görünürlük kuralı seçilmedi.

AdminEvents ve UserEvents ilk cache/loading/error durumunda listeyi güncel gibi göstermez, alert/Tekrar dene ve yükleme vardır. AdminDashboard etkinlik sayacı hata durumunda Veri yok ve retry, taze gerçek[] sayısı0. AdminEvents optional description filtrelemesi artık null'da çökmez.

## Kanıt

Gerçek Zustand `test/event-store-write.mjs` read null/object/nullrow/eksikrow/error, cache korunması ama loadedFor=null, trueempty, MEMBER public yol ve geç eski oturum yanıtının atılması; bütün mutation regresyonları başarılı. `test/event-read-screens.mjs` üç gerçek TSX kontrollü hooks/store ile cache gizleme/hata-retry/fresh/null description başarılı. `test/admin-event-participants.mjs` önceki modal/mutation regresyonu başarılı. `npm run check` exit0/diff/push/temiz dal.

Testler gerçek API/HTTP rol veya tarayıcı/cihaz kabulü değildir. Canlı Supabase/ödeme/mail/dağıtım yok. Server rol/yazma politikası değişmedi. Read fetchErrors state'e taşınır ama fetchEvents çağırana reject etmez; mevcut effect tüketicilerinde unhandled Promise oluşturulmadı. Etkinlik özeti refresh catch özel hata mesajı gerçek readError'ı hâlâ görmez; readError UI görünürdür.

## Güvenlik girdisi

Aktif GET /events kaynakta public; mode=admin olunca bütün kayıtlar döner ve online_link sansürü mode=admin üzerinden kaldırılır. JWT/ADMIN doğrulanması bu branch için zorunlu değil. Bu kaynak bulgusu, yeni HTTP kanıtı yok; E4N-120 Sprint6 kabul girdisi. Üye istemcisini public yola bağlamak sunucu açığını kapatmaz. Önceki admin-only yorum güvenlik kanıtı değildir.

## Sonraki iş

AdminEvents create/update/delete/status aynı tick pending ve eski user/rol/hedef yanıtı sınırı; gerçek store mutation hata sözleşmesine bağlı UI akışlarını tek gönderim/ACK ve refresh anlamıyla tamamla. D kararları/rol politikası icat etme. UserEvents handleRegister/loadingMap/successMap kaynakta render'a bağlı değil; kullanılmayan handler'ı çalışan akış diye kabul etme. Katıldıklarım attendees kaynağı, admin diğer sayaçlarının hata→0 davranışı, tarih/legacy cache, tarayıcı/cihaz ve ana PAR02/04/Sprint6 açık.
