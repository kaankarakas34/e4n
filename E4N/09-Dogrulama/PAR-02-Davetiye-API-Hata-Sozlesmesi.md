# PAR-02 — Davetiye API hata sözleşmesi

## 3 Ekim teslimi — `8e6ce1a`

Bağlı `/api/visitor-invite/verify` JWT doğrulama ve inviter sorgusu ayrı hata sınırlarına alındı. Geçersiz/eksik/expired JWT, yanlış type veya eksik/bozuk beklenen email/inviter UUID alanları HTTP400 `{valid:false,code:INVALID_INVITE,error}` döner. Geçerli JWT sonrası DB sorgusu arızası HTTP500 `{code:INVITE_CHECK_FAILED,error}` döner; geçersiz davetiye ilan edilmez. Dahili hata metni yanıttan kaldırıldı. Başarılı kendi davetiye doğrulamasının mevcut email/inviter alanları korunur.

İstemci request helper mevcut Error.message metnini koruyarak status/responseBody metadata taşır. `verifyVisitorInvite` yalnız HTTP400 + açık INVALID_INVITE + valid=false + string error sonucunu normal invalid yanıtına çevirir. Eski belirsiz400,500/503,bozuk içerik ve ağ hatası reject kalır; bbc9e45 ekran alert/retry sözleşmesi kullanılır. Gerçek invalid400 artık ücretli seçeneğe geçebilir; DB arızası bunu yapamaz. Fiyat/hak/D07 kuralı seçilmedi.

## Doğrulama

- `server/npm run test:isolated` exit0: gerçek uygulama HTTP + geçici loopback Postgres. Valid200; eksik, bozuk, expired, yanlış type, inviter UUID, email için altı400/INVALID_INVITE; geçerli token için kontrollü pool lookup reject500, query geri yüklenince200. Invalid yanıtlarda email yok;500'de valid/message yok. Test öncesi/sonrası users id/name/email projeksiyonu değişmedi. Lookup arızası deterministik enjekte edildi; diğer valid sorgular gerçek izole DB'yi kullandı. Fixture container sonunda kaldırıldı.
- `node test/visitor-invite-api.mjs`: gerçek API modülü kontrollü fetch ile explicit invalid400 dönüşü; legacy400/500/503/bozuk içerik/ağ arızası reject.
- `node test/visitor-payment-notification.mjs`, `node test/referral-api.mjs`: ekran ve request helper regresyonları başarılı; rapor HTTP/ağ hatası→örnek/boş fallback yok.
- `npm run check`, `git diff --check` başarılı. Commit push ve temiz yönetilen ağaç doğrulandı.

İzole smoke içinde önceki kapasite/onay/puan/shuffle/ödeme baseline açık hataları da beklenen sonuçlarıyla kaldı; exit0 bunların giderildiği anlamına gelmez. Gerçek Supabase/ödeme/e-posta/dağıtım yok. JWT/hata sözleşmesi dar teknik teslimdir; kapsamlı güvenlik tamamlanmadı.

## Sonraki bağımsız iş

VisitorPaymentPage FREE submit yanıtı null/bozuk olsa da Başvurunuz Alındı diyebilir; aynı tick'te birden çok submit ve geç token/route yanıtı sınırları incelenecek. Kaynakta /visitors/apply başarılı yanıtın gerçek id'sini doğrula; ürün politikası veya ödeme durumu uydurma. D07/Sprint6/PAR04 ana kabul açık.
