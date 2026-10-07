# PAR-04 — Admin etkinlik katılımcı okuma ve çıkarma

3 Ekim 2026, `bb29e2d` yönetilen dala push edildi.

AdminEvents katılımcı modalı açılışta eski satırları temizler, loading/hata/tekrar/gerçek boş ayrımı yapar. Mevcut shared GET doğrulamasına ek olarak doğru event_id listesi kontrol edilir. ADMIN istemci sınırı, kullanıcı/rol/hedef/kapatma bağlamı ve effect temizliği vardır. Çıkarma yalnız taze listede bulunan user_id için ve mevcut ADMIN bağlamında çağrılır; aynı tick ref kilidi ve bütün çıkarma düğmelerinde disabled tek pending işlemi sağlar.

DELETE yalnız success=true yanıtıyla işlem onayıdır. Reject/null yanıt sonucu doğrulanamadı mesajıdır, kesin çıkarılmadı iddiası yok. Onay sonrası katılımcı GET hatası ayrı onaylandı/liste yenilenemedi mesajı ve yalnız GET tekrar düğmesidir; otomatik tekrar DELETE yok. Geç eski rol/oturum sonucu uygulanmaz. Bildirim bağlamı da hedefle sınırlandırıldı.

Aktif server/src/index.js DELETE /admin/events/:eventId/attendance/:userId kaynakta ADMIN kontrolü, attendance DELETE ve success=true döndürür; kaç satır silindiğini doğrulamaz. İşlem onayı bir satırın kesin var olduğu/silindiği kanıtı olarak sunulmaz. Sunucu bu tur değiştirilmedi veya gerçek HTTP/DB ile çağrılmadı.

## Kanıt

- `node test/admin-event-participants.mjs`: gerçek TSX kontrollü hooks/store/API; reject/null/tekrar/gerçek boş ve satırlar, çift handler→tek DELETE/disabled, strict ACK ve onay sonrası GET hatası ayrımı, kapatılmış modalın geç GET yanıtı ve rol değişmiş callback/DELETE sonucu sınırı başarılı.
- `node test/meeting-read-api.mjs` shared API yanlış hedef/null/hata/boş regresyonu başarılı.
- `npm run check` son commit içeriğiyle exit0; diff başarılı, commit/push/temiz yönetilen dal.

Gerçek tarayıcı/cihaz veya HTTP/DB rol/silme testi yok, canlı Supabase/ödeme/mail/dağıtım yok. Genel PAR02/04 ve kapsamlı güvenlik kabulü açık.

## Sıradaki bağımsız iş

eventStore fetchEvents hata durumunda reject etmez; AdminEvents store error/loading değerlerini okumuyor. Bu yüzden çıkarma sonrası etkinlik özeti yenileme catch'i gerçek store hatasını göremez. Katılımcı GET hata ayrımı bu teslimde çözülmüş, genel etkinlik özeti cache/hata kabulü açık kalmıştır.

Store create/update/delete de hatayı yakalayıp çağırana başarı gibi resolve ediyor ve bozuk yanıt cache'e girebilir. Önce bütün tüketicileri/API ACK biçimlerini denetle, görünür okuma hatası ve mutation hata→sahte başarı sözleşmesini düzelt. Ürün/ödeme/yetki kuralı icat etme. AdminEvents filtrelemede eksik description alanı da ayrı test edilmeli.
