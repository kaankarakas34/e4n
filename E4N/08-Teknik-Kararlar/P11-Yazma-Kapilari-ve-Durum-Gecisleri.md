# P11 — Durum yazma kapıları ve geçiş sözleşmesi

**1 Ekim 2026. Durum:** mevcut kod/DB çelişkisini uygulanabilir işlere ayıran taslak. Canlı Supabase'de yalnız metadata ve toplu sayım okundu; durum kısıtı değiştirilmedi. Hedef olay tabloları [[P10-Fiziksel-Model-ve-Gecis-Matrisi|P10 fiziksel taslakta]].

2 Ekim'de dört etkin yazma yolunun HTTP yanıtı ve transaction sonrası satırları izole DB'de doğrulandı: [[E4N/09-Dogrulama/P11-HTTP-Durum-Yazma-Provasi|prova]].

| Yaşam döngüsü | Bugünkü kaynak ve gerçek kabul | Kodun yazma yolu / hata | Güvenli geçiş sınırı |
|---|---|---|---|
| Hesap | `users.account_status`; canlı 21 ACTIVE, 2 PENDING. | Kayıt/onay ve bazı ödeme yolları ACTIVE yazar. | Hesap durumu üyelik, grup veya ödeme hakkını tek başına kanıtlamaz. D07 sonrası ayrı üyelik dönemi. |
| E4N üyelik hakkı | `subscription_plan/end_date`; canlı bitiş tarihi dolu 0. | Ödeme/callback ve admin uzatma aynı kullanıcı alanlarını değiştiriyor. | Kanıtlı işlem, dönem ve iade etkisi tanımlanmadan eski ACTIVE hesaba hak verilmez. |
| Kapalı grup başvurusu | Ayrı geçmiş tablosu yok; `group_members.status` CHECK ACTIVE/REQUESTED. | Ret REJECTED yazıyor; `23514`. | Başvuru sonucu ayrı `group_applications` olayı; D08 yetkisi, D09 kapasite ve D02–D04 yasak kapısı belirlenmeden check genişletilmez. |
| Kapalı grup yerleşimi | Canlı 11 ACTIVE `group_members`; eski olay geçmişi yok. | Taşıma ve shuffle mevcut satıra INACTIVE yazar; `23514`. Silme yolu geçmişi yok eder. | Yerleşim/çıkış `group_placements` ve tekil olayla; aynı kullanıcının birden çok aktif koltuğu ve eşzamanlı son koltuk P17/P19'da engellenir. |
| Açık lonca | `power_team_members.status` CHECK ACTIVE/REQUESTED; canlı 1/1. | Ret REJECTED yazar; `23514`. | Kapalı grubun kapasite, görüşme ve yasak sözlüğü kopyalanmaz; P15 ayrı karar. |
| Ziyaretçi | `visitors.status` CHECK INVITED/ATTENDED/JOINED/NO_SHOW. | `/api/visitors/:id/convert` CONVERTED yazar; `23514`. | CONVERTED ile JOINED aynı anlam mı kararlaştırılır; ödeme/üyelik oluşturma etkisi ayrıca idempotent hale getirilir. |
| Kamu ziyaretçisi | `public_visitors.status` serbest metin; canlıda en az bir tanımlı küme dışı değer. | Başvuru ve admin durum yolları serbest değer kullanıyor. | Eski değerler sınıflandırılmadan `NOT NULL`/CHECK eklenmez; tekil geçiş ve hata yanıtı belirlenir. |
| Meslek/hizmet | `professions.status` canlı APPROVED/PENDING; kaynak init varsayılan ACTIVE. | Yeni meslek talebi PENDING, doğrudan admin eklemesi varsayılanla yazıyor. | Onaylı hizmetin tek değeri ve D05 kategori eşlemesi netleşmeden varsayılan değiştirilmez. |
| Bildirim | `notifications.type` beş değer; canlı kayıt 0. Okundu `read`. | İstemci FRIEND_REQUEST/FRIEND_ACCEPTED/MESSAGE bekliyor; P07 kanonik okuma çalışıyor. | Gerçek üretici ve yönlendirme kararı olmadan tip check genişletilmez; okundu kimlik kontrolü korunur. |
| Ödeme | `payment_transactions.status` canlı 2 SUCCESS/3 PENDING, beşinde de `user_id` NULL. | Callback statüden üyelik/etkinlik etkisi üretiyor. | D07 sahiplik ve işlem amacı; `merchant_oid`/callback tekrar anahtarı; eski işlemlere hesap ataması yok. |

## Uygulama sırası

1. D kararları ve P10 tablo anahtarları onaylanır; **her alan için ayrı** geçerli durum listesi ve `from → to` matrisi yazılır. Aynı `ACTIVE` kelimesi farklı hakları birleştirmez.
2. P09 gerçek veri yedeği üretim dışında geri yüklenir. Eski durum dağılımı ve yetim ilişkiler sayılır; bilinmeyen geçmiş açık işaretlenir.
3. Genişletici migration yeni olay/başvuru/yerleşim alanlarını ekler; eski check'leri ve kolonları hemen kaldırmaz. API önce yeni kayıtları tutarlı yazar, sonra eski okumalardan geçiş yapılır.
4. İzole testte kabul, ret, taşıma, shuffle, ziyaretçi dönüşümü, bildirim ve ödeme tekrar senaryoları kontrol edilir. Geçersiz geçişler atomik reddedilir; 500 yerine tanımlı alan hatası kullanılır.
5. Eski yazma yolları ve HTTP içindeki DDL kapatılıp sürümlü migration tek kaynak olur. Sonra eski kolon/check kaldırma ayrı sürümde değerlendirilir.

Bugün kesin bir `CHECK`/enum SQL'i yazılmadı; çünkü D01–D10 ve JOINED/CONVERTED gibi anlam ayrımları açık. `REJECTED` ve `INACTIVE` değerlerini mevcut check'e yalnız eklemek, eksik başvuru/çıkış olay geçmişini çözmez. Bu not [[P11-Durum-Sozlugu-Taslagi|P11 baz çizgisini]] uygulama sırasına bağlar.
