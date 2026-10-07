# Mobil ödeme geçmişi sözleşmesi — 2 Ekim 2026

## Denetim ve teslim

Mobil subscriptions ekranı `/payments/history` çağırıyor; bağlı API'de bu yol yoktu. `8275d77` ile ADMIN için salt okunur gerçek işlem listesi eklendi. Kaynak payment_transactions; id gerçek merchant_oid, amount kayıtlı tutarın sayısal karşılığı, status ham kayıtlı durum, created_at/updated_at gerçek kayıt alanları. Üye bağlantısı yalnız pt.user_id → users.id ile yapılır; NULL user_id için member NULL, action_data içinden sahiplik türetilmez. Hassas/serbest action_data yanıt dışındadır.

Bu liste ödeme sağlayıcısı mutabakatı veya üyelik haklarının doğrulanması değildir; tüm işlem kayıtlarını gösterir. Geçmiş kayıt durumu ve kullanıcı aktivasyonu farklı olabilir (önceki geç callback bulgusu açık). POST/ödeme callback/üyelik verileri değiştirilmedi; yeni finansal formül veya ürün kuralı seçilmedi.

Yerel mobil ekran başlığı Ödeme İşlemleri. Hata/bozuk yanıt alert/retry; hata halinde eski kayıt ve yanlış boş mesaj görünmez. Gerçek boş liste korunur. Tutar 0/₺0 korunur, bilinmeyen tutar/tarih/üye bağlantısı açık gösterilir. SUCCESS yeşil, FAILED kırmızı, PENDING/diğer durumlar nötr; bekleyen işlem başarısızmış gibi gösterilmez.

## Kanıt

- `server/npm run test:isolated` exit0: ADMIN200/tüm DB işlem sayısı; MEMBER403/oturumsuz401; linked user isim/kimlik gerçek eş; 0 tutar, NULL tutar/sahiplik korunur; action_data'da user_id olsa da sahiplik yaratılmaz; action_data yanıt dışı; GET öncesi/sonrası tam işlem satırları aynı.
- Fixture kayıtlar izole ortamda oluşturulup temizlendi; canlı Supabase/üretim ödeme çağrısı yok.
- Mobil TypeScript önce/sonra exit0. Gerçek bileşen kontrollü hook/API testi hata/retry, gerçek0/125, eksik tutar/tarih/üye, nötr PENDING, FAILED, eski satır gizlenmesi, bozuk kayıt ve gerçek boş geçti.
- Mobil patch reverse-check geçti; commit yönetilen dala push/temiz ağaç.

Mobil ayrı dirty/no-remote; ilgisiz kaynaklar korundu ve yalnız bizim patch/test yönetilen dalda. Gerçek mobil yayın deposu entegrasyonu/cihaz testi açık. Ana P32/PAR04 tamamlanmadı; web abonelik yönetimiyle işlev eşliği sağlandı denemez.

## Ayrı açık veri bulgusu

Mevcut web accounting/payments işlem geçmişi değildir: public_visitors form_data + users abonelik özeti birleştirilir, visitor eksik tutarında1000, üye eksik tutarında6000/7200/39000/69000 sabit varsayımlar var. users.created_at ödeme tarihi olarak kullanılır. Bu kaynağa history aliası verilmedi. Sonraki bağımsız denetim: muhasebe ekranında gerçek tutar/bilinmeyen kaynak ayrımı; eski sahipsiz ödemeye hak veya kullanıcı atfedilmez. D07 ücret/dönem/iptal politikası açık.
