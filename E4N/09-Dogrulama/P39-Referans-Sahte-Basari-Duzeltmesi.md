# P39 — Referans oluşturma hata sözleşmesi

## Liste yükleme hatası — `6c523e5`

`api.getReferralsByUser` HTTP/ağ hatalarını artık boş listeye çevirmiyor. Mevcut store hata mesajını gösterip daha önce yüklenen kayıtları koruyor. Başarılı boş yanıt ise listeyi gerçekten boşaltıyor ve önceki hatayı temizliyor.

`node test/referral-api.mjs` gerçek API istemcisinde 503, ağ hatası, başarılı boş/dolu yanıt, kullanıcı kimliğinin URL kodlanması ve Authorization başlığını doğruladı. `node test/referral-store.mjs` yükleme hatasında mevcut satırın korunmasını ve başarılı boş tekrarını da doğruladı. `npm run check` geçti. Testler sentetik yanıtlarla çalıştı; canlı ağa bağlanılmadı.

**2 Ekim 2026.** H28, `codex/e4n-sprint1-foundation` dalında düzeltildi.

`referralStore.createReferral` API hatasını artık çağırana iletir, `loading=false` ve görünür hata mesajı yazar; listeye sahte kayıt eklemez. `Referrals` ekranının mevcut `try/catch` akışı başarısız istekten sonra başarı penceresini açmaz ve formu sıfırlamaz. Başarıda yalnız API'nin döndürdüğü kayıt eklenir.

Başlangıç örnek yönlendirmeleri kaldırıldı. `referral-store` önbelleği sürüm 1'e taşınırken eski sürümdeki kayıtlar temizlenir; API'den yeniden yüklenir. Bu yalnız tarayıcı önbelleği işlemidir, sunucudaki yönlendirmeler silinmez.

`node test/referral-store.mjs` eski sahte önbelleği, API hatasında reddedilen promise/0 sahte satırı, gerçek sunucu kaydıyla başarılı tekrarını ve sonraki hatada mevcut gerçek kaydın korunmasını doğruladı. `npm run check` başarılı. Test, ağ/DB kullanmayan gerçek Zustand store denemesidir; tarayıcı ekranı ve canlı dağıtım ayrıca doğrulanmadı. P39'un diğer sözleşme farkları açık.
