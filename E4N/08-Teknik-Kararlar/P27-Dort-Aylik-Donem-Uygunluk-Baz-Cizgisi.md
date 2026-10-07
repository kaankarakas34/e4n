# P27 — Dönem ve shuffle uygunluğu baz çizgisi

**2 Ekim 2026.** Kaynak ve canlı salt okunur önceki şema sayımı. Canlı Supabase'de yazma yapılmadı.

- Canlı tek `groups` kaydında `cycle_months=6`; kaynak `init.sql` varsayılanı da 6. Dört aylık hedefe hangi tarihte geçileceği bilinmiyor.
- `AdminShuffle` dönem bitişini başlangıçta **bugün** kabul ediyor; gösterilen shuffle gününü bu tarihten iki gün önce/hafta sonu düzeltmesiyle hesaplıyor ve `canShuffle=true` değerini demo için koşulsuz veriyor.
- Aday filtresi `users.account_status=ACTIVE` ve ADMIN dışı; P12 testinde bu statünün kanıtlı üyelik dönemi anlamına gelmediği gösterildi. `previous_group_id` gerçek geçmişten okunmuyor; örnek olarak döngüsel atanıyor. P19'da yerleşim geçmişi tablosunun bulunmadığı doğrulandı.
- Sunucu `POST /api/shuffle/save` dönem kimliği, uygun gün veya tekrar anahtarı doğrulamıyor; P11'deki `INACTIVE` kısıtı yüzünden mevcut aktif üyelerle 500/rollback bekleniyor.

D06 başlangıç/bitiş ve eski altı aylık grubun geçişini; D07 üyelik uygunluğunu; D02–D04 çıkarılma/yasak etkisini ve D09 kapasiteyi belirlemeli. Sonrasında gerçek dönem kaydı, aday anlık görüntüsü, kilitler ve tekrar güvenli uygulama P27–P29'da aynı sunucu sözleşmesine bağlanmalı. Bu not ürün kuralı seçmez.
