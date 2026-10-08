# P39/P30 — Profil ve fatura bilgisi bütün web paketi

## Sorun

Kendi profilindeki web sitesi/biyografi kaydedilmiyordu; boş telefon/şehir/meslek temizlenemiyordu. Eski PUT `/users/me` kayıt sonrasında bütün kullanıcı satırını döndürüyordu. Profilin ve ödeme formunun yerel kayıtları, sunucunun gerçekten kaydettiği değerlerle doğrulanmıyordu. Ödeme formu fatura kaydı tamamlanmadan kart adımına geçebiliyordu. Şirket bilgilerinin ilk kayıttan sonra yalnız yönetimce değiştirileceği iddiası backend tarafından uygulanmıyordu; D10 kararı açık.

## Birlikte teslim edilen kapsam

1. **Veri:** CLI ile oluşturulan additive `20261008145443_self_profile_fields.sql`, sürüm0023; users üzerinde website/bio, eski checksum değişikliği ve API-time DDL yok. Kaynak23 migration,46 uygulama tablosu+ledger=47. Gerçek üretim şemasına uygulanmış değildir.
2. **API:** kendi hesabına ait private/no-store ayar okuması ve tek profil write provider. Güncel DB hesabı/satır kilidi, izinli alanlar, metin/URL/tip/sınır doğrulaması, kısmi alan koruması ve silinebilir boş değerler, minimal owner/version/revision DTO. Şifre/reset/rol/ödeme alanı dönmez; başka kullanıcı seçilemez. Hata rollback ve redaction vardır.
3. **Çakışma/tekrar:** self edit beklenen revision gönderir; eski farklı düzenleme409. Aynı içerik eski revision ile readback/replay, yeniden UPDATE yok. Kayıp yanıt sonrası otomatik ikinci PUT yerine GET ile sonuç uzlaştırılır. Billing/legacy revision göndermeyen kısmi writer'lar tüm eski writer'lar için optimistic locking kabulü değildir.
4. **Profil web:** site/biyografi/şehir/LinkedIn gerçek kayıt ve yeniden yükleme, canonical değer, izinli HTTP(S) site bağlantısı, açıklamalı hata ve korunmuş taslak, conflict refresh, dialog/label ve eşzamanlı submit kilidi, hesap/token/rota eski yanıt koruması. Kaydedilmiş fatura alanları da güncel auth store'a aktarılır; ödeme formu eski fatura bilgilerini geri yazmaz. Kendi e-postası bu endpoint ile değiştirilemediği için eski özel üye ekranının self e-posta girdisi devre dışıdır.
5. **Ödeme formu:** doğrulanmış profil/fatura kaydı olmadan kart adımına geçmez. Belirsiz ACK, dört fatura alanını GET ile uzlaştırır; tekrar PUT veya ödeme başlatmaz. Değişmiş modal/hesap/işlem bağlamına eski yanıt taşınmaz. Mevcut ödeme request identity/recovery ve ziyaretçi ayrı kayıt yolu korunur.

Şirket serbest metninin kaydı şirket uygunluğu/kanıtı değildir. Desteksiz kalıcı yönetim kilidi vaadi kaldırıldı; mevcut server'ın metin güncelleme davranışı korunur. D10/ücret/üyelik hakları/puan/shuffle kesin kuralları seçilmedi. Mobil7 ve LMS8 başlatılmadı.

## Kanıt sınırı

Odaklı Express/JWT/PG17/gerçek TS kontratı: fresh23/repeat0/22upgrade, sahibi/özel alanlar,8 eşzamanlı düzenlemede1 başarı+7 stale409, safe replay, alan temizleme, billing uyumu, trigger failure rollback/redaction, URL/tip/sınır ve false ACK/presend owner guards PASS. Sentetik restore, boş olmayan Unicode biyografi/siteyi HTTP ile doğrular.

İlk API denemesi34/36; iki eski migration-count beklentisi (smoke ziyaretçi ve payment upgrade) başarısızdı. Verinin kaybolduğu iddiası değildir; beklentiler düzeltildi, smoke/payment/profile/types taze PASS. Sonraki API turu36/36 ve build PASS; o root turunun tarayıcı kısmında native fetch Response.ok yanlış kullanımı nedeniyle fatura hazırlık testi ve onu izleyen kayıp ACK/finalDB senaryoları başarısız oldu. İlk raporlar korunur; bu tur tek donmuş bütün PASS diye raporlanmaz.

