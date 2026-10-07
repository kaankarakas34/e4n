# PAR-04 — Etkinlik tek gönderim ve oturum sınırı

Tarih: 3 Ekim 2026. Yönetilen dal: `codex/e4n-sprint1-foundation`. Commit: `8b1abdd`, origin üzerine gönderildi.

## Değişiklik

AdminEvents oluşturma, düzenleme, silme ve durum değişikliği ortak pending ref ile seri çalışır. Düğmeler işlem sırasında kilitlidir. Handler yalnız taze liste ve ADMIN kullanıcı bağlamında başlar; eski kullanıcı/rol/hedef/form sonucu görünümü değiştirmez. İptal edilip yeniden açılan form için sürüm sınırı vardır.

eventStore yazmaları istemcide ADMIN kontrolü yapar. Kullanıcı/rol veya son yazma değiştiğinde eski yanıt cache'i değiştirmez; pending durumu uygun biçimde temizlenir. Mevcut ACK ve kayıt doğrulaması korunur.

## Doğrulama

- `node test/admin-event-participants.mjs`: mevcut katılımcı regresyonları ve görünür yazma hataları; aynı anda iki oluşturma/silme tek çağrı; pending düğme; eski rol callback'i yeni istek açmaz; iptal/yeni form eski sonuçla kapanmaz.
- `node test/event-store-write.mjs`: önceki okuma/yazma ACK regresyonları; ADMIN güncellemesi sürerken MEMBER bağlamına geçildiğinde eski kayıt cache'e girmez; MEMBER silmesi API öncesi reddedilir.
- `npm run check` ve `git diff --check` başarılı. Son ek test yalnız test dosyasını değiştirdi.

Testler gerçek TSX ve store kodunu kontrollü hooks/auth/API ortamında çalıştırır. Gerçek DOM, tarayıcı, cihaz, HTTP veya veritabanı kabulü değildir. Düzenleme/durum çift gönderimi ve store eşzamanlı yazma sırası ayrı senaryo olarak test edilmedi.

## Açık sınırlar

Pending aynı bileşen içindedir; farklı sekmelerde tekrar veya sunucu idempotency çözümü değildir. Gönderilmiş sunucu işlemi geri alınmaz. Genel event yazma sunucu rol politikası ve DELETE satır sayısı değişmedi. Public GET mode=admin kaynak bulgusu E4N-120/Sprint6'da açık. Canlı Supabase, gerçek ödeme, dağıtım veya üretim testi yapılmadı. E4N-116/118 ana kabul koşulları tamamlanmadı.

## Sonraki bağımsız iş

AdminDashboard üye/grup/lonca sayaçlarında yükleme, hata, geçersiz veri ve gerçek sıfırı ayır; eski oturum yanıtını gizle.
