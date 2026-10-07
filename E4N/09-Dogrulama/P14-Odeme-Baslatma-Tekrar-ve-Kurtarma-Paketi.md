# P14-B — Ödeme başlatma ve yenileme kurtarma paketi

Tarih: 3 Ekim 2026. Linear: E4N-126, ana P14/E4N-86. Commit: `e5d1925`, dal `codex/e4n-sprint1-foundation`.

## Tamamlanan akış

Ortak PaymentModal → ağ çağrısından önce sekme kurtarma kaydı → aynı requestKey ile tek DB invoice → en fazla bir POS gönderimi → sahiplikli resume → sağlayıcıdan doğrulanmış status → atomik üyelik/etkinlik/ziyaretçi sonucu → tüketici onayından sonra kurtarma kaydını temizle.

- Migration `0008_payment_initiation`: request_key UUID unique, request_fingerprint SHA256, initiation_state. Eski kayıtlarda üç alan NULL; ödeme sonucu veya sahip uydurulmaz. Toplam 35 uygulama tablosu / 8 sürüm.
- RESERVED → DISPATCHED sınırı banka çağrısından **önce** kalıcılaştırılır. Paralel aynı anahtar aynı invoice'u döndürür, ikinci banka çağrısı yapmaz. Özne/tutar/eylem değişirse 409. Kart ve fatura alanları fingerprint'e dahil değildir.
- Token veya gönderim öncesi bilinen hata NOT_SENT olur. Aynı anahtar/invoice ile yeniden denenebilir. Gönderimden sonra belirsiz hata DISPATCHED kalır, yeni POS çağrısı yapılmaz.
- `POST /api/payment/resume`: üye işlemi için sahibi JWT ile doğrulanır; anonim ziyaretçi işleminde rastgele requestKey kurtarma yetkisidir. İade edilen receipt ayrı imzalama alanında, 24 saat geçerli; resume günceller. E-posta sahipliği kanıtı değildir.
- sessionStorage anahtarı kullanıcı/rol/eylem/başlangıç tutarı bağlamının sıralanmış JSON hash'i; değer yalnız requestKey, tutar ve varsa invoice/receipt. Kart/CVV/fatura/başvuru verisi bu kurtarma kaydına yazılmaz. Eksik storage erişiminde ağ öncesi durur.
- Yenileme/yeni modal örneği kurtarma kaydını okur. Status kontrolü ödeme başlatmaz; NOT_SENT için aynı kaydın gönderimine izin verir. FAILED kaydı temizler. SUCCESS/PAID sonrası tüketici callback'i onaylanmadan kayıt silinmez. Oturum/bağlam değişimi ve eski yanıtlar korunur.

## Doğrulama

| Kapı | Sonuç / kapsam |
| --- | --- |
| `node server/test/payment-flow.mjs` | Geçti: PostgreSQL17 + yerel sentetik gateway + gerçek Express/api.ts; paralel başlatma tek invoice/tek dispatch, değişen tutar/özne 409, sıralanmış fingerprint, NOT_SENT retry, kayıp banka yanıtında yeniden tahsilat yok, owner/guest resume; callback ve atomik etki regresyonları |
| 7→8 mevcut şema | Geçti: eski NULL sahiplikli ödeme alanları korunur, yeni metadata NULL; tekrar 0; kısmi metadata CHECK reddi |
| `node server/test/isolated-smoke.mjs` | Geçti: temiz8/tekrar0, eski init adoption7, 0001–0004→8, checksum/drift/HTTP DDL sınırları. Önceden bilinen puan/durum/shuffle hataları bu testte hata baz çizgisidir; düzelmiş sayılmaz |
| `node server/test/meeting-contract.mjs` | Geçti: güncel8 ve6→8 provası; eski faaliyet/puanlar, talep create/read/recipient status yarış testi korunur |
| `node test/payment-api.mjs` | Geçti: HTML başlatma/recoveryOnly/resume ve status şekli; malformed ve HTTP hataları |
| `node test/payment-modal-lifecycle.mjs` | Geçti: gerçek TSX/helper kontrollü hook/window/API; reload, kayıp init yanıtı aynı key, depolamada kart yok, tüketici hatasında saklama/onayda temizleme, recoveryOnly popup açmaz, storage yazma hatası çağrı yapmaz, NOT_SENT aynı key retry; önceki lifecycle sınırları |
| Etkinlik/ziyaretçi/üyelik tüketicileri | Üç mevcut kontrollü ekran testi geçti; ikinci kayıt/üyelik yazımı yok |
| `npm run check`, `npm run build`, `git diff --check` | Geçti. Build'deki paket boyutu/eski Browserslist uyarıları mevcut; derleme hata vermedi |

Testler canlı DB, gerçek ödeme sağlayıcısı, SMTP veya dağıtım kullanmadı. İzole konteynerler kaldırıldı. İlk test koşusunda migration ledger adındaki fixture yazım hatası ve eski toplantı provasında 0008 ledger'ının kaldırılmaması düzeltildi; nihai koşular geçti. Yanlış test dosyası adı düzeltilerek gerçek üyelik tüketici testi çalıştırıldı.

## Açık kabul ve sürüm koşulları

- API için **0008 uygulanmış olmalı**; canlıda uygulama yapılmadı. Önce gerçek yedek/adoption/rollback provası ve sürüm sırası P09/P36 kapsamında tamamlanacak. HTTP içinden migration yok.
- Yeni pay sözleşmesi requestKey gerektirir. Eski istemci gövdeleri 400 alır; tüm yayımlanacak istemcilerin uyumu sürüm kabulüne dahil. Mobil checkout/gerçek cihaz ve tarayıcı kabulü bu test değildir.
- Kurtarma aynı sekmenin sessionStorage ömrüyle sınırlı. Sekme kapanması, farklı cihaz/sekme veya storage temizlenmesi için otomatik eşleştirme eklenmedi. İki farklı anahtarın aynı alışveriş sayılması ürün politikası değildir.
- Gönderim sınırında süreç çökmesi veya kayıp 3DS HTML, işlem pending kalmasına yol açabilir. Form saklanmaz/otomatik tekrar gönderilmez; sağlayıcı sandbox, operasyonel uzlaştırma/iptal koşulları ayrı kabul. At-most-once gönderim, sağlayıcı tarafında exactly-once tahsilat garantisi değildir.
- Beş eski NULL sahiplikli ödeme için karar/sayım, D07 sunucu fiyat/promo/yenileme/hak politikası, mevcut payment→PRESENT ayrımı, gerçek sağlayıcı sandbox ve tam mobil eşitlik açık. Ana P14 Done değildir.

## Sonraki paket

P08/P39/PAR02 destek talebi yaşam döngüsünü DB + API + üye/admin ekranları birlikte tamamla: gerçek Express/PostgreSQL rol/hedef sınırları, olmayan ticket durum yazımında gerçek 404/ACK, talep/yanıt tekrar güvenliği ve işlem sonrası okuma. Mevcut OPEN/ANSWERED/CLOSED sözleşmesini koru; D kararları gerektiren grup/üyelik politikaları uydurulmaz. Önce E4N-122/123 kanıtları ve mevcut ekran kodunu okuyarak tekrar çalışma önlenir. Tek başına bir buton/catch değişikliği teslim sayılmaz.
