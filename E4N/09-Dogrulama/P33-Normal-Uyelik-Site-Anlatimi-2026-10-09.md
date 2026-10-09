# P33 — Normal üyelik site anlatımı

Görev: E4N-105. 9 Ekim 2026. Eğitim dışı web paketi; mevcut normal kayıt ve grup başvuru API/veri akışını destekler. Yeni migration yok.

## Teslim

- Ana sayfa, üyelik, nasıl çalışır, E4N nedir, SSS, hakkımızda ve topluluklar aynı kayıt → abonelik → grup keşfi/istek → başkan görüşmesi/kararı sürecini anlatır. Normal kayıt davetiye ve üyelik onayı istemez; şirket/VKN veya TCKN/vergi dairesi/adres/il zorunluluğu ve kalıcı vergi tekilliği açıklanır.
- Ortak dört adım kaynağı; kayıt CTA'ları normal forma gider. Üye hesabı, ücretli abonelik ve kapalı grup kabulü ayrıdır. Başkan hariç 35 kapasite korunur; il ayrımı henüz etkin değildir.
- WhatsApp/açık lonca kanalları ayrı hesap türü olarak sunulmaz. Pardus ayrı, ücretsiz ve seçici kalır. Ertelenen eğitim menüsü kaldırılır, eski eğitim girişleri üyelik bilgisine yönlenir.
- Eski değerlendirme URL'si normal kayda yönlenir; refId taşıyan mevcut ziyaretçi davetleri yeni ziyaretçi başvuru sayfasına aynı parametreyle gider. Dashboard ziyaretçi daveti korunur. Mevcut ziyaretçi API payload ve referans kaydı değişmez. E4N-162 normal üyelik referans yöntemi kararı ayrıca açıktır.
- Abonelik ekranından uygulanmamış eğitim erişimi, etkinlik indirimi ve öncelikli destek vaatleri çıkarılır. Puan/katılım için onaysız eşik, SLA veya yaptırım eklenmez; ücret kataloğu değişmez.

## Kabul

- `npm run build` PASS; mevcut büyük bundle uyarısı sürüyor. `membership-own-read` PASS.
- Gerçek yerel API/PostgreSQL/sahte sağlayıcı: fiyat, sahiplik, sağlayıcı kanıtı, callback tekrar/race, rollback ve üyelik/etkinlik/ziyaretçi ödeme etkileri PASS.
- Tarayıcı 23/23: 7 sayfa × 1440/390 genişlik; yatay taşma yok; dar menü; CTA ve beş zorunlu şirket/il alanı; eski değerlendirme/refId linkleri; iki ertelenen eğitim girişi; giriş/gerçek fatura kaydı/sahte banka/kalıcı abonelik/yeniden yükleme. `issues=[]`; final DB ACTIVE / 1_MONTH / 7.200 TL. Kalıcı test `server/test/public-membership-browser.js`; yerel kanıt `output/public-membership-*`.
- İlk testlerde SPA formunun yüklenmesi beklenmedi ve dar ekran gizli logo başlığı seçildi; test beklemeleri düzeltildi, son koşu PASS. İzole testte harici font/analytics çağrıları kasıtlı engellendi; canlı ödeme/mail/veri yazımı yok.

Bu paket tam web sürüm/güvenlik kabulü değildir. E4N-109/111 ve D07, referans, başkan istisnaları, shuffle kararları kalan kapsamlarıyla açık tutulur. Mobil/LMS ertelenmiştir.
