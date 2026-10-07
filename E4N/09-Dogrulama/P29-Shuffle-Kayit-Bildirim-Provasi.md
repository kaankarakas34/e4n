# P29 — Shuffle kayıt ve bildirim provası

**2 Ekim 2026.** Etkin API ve atılabilir PostgreSQL 17.11; `npm run test:isolated` başarılı. Canlı Supabase'e yazma ve gerçek bildirim gönderimi yapılmadı.

| İstek | HTTP | Veritabanı sonucu |
|---|---:|---|
| MEMBER `POST /api/shuffle/save` | 403 | Değişiklik yok. |
| ADMIN aynı kayıt isteği | 500 | ACTIVE grup ilişkisi **40→40**, test başkanının rolü `PRESIDENT` kaldı. İlk `INACTIVE` UPDATE'i CHECK'e takıldı; transaction geri alındı. |
| ADMIN `POST /api/shuffle/notify` | 404 | Etkin route yok. |

Web `AdminShuffle` önce `saveShuffle(items)`, ardından `notifyMembersOfShuffle(items)` çağırıyor; ikinci çağrı hata verirse genel “Kaydedilirken bir hata oluştu” mesajına düşüyor. Mevcut ilk çağrı zaten 500; bu hata düzeltildikten sonra ayrı 404 kullanıcıya kaydın da başarısız olduğu izlenimini verebilir. API önizleme sürümü/dönem kimliği veya tekrar anahtarı almıyor; tüm aktif ilişkileri `INACTIVE` yapıp yeni dağılımı plain INSERT ile yazmayı deniyor. P11/P20 durum modeli ve P28 sert koşulları olmadan P29 uygulaması güvenilir değil.

Hedefte onaylanan önizleme sürümü atomik uygulanmalı, eski/yeni ilişki sayımı ve olay kimliği kaydedilmeli. Bildirim aynı işlemin başarısı gibi sunulmamalı; ayrı tekrar güvenli teslim sonucu olmalı. Bu prova hedef davranışı uygulamaz.
