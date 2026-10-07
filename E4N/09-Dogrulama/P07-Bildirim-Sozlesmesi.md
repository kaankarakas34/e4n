# P07 — Bildirim veri ve istemci sözleşmesi

**1 Ekim 2026. Linear:** [E4N-79](https://linear.app/e4n/issue/E4N-79/p07-bildirim-veri-ve-istemci-sozlesmesini-birlestir). API/web kodu GitHub `codex/e4n-sprint1-foundation` dalında `2d64aa3` commit'i. Mobil hedef dosya, önceden commit edilmemiş ayrı `mobile/` çalışma ağacında düzenlendi; dağıtım yapılmadı.

## Hedef sözleşme

API bildirimi `id`, `user_id`, `title`, `message`, `type`, `read`, `created_at` döndürür. Canlı Supabase'de görülen `title/message/read` alanları temel alındı. Web bildirim store'u, gezinme açılır menüsü ve dashboard; mobil ana ekran aynı alanları kullanır. Bildirim INSERT yardımcıları `title/message/read` yazar; tekli ve toplu okundu yolları `read` günceller. Bağlı ana API'deki iki eski route tanımı aynı sözleşmeye geçirildi; tekrarların kaldırılması P40 kapsamında.

`0004_notifications_contract.sql`, kaynak kurulumun `content/is_read` tablosuna hedef kolonları ekler. Eski dolu kayıtta `content` metnini `message` olarak, `is_read` doğruluğunu `read` olarak korur; başlık yoksa `Bildirim` kullanır. Metni geri kazanılamayan satır varsa migration hata verir. Eski kolonlar geçişte tutulur, fakat API onları döndürmez. Canlıdaki zaten doğru biçimli kayıtlar değiştirilmeden kalır. Bu dosya yalnız **izole şema provası** koşucusuna bağlıdır; canlıya uygulanmadı.

## Doğrulama

| Test | Sonuç |
|---|---|
| `npm run test:isolated` (PostgreSQL 17.11) | Geçti. Dört sürümlü adım; 34 uygulama tablosu. |
| Eski `content/is_read` satırı geçişi | Metin ve okunmuş durum korundu; işlem rollback. |
| Canlı biçimli `title/message/read` satırı geçişi | Başlık, metin ve okunmuş durum değişmedi; işlem rollback. |
| İki sentetik bildirim listeleme | API 200; yalnız hedef alanlar, `content/is_read` yanıtı yok. |
| Tekli okundu ve toplu okundu | API 200/200; ilgili kullanıcının iki kaydı okundu, diğer kullanıcının kaydı değişmedi. |
| Web `npm run check` | Geçti. |
| Mobil `npx tsc --noEmit` | Geçti. |

Canlı `notifications` tablosunun denetim anında 0 satırı vardı. Buradaki test gerçek kullanıcıya bildirim/e-posta göndermedi; gönderim yardımcılarının SMTP yolu ayrıca doğrulanmadı. Mobil dosyanın sürümlenmesi ve gerçek cihaz testi P06/P32; üretim dağıtım doğrulaması P38 kapsamında açık. Canlı `notifications_type_check` salt okunur sorguyla doğrulandı: `SYSTEM`, `EVENT_REMINDER`, `INVITATION`, `GROUP_UPDATE`, `PAYMENT` izinli; yeni INSERT'teki `SYSTEM` uyumlu. Web gezinme kodundaki `FRIEND_REQUEST`, `FRIEND_ACCEPTED`, `MESSAGE` dalları bugünkü canlı check ile karşılanmıyor; bu ayrı özellik/durum kararıdır. Eski kolonların nihai kaldırılması ve kaynak check uyumu P09/P11 şema geçişinde ele alınmalı.
