# P39 — Lonca başvuru ve üye yönetimi web

9 Ekim 2026. Ürün commit: 310e00a8022b96e99b6d7c30a08f87c755fc66d4.

## Teslim
- REQUESTED ve eski PENDING başvurular yönetici ekranında görünür. Ret DELETE ile yapılır; desteklenmeyen REJECTED yazımı kaldırıldı.
- Başvuru mevcut ACTIVE üyeliği ve joined_at tarihini korur. Mevcut account_status ödeme kontrolü korunur; bulunmayan lonca404, geçersiz giriş400.
- Onay/ret/çıkarma mevcut DB ADMIN veya ilgili loncanın ACTIVE PRESIDENT yetkisini doğrular; transaction, eksik kayıt404, canonical ACK, rollback ve eşzamanlı tek silme. Loncaya kapalı grubun35 sınırı uygulanmaz.
- AdminGroupDetail, GroupDetail ve GroupManagerDashboard ortak kilit/doğrulanmış sonuç/GET liste okumasını kullanır. Kayıp ACK veya liste hatası yeni yazımı kilitler; Listeyi kontrol et yalnız GET yapar. Yönetici aktif üye çıkarabilir.

## Kanıt
- İzole PG17 grup/lonca kontratı PASS. Rol, ödeme, replay, rollback,404 ve yarışlar doğrulandı.
- Lonca6/6 gerçek browser→API→PG ve final DB PASS: output/guild-roster/2026-10-09T07-00-28-092Z/report.json.
- Ortak hook nedeniyle kapalı grup7/7 regresyon PASS: output/group-roster/2026-10-09T07-00-56-707Z/report.json.
- Production build, TypeScript ve statik route sahipliği PASS; mevcut bundle boyut uyarısı sürüyor.
- İki final browser turunda kaynak değişmedi; commit dosyaları test edilen içerikle eşleşir. Turlar değişiklikli checkout üzerinde çalıştı, temiz committe yeniden tur iddiası yok.
- İlk browser turu2PASS/5FAIL: test seçicisi aynı isimli grup/lonca başvurusunu ayıramadı, ayrıca koşu sırasında kaynak değişti. İlk rapor korunur; final turun yerine kullanılamaz.
- Kalıcı kanıt: server/docs/guild-roster-web-acceptance-2026-10-09.json.

## Kalan
D08 nihai yetki modeli, üyelik5gün/grace/shuffle ayrıntıları ve P39 hedef kapsamı açık. Yeni lonca geçmiş şeması/politikası yok. Mobil/eğitim ertelenmiş durumda. Canlı DB, deploy, gerçek mail/ödeme yok; releaseReady=false.
