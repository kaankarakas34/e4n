# P09 — Kısıt, indeks ve tetikleyici farkları

**1 Ekim 2026.** Kaynak: `codex/e4n-sprint1-foundation` dalındaki sürümlü `0001`–`0004` kurulumunun izole PostgreSQL 17.11 kataloğu ile canlı Supabase `e4n` PostgreSQL 17.6 kataloğu. Canlıda yalnız salt okunur `pg_catalog` sorguları yapıldı. `schema_migrations` tablo/kısıt/indeksleri kaynak sayımına dahil edilmedi.

| Katalog | İzole kaynak | Canlı |
|---|---:|---:|
| Kısıt | 111 | 113 |
| İndeks | 57 | 58 |
| Kullanıcı tanımlı tetikleyici | 1 | 1 |

Tablo, nesne türü ve nesne adıyla eşleştirildi; aynı adlı tanımlar için boşluk ve çift tırnak farkları normalize edildi. Kaynakta olup canlıda bulunmayan nesne yok. Canlıda kaynakta olmayan üç nesne:

1. `notifications.notifications_type_check`: canlı yalnız `SYSTEM`, `EVENT_REMINDER`, `INVITATION`, `GROUP_UPDATE`, `PAYMENT` tiplerini kabul ediyor. İzole kaynak kurulumunda tip kısıtı yok. Bildirim üreticileri ve istemci navigasyonu aynı tip sözlüğüne bağlanmalı.
2. `public_visitors.public_visitors_inviter_id_fkey`: canlıda `inviter_id → users.id` FK var; kaynakta yok. İlgili kayıtlar ve silme davranışı incelenmeden otomatik FK ekleme/kaldırma yapılmamalı.
3. `notifications.idx_notifications_user_id`: canlıda kullanıcı indeksli; sürümlü kaynak kurulumunda yok. Kaynak performansı ve canlı eşdeğerliği için sonraki migration tasarımına eklenmeli.

Aynı adlı iki kısıt farklı davranıyor:

| Kısıt | Kaynak | Canlı | Etki |
|---|---|---|---|
| `notifications_user_id_fkey` | `users(id)`; silme eylemi belirtilmemiş | `users(id) ON DELETE CASCADE` | Üye silindiğinde bildirimlerin tutulma/silinme davranışı farklı. Veri saklama kararı gerekli. |
| `ticket_messages_ticket_id_fkey` | `tickets(id) ON DELETE CASCADE` | `tickets(id)`; silme eylemi belirtilmemiş | Destek bileti silme davranışı farklı. Üretim kayıtları incelenmeli. |

Her iki ortamda `group_members.trg_group_members_unique_profession` aynı tanımla bulundu. Canlı `pg_get_functiondef` sorgusundaki `fn_check_group_profession_unique` gövdesi de kaynak `init.sql` ile aynı işlevsel koşulu kullanıyor: aynı grupta `ACTIVE` durumlu ve `users.profession` metni eşit bir üye varsa hata veriyor. Bu eski kontrol, hedef çoklu/çakışan hizmet kuralını sağlamaz. Karşılaştırma kolon varsayılanlarını, RLS/izinleri veya verinin kısıt uyumunu kapsamaz; bunlar otomatik baseline kabulü için ayrıca değerlendirilmelidir. [[P09-Kolon-Farklari|Kolon farkları]] ile birlikte P09 geçiş tasarımının girişidir. Canlı şemaya yazım yapılmadı.
