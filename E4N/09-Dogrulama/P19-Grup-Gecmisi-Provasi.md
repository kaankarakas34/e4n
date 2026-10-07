# P19 — Grup üyeliği ve çıkarılma geçmişi provası

**2 Ekim 2026.** Etkin API ve atılabilir PostgreSQL 17.11 üzerinde `npm run test:isolated` başarılı. Canlı Supabase'e yazma yapılmadı.

| İzole işlem | Gözlenen sonuç |
|---|---|
| Ayrı ikinci gruba aynı kullanıcı için `ACTIVE` yerleşim ekleme | Kullanıcının iki `ACTIVE` grup ilişkisi aynı anda kaldı. |
| ADMIN ile `DELETE /api/groups/:id/members/:userId` | HTTP 200; hedef `group_members` satırı 0 oldu. |
| Çıkarılan kullanıcının hesabı | `account_status=ACTIVE` kaldı. |
| Olay geçmişi | `group_placement_events` tablosu yok. |

Mevcut silme yolu ayrılma/çıkarılma gerekçesi ve tekrar sayımı bırakmıyor. Tek aktif kapalı grup kısıtı da yok. Hesap statüsünün silmeyle değişmemesi ayrı üyelik hedefiyle uyumlu bir başlangıçtır; kanıtlı E4N üyelik dönemi henüz mevcut olmadığından dış etkinlik hakkı doğrulanmış sayılmaz.

P10 önerisindeki `group_placements`/`group_placement_events` ve P11 durum geçişleri, D02–D04 çıkarma/yasak anlamı ve D07 üyelik hakkı kararıyla kurulmalı. Eski 11 ACTIVE yerleşim bugünkü durum olarak taşınabilir; bilinmeyen geçmişe çıkarılma olayı uydurulmamalı. Bu prova hedef geçmiş modelini uygulamaz.
