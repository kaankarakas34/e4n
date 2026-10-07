# PAR-02 — Mobil admin başvuru listesi sözleşmesi

## Mobil hata/boş ayrımı — `fb8338e` yama kaydı

Yerel `mobile/app/admin/applications.tsx` içinde iki `.catch(()=>[])` kaldırıldı. Yanıtlar array olmalı; istek hatası/bozuk yanıt görünür alert ve Tekrar dene gösterir, boş başvuru mesajı ve yanıltıcı0 sayacı göstermez. İki liste yalnız başarılı yanıttan sonra birlikte yazılır; retry loading durumundan sonra gerçek veriyi gösterir. Gerçek başarılı boş array hâlâ Bekleyen başvuru bulunmuyor gösterir.

Mobil gerçek kaynakta TypeScript kontrolü önce/sonra geçti. Yönetilen repoda `node test/mobile-applications.mjs <source-path>` gerçek bileşeni kontrollü hook/API/JSX ile ziyaretçi hatası, üye hatası, bozuk yanıt, tekrar, pending filtre ve gerçek boş listeden geçirdi. React Native cihaz/renderer testi değildir. `git apply --reverse --check` kayıtlı yamanın yerel değişikliğe uyduğunu doğruladı.

Mobil ayrı repo, çok sayıda önceden modified/untracked dosya ve uzak remote yok. Kaynak yerelde düzeltildi; mevcut değişiklikler korunup yalnız bizim diff `patches/mobile/admin-applications-load-error.patch` ve test `fb8338e` ile yönetilen web/API dalına gönderildi. Bu commit mobil uygulamanın yayın deposuna entegre/dağıtılmış olduğu anlamına gelmez. Yetkili mobil repo entegrasyonu ve cihaz/yayın doğrulaması açık; meslek onayı/karar zinciri de açık.

## Liste tamlığı — `cb89b72`

ADMIN `/users` yanıtı artık50 kayıtla kesilmiyor. Mobil başvuru ekranı yanıtı filtrelediği için isim sıralamasında50 sonrasındaki PENDING hesabı daha önce göremiyordu. Aynı dizisel yanıt ve arama sözleşmesi korundu; MEMBER sınırı50 ve account_status alanının gizlenmesi korundu.

İzole PostgreSQL/API testinde PENDING hesabından önce sıralanan51 ACTIVE fixture oluşturuldu. Admin yanıtı tüm DB sayımıyla eşleşti ve PENDING hesabı bulundu; isim filtresi51 fixture döndürdü. MEMBER yanıtı50 ve account_status yok; ziyaretçi MEMBER403/JWT'siz401 regresyonu geçti. Fixture hesapları test sonunda kaldırıldı. `npm run test:isolated`, `git diff --check` geçti. İlk uygulamada aynı isimli ORDER BY satırı yanlış route'a denk geldi; test bunu yakaladı, professions route'u eski haline geri alındı, yalnız users değişikliği son provada doğrulandı.

Sonraki eksikler: mobil hata→boş listesi, meslek onayı ve cihaz/yayın testi. Büyük admin listesi için sayfalama ileride iki istemci birlikte tasarlanmalı; bu teslimde mevcut array sözleşmesi korundu. Canlı yazma/dağıtım yok; ana P32/PAR kabulü açık.

## Uygulama — `c407834`

`GET /users` ADMIN oturumuna gerçek account_status alanını ekliyor; MEMBER yanıtına bu alan eklenmiyor. Mobilin mevcut filtresi sentetik PENDING başvuruyu artık buluyor. Mobil GET `/public-visitors` mevcut `/admin/public-visitors` handler/auth/ADMIN kapısının uyum yolu; iki yanıt aynı sentetik başvuru ID'sini içerdi. MEMBER403, JWT'siz401 doğrulandı. `npm run test:isolated` geçti; dal temiz/uzak dala gönderildi. Canlı yazma/Expo ekran testi yapılmadı.

Kalanlar: `/users` 50 kayıt sınırı büyük başvuru listesini eksiltebilir; mobil ekran `.catch(()=>[])` hatayı hâlâ boş sayıyor; meslek onayı alanları/karar akışı ve cihaz/yayın paketi ayrıca açık. Bu teslim yalnız durum alanı ve ziyaretçi liste yolu farkını kapatır. Aşağıdaki eski 0/404 gözlemleri tarihsel baz çizgisidir.

**2 Ekim 2026.** Mobil `mobile/app/admin/applications.tsx` ile bağlı `server/src/index.js` karşılaştırıldı. İki yol, aynı sentetik ADMIN JWT'siyle atılabilir PostgreSQL 17.11/API üzerinde denendi. Yayın mobil derlemesi bu kaynakla henüz eşlenmedi; canlı Supabase'e yazılmadı.

| Kanıt | İzole sonuç | Mobil kaynak etkisi |
|---|---|---|
| DB'de `account_status='PENDING'` sentetik kullanıcı | 1 satır | Gerçek başvuru sayısı sıfır değil. |
| `GET /api/users` | 200; sentetik kullanıcı listede, fakat yanıtında `account_status` ve `status` yok | Mobilin `m.status === 'PENDING' || m.account_status === 'PENDING'` filtresi 0 satır üretir. |
| `GET /api/public-visitors` | 404 | Mobil ziyaretçi başvurusu bu yolu çağırır ve `.catch(() => [])` ile hatayı boş listeye çevirir. |
| `GET /api/admin/public-visitors` | 200 | Bağlı admin yolu mevcut; mobilin kullandığı URL farklı. |

İki platform için hedef üye/ziyaretçi başvuru kaynağı, liste alanları ve admin karar işlemi P08/P32/PAR-04'te tek sözleşme olmalı. API hatası ile boş başvuru listesi ayrı gösterilmeli. Bu deney yalnız HTTP yanıtı ve mobil kaynak filtresini doğrular; Expo ekranının görsel sonucu burada sınanmadı.
