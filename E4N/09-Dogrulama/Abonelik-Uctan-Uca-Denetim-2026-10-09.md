# Abonelik uçtan uca denetimi — 9 Ekim 2026

Görev: E4N-163 (In Progress / Acil). İstek: üyenin girişten abonelik satın almaya ve hak kazanmasına kadar sorun denetimi. Ürün düzeltmesi veya yeni üretim dağıtımı yapılmadı.

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

Sunucu fiyat/kampanya doğrulaması → yenileme ve kısıtlama korunması → durum/sonuç ekranı → günlük iş yapılandırması ve izole mail kabulü → izinli sağlayıcı sandbox uçtan uca kabulü. E4N-163 bu açıklarla DONE değildir; yeni küçük teslim görevlerine bölünmez.
