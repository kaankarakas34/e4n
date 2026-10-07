# PAR-04 — Üye grup/lonca detay doğruluğu

3 Ekim 2026, commit `517fd3f` yönetilen dala gönderildi.

## Teslim

`GroupDetail.tsx` admin ekranıyla aynı doğrulanmış okuma/hata sözleşmesine geçirildi: kayıt id eşleşmesi, bütün alt listeler/nesne satırlar, paralel okuma ve tamamı başarılı olunca kabul; hata/null/bozuk yanıt alert/tekrar, eski route/tür/kullanıcı/rol/unmount sonuçları gizlenir/atılır. Oturumsuz ve eksik id çağrı yapmaz. Mevcut oturumlu kullanıcı okuma davranışı korunur; MEMBER/VISITOR dahil erişim bu tur daraltılmadı. Sunucu grup sahipliği/rol kontrolünün kabulü değildir; `6bb352e` izole okuma bulgusu ve E4N-120 açık.

ADMIN için görünen fakat API'siz Math.random/all-present yerel yoklama formu ve Yeni/Kaydet kontrolleri kaldırıldı. Kayıt bu ekranda henüz kullanılamıyor açıklaması vardır; gerçek yazma özelliği tamamlanmadı. Mevcut grup events verileri korunur; Gruba Bağlı Etkinlikler/Katılım Kaydı-Aktif Üye/Kayıt Oranı etiketleri. Null sayılar ve denominator0/tutarsız oran Veri yok; gerçek0/0%/50% korunur. Sabit gelecek etkinlik0 kaldırıldı; Aktif Üyeler yalnız status=ACTIVE kayıtları, REQUESTED hariç.

## Kanıt

- `node test/admin-group-detail.mjs member`: gerçek GroupDetail kontrollü hooks/API, grup/lonca her kaynak hata/null/retry, boş/gerçek sayılar, eski route/kullanıcı ve gecikme/unmount, mevcut oturumlu roller, no-user/no-id sıfır çağrı, yoklama açıklaması/save yokluğu, null/0/0/0/2/1/2/3/2 oranları ve yalnız get çağrıları başarılı.
- `node test/admin-group-detail.mjs` admin regresyonu ve `node test/meeting-read-api.mjs` shared sayı/hata sözleşmesi başarılı.
- `npm run check` exit0, diff kontrolü başarılı; commit/push ve temiz yönetilen dal.

Gerçek DOM/tarayıcı, cihaz/yayın ve yeni HTTP/DB testi yapılmadı. API/server değişmedi. Canlı Supabase yazması, ödeme/mail/dağıtım yok. D01–D10 ve ana PAR02/04/Sprint6 kabulü açık; toplantı sayılarının gerçek fiziksel katılım/geçmiş üye sayısı anlamı yok, önceki kaynak sınırlamaları [[E4N/09-Dogrulama/PAR-04-Web-Yoklama-Sahte-Kayit]] içinde.

## Sonraki bağımsız iş

GroupManagerDashboard shared null sayıları halen aggregate/oranlarda0 veya NaN yapabilir; mevcut submitAttendance yanıtı doğrulanmadan başarı bildirir, pending/tekrar ve eski hedef sonucu denetlenecek. Önce gerçek çağrı/yanıt eşlemesini çıkar, ardından ürün kuralı seçmeden istemci hata/tek gönderim sınırını uygula. Sunucu her çağrıda yeni event/async score, rol/sahiplik/idempotency/D01 ayrı açık.

GroupDetail ziyaretçi ekleme kodu sabit inviter_id='1'/meslek kullanır ve reject yakalamaz; ciro null→0, varsayılan dönem/durum ve lonca grup yolları da sonraki bağımsız denetim listesinde.
