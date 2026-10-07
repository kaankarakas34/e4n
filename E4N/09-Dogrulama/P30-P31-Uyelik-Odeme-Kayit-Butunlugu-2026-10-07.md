# P30/P31 — Üyelik ve ödeme kayıtlarının bütünlüğü

7 Ekim 2026. Eğitim dışı web paketi; üye ve yönetici ekranı, API, gerçek veri sözleşmesi ve bütün regresyon birlikte teslim edildi.

## Teslim

- Üye kendi hesabının durumunu, kayıtlı planını ve bitiş tarihini; hesaba bağlı ödeme işlemlerini, kalıcı faturaları ve hatırlatma sonuçlarını görür.
- Yönetici hesapları arar, aynı kayıt bütününü seçilen hesap için inceler. Hesaba bağlanmamış ödemeler ayrıca sayılır; action_data içindeki kimliklerden sahiplik tahmin edilmez.
- Hesap durumu ve tarih ayrı bilgiler olarak gösterilir. ACTIVE ama bitişi geçmiş eski kayıt aynen korunur. Plan, işlem durumu ve ondalık tutar değiştirilmez; para birimi uydurulmaz.
- Faturalar mevcut yetkili dosya API'sinden indirilir, boyut doğrulanır. UNKNOWN gönderim sonucu başarı gibi gösterilmez.
- Sunucu güncel DB rolünü ve sahibi doğrular; tek read-only repeatable-read snapshot içinde hesap, toplamlar ve detaylar okunur. Özel no-store yanıt; hata gizli provider verisi sızdırmaz.
- Web geç hesap/oturum yanıtlarını atar, önceki hesabın detaylarını temizler; yükleme, hata, yenileme ve yetki reddi vardır.
- Hesap listesi en fazla5000, ekranda arama ile100; her detayda son100 ve gerçek toplam ayrı görünür. Fazlası sessizce tam liste olarak sunulmaz.

## Doğrulama

- Odaklı membership-records-contract PASS: kendi/başka hesap, sahte ADMIN JWT, silinen/düşürülen actor, hatalı query/UUID, eksik hesap, NULL/eski kayıtlar, DTO, decimal, eşzamanlı yazar karşısında snapshot, SQL500/recovery, 102 ödeme/son100, yetkili PDF ve yazmasız okuma.
- Bütün API/veri regresyonu32PASS/0FAIL: output/web-acceptance/2026-10-07T18-02-15-840Z/report.json.
- Gerçek App/Vite→Express/JWT→izole PostgreSQL17 tarayıcı34PASS/0FAIL: output/web-browser/2026-10-07T18-06-08-150Z/browser-report.json. Üye/admin kayıt ekranları ve gerçek fatura indirme; üye admin yolu veri göstermiyor. Son DB: iki ödeme, sahipsiz satırNULL, bir fatura değişmeyen35byte, bir UNKNOWNhatırlatma; önceki shuffle37uniqueACTIVE/tek geçmiş ve diğer web akışları korundu.
- Admin/üye ekran görüntüleri incelendi. İlk fixture başlangıcı geçici connection termination ile tamamlanmadı; temiz tekrar yukarıdaki kabulü verdi.
- Build, TypeScript, syntax ve diffPASS. Mevcut büyük bundle ve eski Browserslist metadata uyarıları sürüyor.
- Yeni migration yok; source zinciri19. Sentetik restore45table ve mevcut veri/catalog/ACL/RLS/trigger kontrolleriPASS. Bu üretim verisi provası değildir.
- Rapor baseHEAD4e1d115'tir; bu paketin commit'i rapordan sonra oluşturuldu. Testler bu nottaki kaynak değişikliklerini kapsar; basehash tek başına teslim hash'i değildir.

## Açık sınırlar ve sıradaki işler

P30/P31/P14/P37 ana hedefleri DONE değil; releaseReady=false. Bu paket görünür kayıt bütünlüğünü tamamlar. Ücret/dönem, beş gün başlangıcı, kısıtlanan haklar, ödeme sonrası açılma ve kesin shuffle kesimi açık kararlar olduğu için yeni hak/borç/uygunluk kuralı uygulanmadı. Beş günlük günlükmail/kısıtlama bu paketin çıktısı değil; mevcut triggerlar korunur. Grup koltuğu/sınıflandırma/kabul yetkisi ve puan/çıkarma kuralları da açık.

Canlı Supabase yazma, üretim dağıtımı, gerçek ödeme/e-posta yok. Owned fixture süreçleri kapalı. MobilSprint7 ve LMS8enson. Sonraki XL hedef üyelik/haklar ve grup akışıdır; karar bağımlılığı olan davranışlar uydurulmaz. Bağımsız bütün web kabulü ve kaynak/üretim şeması geçiş kapıları ilerletilir.
