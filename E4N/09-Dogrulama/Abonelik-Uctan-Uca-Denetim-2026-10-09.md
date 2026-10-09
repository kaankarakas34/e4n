# Abonelik uçtan uca denetimi — 9 Ekim 2026

Görev: E4N-163 (In Progress / Acil). İstek: üyenin girişten abonelik satın almaya ve hak kazanmasına kadar sorun denetimi, ardından kullanıcı talebiyle düzeltme. İlk denetim bulguları aşağıda tarihsel kanıttır.

## 9 Ekim düzeltme teslimi

### Canlı yayın — kullanıcı yetkisiyle

`be4045006469f08f1f39676aba72e66c50c7c923` main'e gönderildi. Production `dpl_4zfBfAXLt7tdRBPbi5UVGjFXBzv2` READY; www.event4network.com yeni `/assets/index-CE-pxV6f.js` sunuyor. Yeni abonelik durum metni var, keyfi E4N3000 kodu yok; anonim own-profile ve payment API 401. Kanıt `output/subscription-production-release.json`. Gerçek ödeme/mail veya canlı fixture kaydı yapılmadı. Aşağıdaki önceki “deploy yapılmadı” cümlesi ilk yerel teslim zamanına aittir; E4N-163 kalan D07/sandbox kapsamıyla hâlâ açıktır.

- Fiyat: mevcut yayımlanmış 7.200 / 39.000 / 69.000 TL tek ortak katalogda; server membership plan/tutar eşleşmesini banka çağrısından önce zorunlu tutuyor. 1 TL ve yanlış paket, katalog dışındaki yeni 4/8 aylık satış, onaysız indirim kodu reddediliyor. Eski 4/8 aylık plan kayıtları okunabilir ve önceden başlatılmış işlemin sağlayıcı doğrulaması korunur. Ücret kararı değişmedi. Tarayıcıdaki keyfi 3.000 TL promo mantığı kaldırıldı; üyelik referans ilişkisine dokunulmadı.
- Yenileme: gelecek bitiş tarihi varsa buradan, yoksa bugünden satın alınan ay eklenir. Kullanıcı satır kilidi farklı faturaların eşzamanlı tahsilatında süre kaybını önler; UTC ay sonu geçerli son güne sınırlandırılır. Kalan sürenin korunması dışında paket dönüşümü/ücret farkı kuralı eklenmedi.
- Kısıtlama: ACTIVE/UNSUBSCRIBED/PENDING dışındaki hesapta yeni ödeme başlatma 403. Ödeme başlatıldıktan sonra gelen kısıtlama, sağlayıcı SUCCESS sonrası da korunur; tahsilat kaybolmadan dönem kaydı yazılır, kısıtlı hesap gruba başvuramaz.
- Ekran: kendi güncel profilindeki hesap durumu + plan + bitiş birlikte gösterilir. Aktif/süresi dolmuş/abonesiz/kısıtlı/bilinmeyen ayrılır; persist edilmiş admin liste verisi kullanılmaz.
- Kabul: payment-flow gerçek API/PG/sahte sağlayıcı PASS (yanlış fiyat/kodda banka çağrısı yok, doğru üç plan tutarı, farklı iki eşzamanlı fatura, 31 Ocak→28 Şubat→28 Mart, ödeme sonrası askı korunması, süresi bitmiş abonelik ve eski ownership/idempotency/rollback kontrolleri). Own-read, modal lifecycle, ödeme API kontratları PASS. `npm run build` PASS; mevcut bundle büyüklüğü uyarıları sürüyor.
- Gerçek yerel browser/API/PG kabulü 3/3; fatura→kart→sahte banka sonucu→kalıcı ACTIVE/1_MONTH/7.200 TL→reload PASS; Durum artık `Abonelik aktif`, issues=[] ve screenshot doğrulandı. Yerel kanıtlar `output/subscription-fix-*`; gerçek ödeme/mail yok.
- **Açık kalan:** D07 gecikmenin başlangıcı/kısıtlanan haklar ve üretim job/env etkinleştirmesi; gerçek sağlayıcı sandbox yetkilendirmesi. Bu düzeltme için production deploy yapılmadı. E4N-163 bütün kapsamıyla DONE değil. Günlük mail kuralı için kullanıcıya tek açıklama sorusu gönderildi; yanıt olmadan varsayım/gerçek mail yok.

