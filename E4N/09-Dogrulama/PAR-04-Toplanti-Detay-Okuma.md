# PAR-04 — Toplantı detay okuma sözleşmesi

3 Ekim 2026. `cfc9729` yönetilen dala push edildi.

Shared getMeetingAttendance HTTP/ağ hatasını [] yapmaz. Array/nesne/id ve event_id=istenen toplantı doğrulanır; null/bozuk/yanlış hedef yanıt hata olur. Gerçek[] korunur. Aktif GET events/:id/attendance kaynakta a.* ve kullanıcı alanları döndürür; yeni sunucu/rol/DB politikası eklenmedi.

Başkan detay modalı effect üzerinden okur: ilk açılış eski satırları temizler/loading, hata alert/tekrar, gerçek boş ve gerçek kayıt ayrı gösterilir. Kapatma, başka toplantı, panel read context veya oturum değişince eski istek sonucu atılır. Tanınmayan status artık Vekil diye etiketlenmez, Bilinmeyen durum gösterilir; puan/durum kuralı seçilmedi. Kapatma düğmesi erişilebilir etiket alır.

## Kanıt

- `node test/manager-attendance.mjs`: gerçek TSX kontrollü hooks/API; önceki panel 11 kaynak ve yoklama ACK/pending testleri; yeni detay loading/reject/retry/gerçek[]/satırlar, yanlış event_id, bilinmeyen status, kapatma ve user context değişimi sonrası geç yanıtın atılması başarılı. Ayrı iki toplantı yarış testi bu tur yapılmadı; dependency/cleanup kaynakta vardır.
- `node test/meeting-read-api.mjs`: gerçek API kontrollü fetch GET/path/JWT, HTTP/ağ reject, null/object/null row/yanlış event_id reject; gerçek[] ve valid row korunur. Önceki meeting sayı ve activities testleri başarılı.
- `npm run check` exit0; diff başarılı; commit/push ve temiz dal.

Gerçek HTTP/DB veya tarayıcı/cihaz testi yapılmadı; canlı Supabase/ödeme/mail/dağıtım yok. Ana PAR02/04 ve D01/Sprint6/gerçek kayıt/rol/idempotency kabulü açık.

## Diğer tüketici ve sıradaki iş

AdminEvents getMeetingAttendance iki çağrısını try/catch içinde yapar; API'nin reject etmesi yakalanmamış Promise üretmez (kaynak incelemesi, bu tur AdminEvents bileşen testi yok). Katılımcı görüntüleme eski id/veri/oturum yanıtı sınırı ve modal loading/error/retry eksik. Silme sonrasında GET hatası aynı catch'te Katılımcı çıkarılamadı mesajına dönüşür; silmenin gerçekleşmediği kanıtı değildir. Bu mevcut hatayı sıradaki bağımsız işte ayır, gerçek silme ACK/tek pending/hedef ve fresh read testlerini kur; üretimde silme yapma.
