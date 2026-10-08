# P26/P14 — Web etkinlik kayıt, bilet ve ödeme işlem paketi

## Teslim kapsamı

Kayıt yalnız JWT sahibine yapılır; UUID, mevcut hesap ve boş JSON gövde doğrulanır. İstemci sahibi veya `payment_status: PAID` gönderemez. Aynı etkinliğin kayıt ve mevcut eşit fırsat kontrolü event row lock ile serileştirilir. On eşzamanlı aynı sahip çağrısı bir attendance ve bir ticket üretir; replay aynı kaydı döndürür ve yeniden e-posta göndermez. Ücretli kayıt bileti PENDING, ücretsiz kayıt bileti FREE kalır. Yanıtta sürüm, etkinlik, sahip, replay ve kaydedilmiş bilet ödeme durumu vardır; web transport ve ekran sahip/etkinlik bağlamını kontrol eder.

Etkinlik detayı yalnız mevcut sahibin tek bilet ödeme durumunu okur. Başka kullanıcı veya anonim istek sahibin durumunu alamaz. Kayıtlı/PENDING web ekranı ödemeyi beklediğini gösterir ve mevcut ödeme penceresine devam eder. ACK sonrası okuma hatası salt GET tekrarıyla kurtarılır; yeniden kayıt gönderilmez.

Mevcut doğrulanmış ödeme işlemi tek PENDING bileti aynı ID ile PAID yapar. Bilet güncellemesi başarısızsa ödeme sonucu ve bilet aynı transaction içinde geri alınır. Aynı invoice için eşzamanlı tekrarlar tek sonuç üretir. Fiyat, sağlayıcı settled/Auth, sahiplik ve receipt doğrulaması mevcut ödeme sözleşmesinde korunur.

## İzole kabul

- `node server/test/event-registration-contract.mjs`: PostgreSQL17/14 migration, gerçek Express/JWT/TS transport; spoof owner/payment ve query 400, anonymous/deleted 401, yanlış UUID 400, yok etkinlik 404; 10 kayıt yarışı, FE aynı meslek yarışı 200/403; ticket INSERT hatasında attendance rollback ve retry; sahibin PENDING detayı, diğer/anon null; yanlış etkinlik ACK reddi PASS. E-posta sahte transport.
- `node server/test/payment-flow.mjs`: yerel sahte gateway/PG/gerçek HTTP; PENDING ticket UPDATE hatasında payment ve ticket rollback, retry ve üç eşzamanlı status ile aynı ticket PAID; mevcut receipt/sahiplik/provider proof/hash/amount/preauth/callback/replay/geç fail/üyelik/ziyaretçi regresyonu PASS. Eski yedi sürümlü adoption fixture yeni 0014'ü de kaldırıp 7 migration/repeat0 doğrular. Gerçek sağlayıcı/ödeme yok.
- Gerçek EventDetail + PaymentModal tarayıcı: yakalanmış izole API verisi; bekleyen ödeme ekranı/fatura penceresi, ACK sonrası read failure/GET retry/tek POST ve owner değişiminde önceki kayıt temizlenmesi. Mocklar canlı API'ye gönderilmez. Son sonuç devam notunda kayıtlıdır.
- `npm run check`, `npm run build`, route ownership runtime 163 yöntem/yol ve `git diff --check`. Build mevcut bundle/browser metadata uyarıları sürer.

## 8 Ekim — yeni kayıt/yoklama ayrımı

Yeni kayıt writerı migration0021 ile REGISTERED kullanır; mevcut score yeniden hesaplaması kaldırıldı. Kayıt sayacı ve owned bilet/ödeme akışı korunur, kayıt gerçek katılım veya gelmeme sayılmaz. İki web performans servisi kaydı son dört yoklama hesabından dışlar. Ayrıntı: [event-registration-separation.md](event-registration-separation.md). Aşağıdaki 5 Ekim açıklaması tarihsel teslim kapsamıdır; güncel yeni kayıt davranışı REGISTERED'dır.

## Ana görevler neden açık

P26'nın kayıt–gerçek yoklama ayrımı tamamlanmadı: mevcut kayıt `attendance.status=PRESENT` yer tutucusunu kullanır; bu paket gerçek katılım kanıtı sağlamaz. Geçmişte istemciden oluşmuş PAID kayıtları geriye dönük doğrulanmış sayılmaz. Bir etkinlik/sahipte birden fazla eski bilet varsa tek satın alma hepsini PAID yapmaz; detay durumu null olur. Çoklu bilet/hak/indirim/fiyat/D ürün kuralları seçilmedi. Mevcut FE kuralı korunmuş ve yarışta test edilmiştir; grup kabul kuralları yeniden tasarlanmamıştır.

P14'te eski NULL sahiplikli ödeme taşıma kararı, gerçek sağlayıcı sandbox kabulü ve D07 hak kuralları açık. P39 AST ön kontrolündeki112 çağrı/4 eksik yol, yanıt/rol E2E kabulü değildir: iki LMS çağrısı ertelenmiş; createMember ve shuffle notify D'ye bağlı. P26/P14/P39 Done değildir. Canlı Supabase yazısı, yeni migration, üretim dağıtımı veya gerçek mail/ödeme yapılmadı. Mobil/LMS ertelenmiştir.
