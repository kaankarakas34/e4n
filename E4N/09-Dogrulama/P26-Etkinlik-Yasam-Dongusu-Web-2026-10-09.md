# P26 — Etkinlik yaşam döngüsü, yönetici ve halka açık web

9 Ekim 2026. Eğitim dışı web için veri, API, iki halka açık ekran, yönetici ekranı ve kabul testleri birlikte teslim edildi. Uygulama commitleri `fa0c6bf`, `af050cb`; test aracı ve route envanteri `9aa05fc` (`codex/e4n-sprint1-foundation`).

## Davranış

- Etkinlik yönetici listesi, oluşturma, güncelleme ve silme yalnız veritabanında güncel `ADMIN` olan hesaba açılır. JWT içindeki eski/sahte rol yeterli değildir. Anonim yönetici listesi 401, üye 403 alır.
- Halka açık liste yalnız açık, yayımlanmış ve süresi geçmemiş etkinlikleri döndürür. Dashboard ve herkese açık etkinlik sayfası yönetici listesini çağırmaz.
- Detayda taslak gizlidir. Halka açık tamamlanmış ve iptal edilmiş etkinlik ayrıntısı geçmiş erişimi için korunur. Özel etkinlik yalnız güncel kayıt sahibi, oluşturan veya aktif grup üyesi ile yöneticiye görünür. Halka açık detay katılımcı kimliklerini ve toplantı bağlantısını vermez; sayaç korunur.
- Grup etkinlik listesi de aynı veri sınırına bağlandı (`078dc67`): yönetici ve aktif grup üyesi tüm grup etkinliklerini görür; diğer oturumlu kullanıcı yalnız açık yayımlanmış/tamamlanmış/iptal edilmiş kayıtları, toplantı bağlantısı olmadan görür. JWT içindeki sahte `ADMIN` rolü yetki vermez. Yanıt özel ve önbelleksizdir.
- Oluşturma/güncellemede başlık, tarih sırası, tür, durum, kapasite ve fiyat girdileri doğrulanır; bulunmayan hedef 404, geçersiz girdi 400 döner. Kayıt/bilet ilişkisi olan etkinlik fiziksel silinmez, 409 döner; yönetici ekranı iptal etmeyi söyler. Boş etkinlik silinir, tekrar silme 404 döner.
- Yeni migration yok. Yalnız mevcut `users`, `events`, `attendance`, `event_tickets`, `group_members` tabloları kullanılır. Canlı Supabase'e yazma veya üretim dağıtımı yapılmadı.

## Kabul kanıtı

- **Son birleşik tur** `output/web-rehearsal/2026-10-09T05-51-47-941Z/report.json`: `078dc67` üzerinde **39/39 API/veri, production build, 89/89 tarayıcı ve son DB kontrolü PASS**; `technicalPass=true`, `releaseReady=false`. Yeni grup listesi izolasyon testi bu tura dahildir. Bu, önceki ayrı testlerin ardından tek kök PASS kanıtıdır.

- İlk birleşik deneme `output/web-rehearsal/2026-10-09T05-10-21-609Z/report.json`: 37/39 API. Geçmişte tamamlanmış etkinlik detayına 404 verilmesi iki eski sözleşmeyi bozdu; rapor başarısız olarak korunur.
- Düzeltilmiş birleşik deneme `output/web-rehearsal/2026-10-09T05-19-31-240Z/report.json`: **39/39 API/veri ve production build PASS**; tarayıcı başlamadan soğuk fixture `/state` 5 saniye sınırında zaman aşımına uğradı. Bu tur tek kök PASS değildir.
- İlk ayrı tarayıcı `output/web-browser/2026-10-09T05-29-51-230Z/browser-report.json`: 80/89, profil testindeki geçici ağ kuralı hata sonrası temizlenmediğinden ardışık profil/fatura hataları; başarısız olarak korunur.
- Son taze sahipli fixture `output/web-browser/2026-10-09T05-41-43-407Z/browser-report.json`: **89/89 PASS**, iki yeni etkinlik ekranı ve son DB durumu PASS; yerel fixture konteyneri kapandı. Profil ağ kuralı `finally` içinde temizlenir. API/build commit `af050cb` ile tarayıcı commit `9aa05fc` arasında `src` ve `server/src` uygulama kaynak farkı yoktur. Test aracı dışında ürün davranışı değişmedi. Yine de tek kök PASS iddiası yoktur.
- İzole PostgreSQL 17 smoke ve etkinlik kayıt/tamamlama sözleşmeleri, TypeScript kontrolü ve route envanteri geçti. Rol sahteciliği, özel etkinlik erişimi, 409 geçmiş koruması ve gerçek katılımcı sayısı doğrulandı.

## Açık sınır

Bu teslim mevcut etkinlik yaşam döngüsünü kapatır; P26 ana hedefi kapanmaz. Üyelikten bilet/indirim hakkı, ödeme sağlayıcısı sandbox kabulü, eski katılım satırlarının yorumu ve backfill, diğer eski doğrudan yazım yolları, canlı şema geçişi ve üretim sürüm kabulü açıktır. D01–D10 için ürün kuralı seçilmedi. Kapsamlı SEC Sprint 6, mobil Sprint 7, kurs/eğitim/sınav Sprint 8 kapsamındadır. `releaseReady=false`.