## Öncelikli bulgular

| Öncelik | Bulgu | Kanıt / kabul için gereken |
| --- | --- | --- |
| Kritik | Sunucu abonelik tutarını istemcinin `total` alanından alıyor; paket fiyatı/kampanya yetkisi doğrulanmıyor. | Gerçek API + izole PG + sahte sağlayıcı: 12_MONTHS için 1 TL işlemi SUCCESS ve 12 aylık abonelik. Gerçek bankanın 1 TL tahsil ettiği iddia edilmez. Sunucuda güvenilir fiyat/kampanya kaynağı gerekli; ücret kararı uydurulmaz. |
| Yüksek | Yeni ödeme mevcut gelecekteki bitişi üzerine eklenmiyor; bitiş bugünden yeniden yazılıyor. | 10 ayı kalan hesapta 1 aylık ödeme örneğinde 273 gün kayboldu. Yenileme/paket değişimi kuralı açıkça belirlenip satın alınmış süre korunmalı. |
| Yüksek | Ödeme tüm hesap kısıtlamalarını ACTIVE'e çeviriyor. | Önceden alınmış token ile SUSPENDED hesap ödeme sonrası ACTIVE. Borç kısıtlaması ve yönetim/disiplin kısıtlaması ayrılmalı. |
| Orta | Üyelik ekranının Durum alanı sabit `Veri yok`. | Membership.tsx durum kaynağını kayda almıyor ve sabit metin gösteriyor; ödeme kanıtı/dönem/hak durumu ayrı ve anlaşılır gösterilmeli. |
| Operasyon | Günlük hatırlatma çalıştırma yolu mevcut Vercel yapılandırmasında etkin görünmüyor. | vercel.json crons yok; VERCEL'de node-cron kapalı; production env metadata'da WEB_JOB_INVOCATION_ENABLED ve CRON_SECRET yok. Uygulama dışındaki zamanlayıcı ayrıca doğrulanmadı. 5 gün günlük mail kararı ve açık grace/hak kuralları uydurulmadan çalıştırma kabulü gerekir. |

## Geçen kontroller

- `server/test/payment-flow.mjs`: gerçek Express/PG, sahte sağlayıcı; işlem sahipliği, sağlayıcı hash/tutar kanıtı, başarısız/preauthorization hakkı açmama, tekrar/eşzamanlı callback, rollback/retry/recovery, sıradan üyeye admin bypass engeli PASS.
- `test/payment-modal-lifecycle.mjs`: çift gönderim, popup engeli/kapanma, stale bağlam, sonuç kurtarma, sahte başarıya göre hak vermeme PASS.
- `test/payment-api.mjs` PASS.
- Gerçek yerel web tarayıcısı + API/PG: normal giriş → üyelik → fatura ön dolumu/kaydı → kart formu → sahte banka sonucu → sunucuda sağlayıcı durum doğrulaması → kendi profilini yeniden okuma → sayfa yenileme PASS (3 akış). Final DB: 1_MONTH, ACTIVE, 7.200 TL, 09.11.2026 bitiş. Ödeme sonrasında plan/tarih görünürken Durum hâlâ `Veri yok`; screenshot da doğrulandı. Banka sonucu yalnız yerel test endpoint'inden verildi; gerçek Sipay/3DS değil. İlk harness CORS/alert senkronizasyonu düzeltilmeden geçen tam browser kabulü sayılmadı; son turda Result + final DB assert mevcut.
- `test/membership-own-read.mjs`: profil okuma/hata/retry/hesap değişimi izolasyonu PASS. Stale router test mock'u `useNavigate` için fonksiyon döndürecek şekilde düzeltildi; ürün değişikliği değil.
- Tekrarlanan üç hata: `output/subscription-audit-findings.json`; API logları aynı output altında. Output yereldir, üretim sırrı veya kişisel kayıt yayımlanmaz.

