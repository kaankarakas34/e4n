# P09 — Kayıt izin kolonları için sürümlü geçiş provası

**2 Ekim 2026.** Temiz sürümlü kurulumda etkin `POST /api/auth/register`, `users.kvkk_consent` kolonu bulunmadığı için izole API'de 500 döndü; 0 kullanıcı yazıldı. Bu dört izin kolonu canlı şema kataloğunda vardı, ancak kaynak `0001–0005` kurulumunda yoktu.

`0006_registration_consents.sql` yalnız eksik nullable `kvkk_consent`, `marketing_consent`, `explicit_consent`, `consent_date` kolonlarını ekler; geçmiş hesaba izin atfetmez. Atılabilir PostgreSQL 17.11'de:

- Temiz kurulum 6 migration uyguladı; tekrar 0. CLI tekrarında `applied=0 total=6`.
- Önceden `0001–0004` uygulanmış ve kullanıcı/ziyaretçi satırı olan şemada `0005` ve `0006` sırayla uygulandı; satırlar korundu ve eski kullanıcının dört izin alanı `NULL` kaldı.
- Aynı yükseltme sonrası boş şirketli `COMMUNITY_MEMBER` kayıt yolu 201 ve 1 kullanıcı verdi; yeni kayıtta üç izin alanı `false`, tarih dolu.
- `npm run test:isolated` geçti. Migration checksum ve bilinmeyen şema korumaları aynı testte geçti.

Bu, canlı Supabase yükseltme/geri yükleme provası değildir. Canlıda dört kolon zaten bulunduğundan `0006` canlıya uygulanmadı. Canlı 34 tablonun sürümsüz farklı şeması P09'un ayrı veri yedeği ve baseline kararı olmadan sürümlü kuruluma otomatik alınamaz.
