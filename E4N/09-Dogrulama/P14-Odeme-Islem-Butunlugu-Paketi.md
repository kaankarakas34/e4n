# P14 — Ödeme işlem bütünlüğü paketi

3 Ekim 2026. [E4N-125](https://linear.app/e4n/issue/E4N-125/p14-a-odeme-sahipligi-saglayici-dogrulamasi-ve-atomik-sonuc-paketini) Done; ana E4N-86 In Progress. [7a2346e](https://github.com/kaankarakas34/e4n/commit/7a2346e) yönetilen `codex/e4n-sprint1-foundation` dalına gönderildi. Veri/API/web sonucu birlikte teslim edildi.

## Akış ve kayıtlar

Ödeme başlat → kullanıcı/ziyaretçi işlem erişimini belirle → sağlayıcıdan sonucu sorgula → kayıtlı işlem/tutarı doğrula → ödeme ve bağlı sonucu tek DB transaction'da kesinleştir → ekran sunucudan durumu doğrular. Belirsiz işlemde yeni ödeme yerine durum kontrolü yapılabilir.

| Aşama | Uygulanan davranış |
|---|---|
| Başlatma | Üyelik/etkinlik authenticated JWT kullanıcısına bağlı; başka user_id 403, girişsiz 401. Tutar sayısal/pozitif/kuruş kesinliğinde; action.data.amount gerçek istek tutarına eşlenir. Yeni invoice UUID içerir. |
| Ziyaretçi erişimi | Başlatmada yalnız o invoice için 24 saatlik imzalı receipt; oturum JWT'sinden farklı imza anahtarı. Status yalnız receipt veya kayıt sahibi JWT ile; yanlış/ilgisiz 404. Yanıt yalnız invoice/status/amount/action_type, form/kart/kimlik detayı yok. |
| Sağlayıcı doğrulaması | Server-to-server token + checkstatus, invoice/hash alan sırası ve kayıtlı tutar eşleşmesi. Completed/100/Auth sonuç SUCCESS; bilinen Failed/68 FAILED. Pending, bilinmeyen ve preauth başarı sayılmaz. Timeout ve yapılandırma hatası kesinleşme üretmez. |
| Kesinleşme | Sağlayıcı I/O kilitten önce; işlem satırı FOR UPDATE. Üyelik güncelleme / etkinlik katılım-bilet / ziyaretçi ekleme ve SUCCESS aynı transaction. SQL hatası rollback, durum kontrolüyle yeniden uygulama; yeni charge başlatılmaz. |
| Tekrar ve yarış | Aynı başarılı invoice tekrarında sonuç korunur; geç fail SUCCESS'i düşürmez. Event satır kilidi ve attendance conflict kontrolü, ziyaretçi email/event advisory lock ve NULL event eşleşmesi tekrar kaydı önler. |
| Üyelik yönetimi | POST/PUT memberships ADMIN sınırı; MEMBER/PRESIDENT doğrudan bu yollarla ödeme akışını aşamaz. Eski NULL-owned ödeme action_data'dan kullanıcıya bağlanıp üyelik başlatamaz. |
| Web | Gerçek invoice/receipt ve API response shape. Popup mesajı doğru pencere ve aktif invoice ile eşleşir; yine de server status sorgulanmadan onSuccess yok. Belirsiz/yanlış tutarlı sonuçta yeniden charge yerine kontrol; stale oturum/action/close/unmount yanıtı uygulanmaz. |
| E-posta | Etkinlik onayı commit sonrası başlar. E-posta hatası ödeme rollback'i yapmaz; durable outbox/teslim garantisi bu kapsamda değil. Test ortamında SMTP çağrısı kapalı. |

Mevcut ödeme tablosu kullanıldı; yeni migration yok. Kaynak temiz kurulum 35 uygulama tablosu/7 sürüm. Eski ödeme satırlarına sahiplik atanmadı. Sağlayıcı URL/app ID/secret/merchant key açık ortam yapılandırması gerektiriyor; eski gömülü fallback değerleri kullanılmıyor.

## Doğrulama

- `node server/test/payment-flow.mjs`: atılabilir loopback PostgreSQL17, **yerel sahte Sipay HTTP sunucusu**, gerçek Express ve gerçek api.ts. Başlatma ve sahiplik/receipt; durum sorgu hash'ini bağımsız decrypt ederek invoice|merchant sırası; yanlış tutar/invoice, preauth/pending; aynı invoice eşzamanlı GET/POST success/fail; geç fail/end_date değişmezliği; gerçek SQL trigger hatasıyla rollback ve status-only retry; üye/etkinlik/ziyaretçi sonuçları; üye/başkan/admin rol sınırı. Geçti.
- `node test/payment-modal-lifecycle.mjs`: gerçek TSX kontrollü hooks/window/API. Popup açılmama/kapanma, source/invoice eşleşmesi, tekrar tık, status proof/unknown/yanlış hedef-tutar, durum kontrolü yeni pay çağırmaz, close/action/unmount geç yanıtı. Geçti.
- `node test/payment-api.mjs`: gerçek api.ts malformed initiation/receipt/status/invoice/amount ve HTTP hata sözleşmesi. Geçti.
- `npm run test:isolated` (server): Sipay env değerleri özellikle silinir; doğrulanmamış eski callbackler 503/PENDING ve üyelik değişmez. Diğer şema/API regresyonları geçti. Önceden kalan iş kuralı hata baz çizgileri hâlâ testte, hepsi düzeldi iddiası yok.
- Membership, EventDetail ve VisitorPaymentPage tüketici testleri; `npm run check`, `npm run build`, `git diff --check`: geçti. Derlemede mevcut büyük chunk ve veri güncelliği uyarıları kaldı.

Tüm izole fixture/container'lar kaldırıldı. Gerçek sağlayıcı, ödeme, SMTP, canlı Supabase yazma ve üretim dağıtımı yok. Bu gerçek tarayıcı/Expo veya Sipay sandbox doğrulaması değildir.

## Sözleşme kaynağı

[Sipay Check Status](https://apidocs.sipay.com.tr/check-status-25727396e0) durum sorgu yolu ve invoice/merchant hash sırası; [3D Secure Card Payment](https://apidocs.sipay.com.tr/3d-secure-card-payment-25721952e0) Auth ile bloke edilen preauthorization ayrımı. Sadece doğrulanmış settled Auth başarılı sayılır; yanıtta bilinmeyen durum varsa güvenli biçimde kesinleşmeden bırakılır. Gerçek kurulumun sağlayıcı response çeşitleri ayrı sandbox kabulü gerektirir.

## Kalanlar ve sonraki büyük paket

P14 ana kabulü açık: eski 5 sahipsiz ödeme için veri eşleme/saklama kararı ve gerçek yedekli prova; D07 fiyat/kampanya/yenileme-hak politikası; sunucuda yetkili fiyat kataloğu. Bu teslim mevcut istemci fiyat/promo seçimini taşımadı, mevcut etkinlik ödeme→PRESENT davranışını değiştirmedi. P12/P25/P11 hedeflerinde fiyat ve gerçek katılım ayrımı ayrıca tamamlanmalı.

Başlatma isteğinin belirsiz ağ sonucunda form dışına taşan kalıcı tekrar anahtarı/recovery henüz yok; receipt modal belleğinde ve 24 saat geçerli. E-posta outbox ve gerçek cihaz/sağlayıcı sandbox kabulü açık. Canlıya yayın hazır sayılmaz; P09 gerçek şema/yedek/adoption kapısı korunur.

Sonraki uygulama seçimi: karar gerektirmeyen veri/durum ve aktif API akışlarını paket halinde tamamla. Ücret/hak politikası seçmeden P12'yi Done yapma; D kararlarına bağlı üyelik→grup→puan/hak→shuffle sırasını koru. Bu teslimi küçük callback/ekran yamaları olarak yeniden ayırıp aynı işi tekrar yapma.
