# P26 — Etkinlik kayıt, bilet ve ödeme baz çizgisi

**2 Ekim 2026.** Etkin handler kaynakları ve izole tekrar kaydı deneyi; canlı ödeme veya Supabase yazması yapılmadı.

- `POST /api/events/:id/register`, etkinlik bulunmazsa 404; mevcut kayıt varsa 200 `Already registered` ve aynı `attendance` satırı korunur. JWT yoksa 401. [[E4N/09-Dogrulama/PAR-02-Etkinlik-Kayit-Ortak-Yol|izole kanıt]].
- İlk kayıt handler'ı gelecekteki etkinlik için `attendance.status='PRESENT'` yazıyor. Bu, kayıt ile etkinlikte gerçekten bulunmayı aynı statüye indiriyor.
- Bilet üretiliyorsa ücretli etkinlikte `payment_status`, istemcinin gönderdiği `req.body.payment_status` veya `PENDING` oluyor. Aynı handler ödeme işleminin `merchant_oid`/tutar/sahibini doğrulamıyor.
- Web ödeme başarısı ardından tekrar `registerForEvent(..., {payment_status:'PAID'})` çağırıyor. Ödeme callback'inin `event_registration` dalı da `attendance` ve gerektiğinde `event_tickets` yazıyor. İki yazma sahibinin sırası ve bilet tekilliği P14/P26 kapsamında çözülmeli.

`attendance` üzerinde `(event_id,user_id)` tekil; `event_tickets` için aynı çiftin tekilliği yok ([[E4N/02-Mevcut-Sistem/Veritabani-Sema-Denetimi|DB-08]]). P26 hedefi kayıt, gerçek katılım, bilet ve doğrulanmış ödeme durumunu ayrı tutmalı. D07/P25 fiyat politikası ve P14 callback sahipliği kararlaştırılmadan uygulama/üretim denemesi yapılmadı.
