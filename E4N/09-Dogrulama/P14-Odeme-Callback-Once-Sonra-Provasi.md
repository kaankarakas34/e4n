# P14 — Ödeme callback önce/sonra provası

**2 Ekim 2026.** Atılabilir PostgreSQL 17.11 ve yerel etkin API; sentetik `merchant_oid`, kullanıcı ve `membership` işlemi. Ödeme sağlayıcısına veya canlı Supabase'e istek gönderilmedi. `npm run test:isolated` geçti.

| Adım | HTTP | İşlem satırı | Kullanıcı hakkı |
|---|---:|---|---|
| Başlangıç | — | `PENDING`, `user_id=NULL`; `action_data.user_id` dolu | `subscription_end_date=NULL` |
| İlk `POST /api/payment/sipay-callback/success` | 200 | `SUCCESS`, `user_id` hâlâ NULL | `ACTIVE`, `1_MONTH`, bitiş tarihi dolu |
| Aynı başarı callback'i tekrar | 200 | `SUCCESS` | Bitiş tarihi değişmedi |
| Ardından `POST /api/payment/sipay-callback/fail` | 200 | `FAILED`, `user_id` hâlâ NULL | `ACTIVE`, bitiş tarihi dolu kaldı |

Başarı handler'ı `SUCCESS/PAID` durumunda tekrar etkiyi atlıyor; başarısızlık handler'ı son durumu denetlemeden `FAILED` yazıyor. Böylece `FAILED` işlem ile verilmiş üyelik hakkı aynı anda kalabiliyor. Başarı `action_data.user_id` üzerinden hak veriyor; `payment_transactions.user_id` hâlâ boş. Bu prova, canlıdaki beş ödeme kaydını herhangi bir kullanıcıya eşleştirmez.

P14 için işlem sahibi, ödeme amacı, sağlayıcı sonucu ve üyelik dönemi tek bir atomik durum geçişine bağlanmalı. Geç/tekrar/çelişkili callback sırası ve iade etkisi D07/P12/P10 ile kararlaştırılmadan üretim ödeme davranışı değiştirilmemeli. Etkinlik ve ziyaretçi ödeme etkileri aynı tekrar matrisiyle ayrıca sınanmalı. Bu test yalnız mevcut davranışı gösterir.
