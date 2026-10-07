# P17 — Grup kabul, taşıma ve kapasite uygulama paketi

5 Ekim 2026. Commit/push: [6d7da31](https://github.com/kaankarakas34/e4n/commit/6d7da316768433a4935c93060960705571af7b95).

## Teslim edilen kapsam

- Başkan hariç 35 ACTIVE üye; REQUESTED başvuruları aktif koltuk tüketmez. Lonca/power_team bu sınırın dışındadır.
- Grup kabulü, üye taşıma, rol atama, admin kullanıcı rolü değişikliği ve iki shuffle/save yazma yolu ortak işlem kilidi/transaction/commit öncesi kapasite kontrolü kullanır.
- Son koltuk yarışında yalnız biri başarılı; dolu gruba taşıma eski üyeliği korur. Başkan muafiyetini kaldırıp 36. normal üyeyi oluşturacak rol değişimi geri alınır.
- Aktif üyenin başvuru tekrarı üyeliğini REQUESTED'a düşürmez. Taşıma tekrarı joined_at tarihini değiştirmez; eski profession trigger'ın INSERT öncesi aynı üyeyi reddetmesi UPDATE-first ile önlenir.
- Web katalog/detay normal üyeleri, başkanı ve boş koltuğu ayrı gösterir. Kapasite hatası başarılı kabul gibi görünmez; talep korunur. Güncel DB rolü ve grubun başkan sınırı testlidir.
- CLI üretilen migration0015 mevcut API'nin INACTIVE durumunu ve nullable group_title alanını sürümlü zincire ekler. Eski migration dosyaları değiştirilmez, rol/status/satır backfill yapılmaz.

## Doğrulama

PG17: fresh15/repeat0/41 uygulama tablosu;0014→0015 mevcut satır korunması; bilinmeyen eski status doğrulama hatası/constraint+ledger rollback/recovery. Gerçek Express/JWT:35üye+1başkan, son koltuk200/409, transfer/rol/shuffle tamrollback, tekrar, geçersiz/boş/duplicate shuffle, currentrole/foreignpresident/anon sınırları, lonca36 etkilenmez. Typed katalog/detay PASS.

Gerçek web componentleri izole yanıt fixture'ıyla browser passed=true:35/35+1başkan,1PUT/409, bekleyen başvuru korunur, hata gösterilir, boş koltuk0, hesap değişiminde veri temizlenir. Bu browser fixture testi ile gerçek API/DB sözleşme testi ayrı kanıtlardır.

Build PASS (mevcut bundle/browser veri uyarıları sürer); static/runtime163route/18provider/17retainedlegacy PASS. Genel izole smoke/knowninitadoption, ödeme localfakegateway, grup settings, meeting, messages, support upgrade,15sürüm sentetik backup/restore42tablo/rowhash/PDFcorruption/cleanrollback PASS. Eski smoke registration message assertion önceki versioned ACK'e düzeltildi; geçiş fixture'ları tam sürüm zincirine güncellendi.

## Açık kalanlar

P17 ana görev In Progress: uygulama kilidi arbitrary directSQL/Supabase Data API yazısını koruyan DB trigger/constraint değildir. P10 global users.role/group_title ile group_members.role'ın tek grup yetki modeline dönüşümü ve çoklu aktif grup modeli açık. Mevcut yorum üç alandan PRESIDENT'ı tek kişi olarak sayar; birden fazla başkan kaydı açık hata verir, fazladan muaf koltuk yaratmaz. Eski fazla kapasiteli/çelişkili gruplar otomatik temizlenmez.

P16/D05 hizmet sınıflandırması ve status-update profession açığı; P18/D08 görüşme/son kabul; D06 shuffle ödeme kesimi/önizleme/atama geçmişi/notify; puan/dönem kuralları ayrı açık. Bu paket shuffle ürününü veya broadSEC'yi tamamlamaz. P09 gerçekcanlışema/yedek/cutover hâlâ açık. Ücret/dönem,5gün başlangıcı/kısıtlanan haklar/ödeme sonrası açılma ve tamshufflecutoff kararı uydurulmadı.

Canlı yazma, gerçek e-posta/ödeme ve üretim dağıtımı yok. Kaynak yönetilen dalda, HEAD/origin eşit. Kendi browser/Vite/test containerları kapatıldı; output ve CLItemp scratch commit'e alınmadı.
