# P37 — Güncel başlangıç dahil web kabulü

9 Ekim 2026. E4N-109 In Progress. Yeni küçük teslim görevi açılmadı; mevcut eğitim dışı web kabulünün bağlı paketi.

## Değişiklik

- Tek prova runnerı gerçek normal kayıt, site/abonelik ve başkan görüşme/karar tarayıcılarını da çağırır. Her birinde tamamlanmış rapor, tüm PASS senaryoları, son DB kaydı ve izole ortam beyanı zorunlu.
- Ödeme kontratının aynı gerçek Express/PG ve sahte sağlayıcı altyapısına kalıcı browser helper eklendi; harici banka yok. Async CLI çağrısı sağlayıcının yanıtlarını bloke etmez; browser/Vite kapanır. Site masaüstü/dar ekran kontrolü aynı parçadadır.
- Kaynak özeti `shared` fiyat kataloğunu kapsar. Yeni kayıt/grup kontratları tarayıcı kanıtını makinece okunabilir rapor referansıyla verir.
- Eski grup/geçmiş testleri doğrudan başkan onay ekranını ve aboneliksiz yeniden başvuruyu bekliyordu. Eski REQUESTED satırın yönetici/başkan kaldırılması ayrı uyumluluk testi; yeni kabul görüşme akışıyla doğrulanır. Test hazırlığı private loopback fixture kontrolüyle yapılır; kullanıcı API'sinin abonelik şartı gevşetilmedi. Eski raporlar korunur.

## Doğrulama

- İlk kök prova: **41/41 API/veri**, build ve **89/89 ana web browser/finalDB PASS**. Eski grup browser beklentisinde durdu: `output/web-rehearsal/2026-10-09T18-18-51-943Z/report.json`, technicalPass=false korunur.
- Test uyumu düzeltildikten sonra odaklı taze koşular: grup7/7, lonca6/6, geçmiş/aktör6/6, normal kayıt3/3, site/abonelik23/23, grup başvurusu/görüşme/karar3/3; son DB ve owned fixture cleanup doğrulandı. Ana web89 ile **137/137** browser senaryosu birleşik kanıt; yeni bir donmuş bütün kök prova PASS iddiası değildir.
- Uygulama/ortak fiyat/migration/config/dependency kaynakları e3350ba base ile eşit (`git diff --quiet`); Dosya sayısı ve SHA256 taşınabilir raporda. Değişiklikler test/prova/kanıt dosyalarında. Aynı app davranışını yeniden test etmek için 41API/89browser gereksiz tekrar edilmedi.
- `server/docs/web-current-acceptance-2026-10-09.json` tek özet: tüm ayrı rapor referansları, application SHA256, ilk başarısız kök, singleFrozenRootPass=false. Syntax/diff PASS. Mevcut bundle uyarısı sürer. Üretim/env/ödeme/mail/veri yazımı yok; bu tur yeni canlı dağıtım gerektirmeyen test altyapısıdır.

## Açık kapsam

E4N-109 releaseReady=false ve In Progress. D07 başlangıç/kısıtlanan haklar/açılma, gerçek sağlayıcı sandbox, üyelik referans yöntemi ve başkan istisnaları, puan/çıkarma/engel/shuffle kararları, üretim planlayıcı/alarm ve Sprint6 kapsamlı güvenlik açıktır. Önceki canlı şema geçişi tamamlanmıştır; eski API raporundaki P09 genel OPEN satırı bu teslimin yeniden yapılmasını gerektirmez. Mobil/LMS en son. P33 ve başlangıç alt teslimleri yeniden uygulanmaz.
