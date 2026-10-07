# P11 — HTTP durum yazma provası

**2 Ekim 2026.** `codex/e4n-sprint1-foundation` dalında `server/test/isolated-smoke.mjs`; yalnız atılabilir PostgreSQL 17.11 konteyneri. `npm run test:isolated` başarılı. Canlı Supabase'de yazma yapılmadı.

| Etkin API işlemi | HTTP | İşlem sonrası veritabanı | Gözlem |
|---|---:|---|---|
| `PUT /api/groups/:id/members/:userId` ile `REJECTED` | 500 | Başlangıçtaki `ACTIVE` kaldı | `group_members` CHECK bu değeri reddediyor. |
| `PUT /api/power-teams/:id/members/:userId` ile `REJECTED` | 500 | Başlangıçtaki `REQUESTED` kaldı | Lonca CHECK bu değeri reddediyor. |
| `POST /api/admin/move-member` | 500 | Kaynak `ACTIVE`; hedefte 0 üyelik | İlk `INACTIVE` UPDATE'i reddediliyor; işlem geri alınıyor. |
| `POST /api/visitors/:id/convert` ADMIN | 500 | `ATTENDED` kaldı; 0 kullanıcı oluşturuldu | `CONVERTED` CHECK'te yok; transaction geri alınıyor. |
| Aynı dönüşüm MEMBER | 403 | Kayıt değişmedi | Etkin handler'daki ADMIN kapısı çalışıyor. |

Önceki doğrudan SQL denemeleri dört geçersiz durumun her birinde `23514` döndürmüştü. Bu ek prova gerçek HTTP yanıtını ve işlem sonrası satırları ölçtü. H04 shuffle yazma yolu burada çağrılmadı; `INACTIVE` kısıtı doğrudan SQL ve taşıma yolunda gözlendi. Üretimde herhangi bir kullanıcı işlemi sınanmadı.

Bu baz çizgisi hatayı düzeltmez. Başvuru ret olayı, aktif yerleşimden çıkış ve ziyaretçi dönüşümünün ürün anlamları D kararları/P10 veri modeliyle kesinleşince API, migration ve istemci sözleşmesi birlikte değiştirilmeli. O zamana kadar yalnız CHECK'e yeni değer eklemek olay geçmişini sağlamaz.