## Canlı kontrolün sınırı

- Production READY ürün SHA `0004f8d1c892713f18b8dab2248b0d24c18a9ccd`, deployment `dpl_DmdeFzUGdSoFxZfoaLRT6Lf4imyS`.
- Üyelik adresi oturumsuz tarayıcıda normal girişe yönlendiriyor. Canlı üye oturumu verilmedi; gerçek kullanıcı adına giriş/tahsilat denenmedi.
- Sipay'in dört env anahtarı production/preview'da mevcut, sensitive değerler maskeli. Anahtar varlığı gerçek sağlayıcı yetkilendirmesinin PASS olduğu anlamına gelmez; gerçek bankayla işlem yapılmadı.
- Salt okunur canlı sorguda üyelik SUCCESS yok, iki eski ownerless PENDING kayıt 13–14 Ağustos'tan. Bunlar yeni akışın başarısızlığı veya hangi üyeye ait olduğunun kanıtı değil; email ile kullanıcıya bağlanmaz.
- Gerçek ödeme/mail, production yazma ve dağıtım yok. Otomatik tekrarlı tahsilat mevcut checkout'ta etkin yapılandırılmamış; paketler tek ödeme akışı kullanıyor.

## Kapanış sırası

Sunucu fiyat/kampanya doğrulaması → yenileme ve kısıtlama korunması → durum/sonuç ekranı → günlük iş yapılandırması ve izole mail kabulü → izinli sağlayıcı sandbox uçtan uca kabulü.

## D07 Gecikme Kısıtlaması ve Sağlayıcı Sandbox Provası Teslimi (E4N-163)

- **D07 Kuralı & Kısıtlama:** `server/src/cron/subscription-reminders.js` güncellendi. 1-5. gün gecikme hatırlatma uyarıları ve 5. günün sonunda (`daysLeft <= -5` veya gecikmiş tüm hesaplar için) `account_status = 'RESTRICTED'` durumuna alma kuralı devreye alındı.
- **Kısıtlanan Haklar & Borç Ödeme İzni:** `server/src/index.js` `/api/payment/pay` rotasında `RESTRICTED` hesapların borç kapatma amacıyla ödeme başlatmasına izin verildi. Diğer ayrıcalıklı işlemler ve yeni grup başvuruları `RESTRICTED` hesaplar için engellenmeye devam eder. Yönetimsel olarak askıya alınan `SUSPENDED` hesapların ödeme yapma engeli korunur.
- **Yeniden Açılma (Reactivation):** `server/src/payment-processing.js` (`applyAction`) başarılı tahsilat sonrası `RESTRICTED` hesabı otomatik olarak `account_status = 'ACTIVE'` durumuna döndürür ve `last_reminder_trigger = NULL` yaparak gecikme sayacını sıfırlar. İdari askılar (`SUSPENDED`) ödeme ile açılmaz.
- **İzole Doğrulama:**
  - `server/test/subscription-reminder-contract.mjs`: Gün -5'te kullanıcının `RESTRICTED` yapıldığı, diğer hesapların `ACTIVE` kaldığı, çoklu çalıştırma ve kilit koruması doğrulandı; **PASS**.
  - `server/test/payment-flow.mjs`: `RESTRICTED` hesabın ödeme başlatıp borcunu kapattıktan sonra otomatik olarak `ACTIVE`'e döndüğü; `SUSPENDED` hesabın ise engellendiği yerel ağ geçidi + PG17 üzerinde doğrulandı; **PASS**.