Son düzeltme yalnız `PublicProfile.tsx` kayıtlı fatura store aktarımı ve browser test senaryolarıdır. Önceki browser scriptinden fixture injection geri alınarak ve üç store alanı farkı geri çıkarılarak303dosya source hash, API36/36 turunun `446cc27ea9c4462c359ba222ca7a321e214e8997886ebdb5c2ebbf351420f35d` değerine tam eşleşti. Böylece API/veri kaynakları değişmeden kalan iki UI/test dosyası ayrılır. Güncel source hash `e2f6172fcd7a0c2977b8d0dadb83435b27bd3bd4eab9527e9b113443a1d11133`; güncel production build PASS. Son temiz browser/DB kanıtı teslim kaydında eklenir.

## Kalan kapılar

P39/P30/P37 ana hedefleri In Progress; yeni küçük Done issue veya sahte yüzde artışı yok. D01–D10 kalanları ve üç mevcut üyelik sorusu hâlâ açık; sorular tekrar sorulmaz. Canlı schema adoption/gerçek veri geçişi, mevcut tüm legacy writer'lar ve geniş RLS/auth denetimi ayrıca açık. SEC58/59/120 Sprint6; mobile7/LMS8 en son.

Canlı Supabase write/migration/deploy/gerçek e-posta/ödeme yok. Yeni kolonlar hedef ortamda onaylı migration kapısından geçirilmeden oradaki profil akışı kabul edilmiş sayılmaz. Kod geri dönüşünde additive kolonlar korunabilir; kolonları silmek veri kaybıdır ve üretim geri dönüş adımı olarak verilmedi.

## Son teslim kabulü

API/veri36/36 PASS (output/web-acceptance/2026-10-08T15-13-32-141Z/report.json); güncel productionbuild PASS; özel profil/fatura9UI +finalDB+source=11/11 (output/web-browser/2026-10-08T15-38-30-944Z/profile-focused-report.json); taze bütün gerçek App/Vite→Express/JWT→PG17 browser **74/74** (output/web-browser/2026-10-08T15-41-06-717Z/browser-report.json), bitiş 2026-10-08T15:43:37.367Z. Sekiz yeni profil/fatura senaryosu, profiledit'ten billing store/prefill doğrulaması ve finalDB dahil; ekran görüntüsü incelendi. Güncel303dosya source SHA256 e2f6172fcd7a0c2977b8d0dadb83435b27bd3bd4eab9527e9b113443a1d11133 özel ve bütün browser başında/sonunda eşit. API turu hash446'ya yeniden eşleşme, değişikliğin yalnız iki UI/test dosyası olduğunu kanıtlar; backend/migration/typed API36turundan beri değişmedi. Bu, tek değişmemiş root turu PASS iddiası değildir. Git'e taşınabilir kanıt server/docs/self-profile-web-acceptance-2026-10-08.json.

İlk full browser71PASS/3FAIL (native Response.ok hazırlık yanlışı ve takip eden billing/finalDB); sonraki uzun browser yerel GET power-teams navigasyon iptalindeki ECONNRESET nedeniyle tamamlanamadı ve tam rapor üretmedi. Her iki başarısız/eksik çıktı korunur. Ortak test transportu iptal edilen fetch'i ağ hatası/abort olarak uygulamaya taşır; otomatik GET/PUT retry veya sahte başarı yok. Düzeltmeden sonra11 ve74 temiz kabul geçti.

179route/26provider/17retainedlegacy. Şema23/47. Tüm ownedfixture/browser/API/Vite/PG süreçleri kabul sonunda kapandı; canlıwrite/deploy/mail/payment yok. P39/P30/P37 ana hedefleri açık.

## Git ve Linear teslim kaydı — 8 Ekim 2026

Uygulama/test/kanıt commit 7c26bfb, origin/codex/e4n-sprint1-foundation dalına başarıyla push edildi. Linear E4N-111 açıklaması 2026-10-08T15:49:01Z güncellendi; E4N-102 yorum 3df63590-5921-43e9-bec3-dbe97ab8853b ve E4N-109 yorum 16b777ee-61b4-4026-a6dd-3b1c5c09f4ff aynı teslim/kanıt/açık kapıları kaydeder. Ana görevler In Progress. İlgili üç Obsidian notu ana E4N bilgi bankasına aynı içerikle yansıtıldı. Canlı migration uygulanmadı.