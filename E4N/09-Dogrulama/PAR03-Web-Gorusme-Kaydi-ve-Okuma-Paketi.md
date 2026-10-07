# PAR03-D — Web görüşme kaydı ve kayıt sonrası okuma

4 Ekim2026. E4N-131 Done. Commit `fc23015c6be158c00e6732da659339503d25ecb4`; yönetilen dala push. Server0010/E4N130 temelini yeniden yazmadan web tüketicisi tamamlandı.

## Teslim

Activities'in submit handler olmayan modalı gerçek ActivityRecordForm ve client.logCompletedMeeting ile bağlandı. Önceki grup/lonca partner kapsamı korunur; bu scope veya member listesi başarısız/malformed ise seçim açılmaz, hata/retry görünür. Gerçek boş kapsam ayrı; self ve duplicate partnerler ayıklanır. Yerel tarih/saat ve optional notes saklanır; API'de saklanmayan süre/lokasyon alanları kaldırıldı, yeni schema/kota/puan kararı seçilmedi.

Native form submit, strict takvim günü/saat, single sync lock, pending close guard ve geç session/generation/unmount sınırı vardır. Belirsiz ACK aynı giriş için aynı UUID ile tekrar edilir. ACK notes/date/status/owner/target/id client katmanında doğrulanır; component de owner/id/status kontrol eder. Confirmed write sonrası consumer/read hatası kaydı başarısız diye göstermez veya otomatik tekrar yazmaz.

OnSaved parent revision calendar+ActivitySummary okumasını yeniler. İki okuma loading/error/retry/empty ve session cleanup ile ayrılır; retry yalnız GET. Takvim yerel günü kullanır; summary aggregate malformed/invaliddate hatasını boş saymaz, education completed_date alanı desteklenir. Bu paket tüm rapor/score/UI politikalarının tamamlandığı anlamına gelmez.

İlgili takvim API owner sınırında query userId'nin başka üye takvimini okuyabildiği bulundu; yalnız authenticated owner kullanılır, foreign query403/anonymous401. Mevcut üç web tüketicisi kendi user.id'sini gönderiyor; admin başka üye takvimi için ayrı akış yok. Bu düzeltme kapsamlı Sprint6 güvenlik denetimini başlatmaz.

## Kanıt

- `node test/activity-record-form.mjs`: gerçek form/page/summary, kontrollü hook/transport; scope/error/empty/self, invaliddate no-write, same-key retry, tek pending/close, badACK, late session/unmount, confirmed consumer failure; saved revision→summary/calendar refresh ve read retry yazmasız. Summary education date ve aggregate error ayrı.
- `node test/meeting-read-api.mjs`: actual client body senderId server'a gönderilmez; id/owner/target/notes/date/status invalid ACK reject. Completed read request/pending satırlarını dışarıda bırakır.
- `node server/test/meeting-contract.mjs <mobile-root>`: gerçek web client→izole Express/PG17 completed ACK/replay tekhistory; own calendar yeni kaydı içerir, foreign403/anon401; mevcut mobile/rollback/race/eski6→10/regression başarılı. Konteyner temizlendi, canlı DB/SMTP yok.
- TypeScript check/build ve final diffcheck başarılı. Build sonrası son owner/localday metin-kod güncellemesi ayrıca actual tests/check ile doğrulandı. Gerçek browser DOM, cihaz veya üretim release gate'i değildir.

## Devam

Linear tam sayfa75 kayıt:21 Done/20 In Progress/34 Backlog. Ürün tamamlanma yüzdesi değildir. Ana PAR03/P32, web DOM/native cihaz, mobil repo/release, reload key ve D kararları açık. Yönetilen tracked kaynak temiz; output önceki task scratch/bundle'dır.

**Sonraki paket P32/PAR03 mobil referans/yönlendirme akışı:** mevcut mobil referrals.tsx receiver_id/type/temperature/description gövdesi ve console-only read failures kullanıyor; aktif API sözleşmesi ve web consumer önce tekrar okunacak, ortak owner list/create/status+ACK/tek pending/read-refresh+izole kabul birlikte yapılacak. Puan/gelir/temperature anlamı veya D politikası uydurulmayacak. Tamamlanan destek/toplantı/kayıt işleri tekrar teslim edilmez.
