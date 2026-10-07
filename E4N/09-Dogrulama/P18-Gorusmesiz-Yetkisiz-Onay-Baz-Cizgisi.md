# P18 — Görüşme ve karar yetkisi baz çizgisi

**2 Ekim 2026.** Etkin `PUT /api/groups/:id/members/:userId`, atılabilir PostgreSQL 17.11; `npm run test:isolated` geçti. Canlı Supabase'de yazma yapılmadı.

Yeni kapalı grupta bir `REQUESTED` başvuru oluşturuldu. O grubun başkanı veya admini olmayan sıradan `MEMBER` JWT'siyle onay isteği gönderildi. **HTTP 200** döndü; başvuru satırı **`ACTIVE`** oldu. İstekte görüşme sonucu, karar veren kimlik veya gerekçe bulunmadı; etkin handler yalnız `status` değerini yazıyor. Kaynak şemada grup başvurusu/görüşme/karar geçmişi alanı veya tablosu bulunmuyor. Bu test, P18'in mevcut rol ve görüşme kapısının yokluğunu kanıtlar; uygulamaya yeni rol kuralı eklemez.

D08 görüşme ön şartını, başkan/eş başkan/admin karar yetkisini ve hangi sonucun kalıcı kayıt olacağını belirlemeli. P10 `group_applications` ve karar izi modeli, P16 hizmet çakışması, P17 kapasite ve P11 durum geçişiyle aynı transaction sınırı gerekir. Kullanıcının ertelediği genel güvenlik denetimi burada yapılmadı; bu yalnız P18 onay yolunun doğrudan kabul koşulu testidir.
