# WEB-04 — Birebir mesaj veri/API/web paketi

**4 Ekim 2026. Linear E4N-137 Done.** Commit [47943b1](https://github.com/kaankarakas34/e4n/commit/47943b1), `codex/e4n-sprint1-foundation` dalına gönderildi. P39/E4N-111 ana görev açık.

## Teslim

Profilde Mesaj Gönder doğru `/messages?recipient=<id>` alıcısını açıyor. Mesaj sayfası gerçek konuşma listesini, seçilen bağlantıyı, mesaj geçmişini ve önceki sayfaları okuyor. Mesaj kaydı JWT sahibi ve kabul edilmiş iki bağlantı katılımcısı ile sınırlı; yönetici rolü başka kişinin konuşmasını okumaya izin vermiyor.

Yeni `direct_messages` tablosu mesaj metni, iki katılımcı, sender'a bağlı tek gönderim anahtarı ve zamanı saklıyor. 12 eşzamanlı aynı gönderim tek satır; aynı anahtar/metin/alıcı tekrarında eski kayıt, farklı içerikte 409. İşlem ancak COMMIT sonrası doğrulanıyor. INSERT sonrası hata tüm yazmayı geri alıyor. Mesaj sayfaları 50 kayıtlık timestamp/UUID cursor kullanıyor; mikrosaniye değerleri SQL içinde karşılaştırılıyor, tarih eşitliğinde mesaj kaybı yok.

Ekranda yüklenme, gerçek boş durum, hata ve yeniden deneme var. Oturum, token veya alıcı değişince eski mesaj/draft görünmüyor; geç yanıt ve unmount sonucu atılıyor. Gönderim ve geçmiş sayfa okumaları senkron kilitli. Belirsiz send key/metni owner/recipient sessionStorage kaydında tutuluyor; tekrar aynı anahtar kullanıyor. Reload mevcut mesajı bulunca taslağı temizliyor. ACK sonrası liste hatasında ikinci send yapılmıyor. Eski bir yanıt yeni pending key'i temizleyemiyor.

## Şema ve canlı sınırı

CLI 2.119.0 ile oluşturulan `server/supabase/migrations/20261004160911_direct_messages.sql` mevcut checksum ledger'ında **0011_direct_messages** olarak aynı kaynaktan çalışıyor. İzole son durum **11 sürüm / 38 tablo**. Fresh kurulum, mevcut 10 sürümden tek migration ve repeat=0 doğrulandı. Eski upgrade testleri yeni son duruma uyarlandı; eski notlardaki 10/37 tarihsel.

RLS açık; PUBLIC ve mevcut anon/authenticated grant'ları kaldırılıyor, doğrudan istemci politikası yok. Mevcut trusted backend PostgreSQL owner/bypass rolü kullanılıyor; canlı geçişte DB rolü ayrıca doğrulanmalı. Kullanıcı FK'ları RESTRICT: mesaj geçmişi olan üye silmesi rollback yapar, sessiz mesaj silinmez. Nihai saklama/silme politikası P10 kapsamında açık.

**Canlı Supabase migration uygulanmadı.** Bu kaynak teslimi canlıya geçiş onayı değildir. P09 canlı şema/geçiş/yedek ve Sprint 6 release/güvenlik kapıları açık. Runtime DDL, üretim deployment, SMTP/gerçek ödeme testi yok. Mobil değiştirilmedi. Realtime, read receipt, dosya eki ve mesaj bildirimi eklenmedi; D01–D10 kuralları seçilmedi.

## Kanıt

| Doğrulama | Sonuç |
| --- | --- |
| `node server/test/messages-contract.mjs` | Gerçek web bearer → aktif Express → izole PG17; fresh/10→11/repeat; default client grant revoke ve grant sonrasında RLS deny; owner/friend/participant/ADMIN sınırı; 12 send/tek row; replay/conflict; ayrı konuşmalar; 50/7 cursor/tarih tie; GET no-write; INSERT rollback/retry; RESTRICT FK geçti |
| `node test/messages.mjs` | Gerçek TSX/typed servis kontrollü hook testi: lost ACK/reload/same key, çift tıklama, committed refresh/read failure, recovery, owner/token/route/unmount ve malformed response geçti |
| Şema/akış regresyonları | isolated-smoke, meeting-contract, support-flow, payment-flow, connections-contract ve connections TSX exit 0 |
| Derleme | Son `npm run check`, `npm run build`, staged diff check exit 0; mevcut bundle/browsers veri uyarıları kaldı |
| Playwright CLI | Gerçek ekran/auth store/router/API, izole HTTP/PG fixture'larıyla loopback Vite harness: ilk read error/retry, doğru boş alıcı, commit sonrası response failure, reload'da tek mesaj recovery + güncel konuşma listesi. Üretim E2E değil |
| Git | Yerel/remote HEAD `47943b1a0ff36f100eee36dfb7b5636ab58ee6c3`; tracked temiz, yalnız output kanıtları |

`output/playwright/messages-recovered.png` görseli incelendi. Kendi tarayıcı/Vite/konteynerleri kapatıldı. Sözleşme: `server/docs/messages.md`.

## Sonraki web sırası

1. **Belge yaşam döngüsü:** DocumentsPage gerçek dosya yerine `url='#'` gönderiyor, API/model yok; izinler istemcide filtreleniyor. Gerçek kalıcı dosya hedefi, metadata, sahip/rol görünürlüğü ve indirme/yazma/silme sözleşmesi birlikte çözülecek. Sahte yükleme başarısı ile kapatılmayacak; canlı bucket/deploy yazılmayacak.
2. **Kursa bağlı sınav yönetimi:** mevcut `exams.course_id NOT NULL` ile kurs seçmeyen formu eşle; sorular ve sınav attempt geçmişini koruyarak API/ekran/izole kabulü birlikte tamamla.
3. Kararları hazır yönetici akışları. Üyelik/şirket/grup/shuffle D bağımlılıklarını koru. Yapılabilir web işi varken mobil başlatma.

Güncel Linear 81 kayıt: **26 Done / 20 In Progress / 35 Backlog**; ana ve alt görev sayımı ürün yüzdesi değildir.
