# P15 — Açık lonca katılım baz çizgisi

**2 Ekim 2026.** Atılabilir PostgreSQL 17.11 ve etkin API; `npm run test:isolated` geçti. Canlı Supabase'de yazma yapılmadı.

| Adım | HTTP | `power_team_members` |
|---|---:|---|
| `ACTIVE` hesap, plan/bitiş tarihi yokken `POST /api/power-teams/:id/join` | 200 | 1 `REQUESTED` satırı |
| Aynı hesap `PENDING` iken başvuru | 403 | Önceki satır korunur |
| ADMIN JWT ile `PUT /api/power-teams/:id/members/:userId`, `ACTIVE` | 200 | Aynı satır `ACTIVE`, varsayılan rol `MEMBER` |
| `REJECTED` durum yazımı | 500 | İlgili başka `REQUESTED` satır değişmez; [[P11-HTTP-Durum-Yazma-Provasi|P11 provası]] |

Bu akışta `account_status=ACTIVE`, ücretli üyelik kanıtı olmadan başvuru kapısı olarak kullanılıyor; hemen katılım yerine REQUESTED ve ayrı onay var. Etkin lonca kodunda kapalı grubun 35 kişilik kapasite veya başkan görüşmesi kuralı görünmüyor. Bu yalnız mevcut davranıştır; hedef açık loncanın doğrudan katılım mı yoksa hafif onay mı istediği D07/P15 kararıyla netleşmeli. Kapalı grup kuralı otomatik loncaya kopyalanmamalı. Ürün kuralı ve canlı veri değiştirilmedi.
