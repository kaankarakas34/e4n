# P17 — Veritabanı kapasite invariantı

## Sonuç

Kapalı grup için başkan hariç en fazla 35 ACTIVE üye ve en fazla bir ACTIVE başkan kuralı migration0016 ile veritabanı yazma sınırında uygulanır. API, doğrudan SQL ve Supabase Data API aynı kuraldan geçer. Power team tabloları kapsam dışıdır.

## Uygulama

- `group_members` ACTIVE satırları için kısmi indeks.
- Uygulamayla aynı `(4020,35)` advisory transaction kilidi.
- Üyelik insert/update ve kullanıcı role/group_title update triggerları.
- 36. üye: `23514 / group_members_capacity_check`.
- İkinci başkan: `23514 / group_members_single_president`.
- Mevcut ihlalli veri: `23514 / group_members_capacity_existing_data`; migration ledger yazılmaz ve veri değiştirilmez.
- Trigger fonksiyonlarında boş search_path, şema nitelemesi, invoker hakları ve PUBLIC execute iptali.

## Doğrulama

- PostgreSQL 17.11 fresh16/repeat0 ve bilinen init.sql adoption PASS.
- İki eşzamanlı son koltuk yazımında tam bir başarı, bir constraint reddi.
- Doğrudan 36. üye, ikinci başkan ve dolu grupta başkan demotion reddi; satırlar korunur.
- Migration mevcut iki başkanlı grubu reddeder; veri düzeltildikten sonra tekrar başarıyla uygulanır.
- Grup kapasite kontratı, izole smoke, backup/restore, production build ve 28 paketlik web kabul runnerı PASS.

## Açık sınırlar

P10 grup bazlı liderlik ve çoklu aktif grup modeli kararı açık olduğundan, trigger geçici olarak mevcut `group_members.role OR users.role OR users.group_title` başkan yorumunu korur. Canlı Supabase'e migration uygulanmadı; P09 canlı şema/yedek/geçiş provası gereklidir. Geniş RLS/güvenlik denetimi Sprint 6'dadır.

Gerçek e-posta, ödeme, canlı veritabanı yazımı veya üretim dağıtımı yapılmadı.
