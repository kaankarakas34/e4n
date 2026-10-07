# P12 — Üyelik ve erişim kapısı baz çizgisi

**2 Ekim 2026.** `server/test/isolated-smoke.mjs` ile atılabilir PostgreSQL 17.11 ve etkin HTTP API üzerinde doğrulandı; `npm run test:isolated` başarılı. Canlı Supabase'de yazma yapılmadı.

| Kullanıcı verisi | Grup başvurusu | Lonca başvurusu | DB etkisi |
|---|---:|---:|---|
| `account_status=ACTIVE`, `subscription_plan=NULL`, `subscription_end_date=NULL` | 200 | 200 | Her iki ilişkide `REQUESTED` oluştu. |
| Aynı JWT ve kullanıcı, yalnız `account_status=PENDING` | 403 | 403 | Önceki başvuru durumu korunur. |

Etkin `POST /api/groups/:id/join` ve `POST /api/power-teams/:id/join` yalnız `users.account_status` okuyor. `ACTIVE` değerini ödeme tamamlanması olarak yorumlayan `PAYMENT_REQUIRED` mesajı var, fakat testte ödeme dönemi veya bitiş tarihi olmadan başvuru kabul edildi. Bu mevcut davranışın kanıtıdır; bütün canlı ACTIVE hesapların ödeme hakkı bulunduğu anlamına gelmez. Canlı baz çizgisinde 21 ACTIVE hesabın hiçbirinde üyelik bitiş tarihi dolu değil.

## P12 uygulama sınırı

- Kimlik/hesap durumu, kanıtlı E4N üyelik dönemi, kapalı grup yerleşimi, açık lonca ve grup başvuru yasağı ayrı kaynaklardan okunmalı.
- Sunucu bir hak hesabı üretmeli; web/mobil kendi `ACTIVE` yorumunu yapmamalı. Grup çıkışı bu üyelik dönemini değiştirmemeli; dış etkinlik/indirim hakkı P25'te aynı kaynağa bağlanmalı.
- Eski `ACTIVE` hesaplara bilinmeyen ödeme dönemi otomatik atanmamalı. D07 dönem, ücretsiz/eski üye, ödeme aksaması ve iade etkisini belirlemeli; P10 `membership_terms` anahtarları ve P09 geri yüklenebilir gerçek veri provası olmadan geçiş yapılmamalı.

Sonraki doğrulama: D07 kararı sonrası kanıtlı aktif, süresi dolmuş, ödemesiz eski ACTIVE, gruptan ayrılmış aktif üye ve iade edilmiş işlem için aynı sunucu hak sonucunu; web/mobil/API ve eşzamanlı ödeme tekrarında sınamak. Bu not P12'yi tamamlamaz.
