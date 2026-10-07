# P34 — Üyelik hatırlatma atomik teslim paketi

## Sonuç

Mevcut üyelik hatırlatma günleri (3, 1, -1, -3, -5) ve ACTIVE hesap filtresi korunarak zamanlanmış iş tek ve tekrar güvenli bir akışa alındı. Bu paket yeni gecikme, hak kısıtlama, shuffle kesimi veya ödeme sonrası açılma kuralı tanımlamaz.

## Uygulama

- Migration 0017: kullanıcı, üyelik bitiş tarihi ve tetik günü için benzersiz özel teslimat kaydı.
- Advisory transaction kilidi ile aynı anda tek tarama.
- Teslimat claim’i, uygulama içi bildirim ve son tetik işareti tek transaction.
- E-posta yalnız commit sonrasında bir kez denenir; SENT, UNKNOWN veya NO_EMAIL sonucu saklanır.
- SMTP sonucu belirsizse tekrar gönderim yapılmaz; yinelenen e-posta riski önlenir.
- Teslimat tablosunda RLS açık; PUBLIC, anon ve authenticated tablo yetkileri kapalıdır.
- Kullanıcının bildirimi mevcut kimlik doğrulamalı web API’sinden okunur.

## Doğrulama

- PostgreSQL 17 fresh17/repeat0.
- Beş mevcut tetik günü, ACTIVE filtre ve gün dışı kaydın dışlanması.
- Transaction rollback ve başarılı tekrar.
- Aynı çalışmanın tekrarı ve 10 eşzamanlı koşuda tek claim/tek bildirim.
- Kilitli ikinci çalışmanın sessiz SKIPPED sonucu.
- SMTP belirsizliği ve e-postasız kullanıcı durumlarının kalıcı kaydı.
- Gerçek Express/JWT bildirim okuma yolu.
- Sentetik backup/restore ve production build PASS.
- Tam web kabul runnerı: ilk 28 PASS/1 fixture FAIL; migration geri alma sırası düzeltildikten sonra temiz tekrar **29 PASS/0 FAIL**, `2026-10-07T12-06-02-614Z/report.json`.

## Açık sınırlar

Kullanıcının istediği beş günlük günlük e-posta ve beşinci gün hesap kısıtlama hedefi henüz uygulanmadı. Kesin süre başlangıcı, kesim saati, kısıtlanan haklar, shuffle uygunluğu, geç ödeme başvurusu ve ödeme sonrası yeniden açılma D07/D10 kapsamında açık. Canlı Supabase migration provası, üretim scheduler çağrısı, gerçek e-posta sağlayıcısı ve izleme de açıktır.

Canlı Supabase yazımı, gerçek e-posta/ödeme ve üretim dağıtımı yapılmadı.
