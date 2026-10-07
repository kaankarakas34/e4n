# P25 — Dış etkinlik hakkı ve fiyat baz çizgisi

**2 Ekim 2026.** Etkin API/web kaynak incelemesi, P12/P14/P19 izole deneyleri. Canlı ödeme veya Supabase yazması yapılmadı.

| Sınır | Bugünkü etkin davranış | Hedef bağımlılık |
|---|---|---|
| Üyelik | Grup/lonca başvurusu `account_status=ACTIVE` kullanıyor; ücretli dönem kanıtı olmadan 200 olabiliyor. | D07 ve P12 ortak üyelik hakkı. |
| Grup çıkışı | `DELETE /groups/:id/members/:userId` ilişkiyi siliyor, hesap ACTIVE kalıyor. | P19 çıkış olayı; dış etkinlik hakkı grup satırından türetilmez. |
| Web fiyatı | `EventDetail` yalnız `event.price>0` ile PaymentModal açıyor; üyelik indirimi hesabı yok. | İndirim miktarı, hangi etkinlikte geçerli olduğu ve bitiş anı D07/P25 kararı. |
| Etkinlik kayıt API'si | `POST /events/:id/register` etkinlik bedeli ve `req.body.payment_status` kullanıyor; üyelik dönemi/indirim sonucu sorgulamıyor. | Sunucuda tek teklif/ücret ve doğrulanmış ödeme bağı; P14/P26. |
| Ödeme callback'i | Başarı/başarısızlık sırası işlem ile verilen üyelik hakkını çelişkili bırakabiliyor. | P14 sahiplik ve tekrar geçişi. |

Kaynak: `src/pages/EventDetail.tsx`, `server/src/index.js` etkin kayıt ve ödeme handler'ları; [[E4N/09-Dogrulama/P12-Uyelik-Hak-Kapisi-Baz-Cizgisi|P12]], [[E4N/09-Dogrulama/P14-Odeme-Callback-Once-Sonra-Provasi|P14]], [[E4N/09-Dogrulama/P19-Grup-Gecmisi-Provasi|P19]]. Etkinlik indirimi oranı veya ücretsiz kullanım kuralı varsayılmadı. P25 uygulaması ve gerçek ücret doğrulaması açık.
