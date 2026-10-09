# Öncelikli web başlangıç akışı — 9 Ekim 2026

## Kesin kullanıcı kararı

Topluluk üyeliği/COMMUNITY_MEMBER kalkar, normal üyelik açılır. Üye ol herkese açıktır; davetiye veya admin üyelik onayı gerekmez. Şirket ve tekil vergi numarası istenir; vergi levhası dosyası gerekmez. Bir numara en fazla bir kişiye aittir. Kimin kimin üyelik referansı olduğu korunur. Kayıt olmak abonelik değildir: gruba istek göndermek için aktif abonelik zorunludur. Başkan telefon görüşmesini kaydettikten sonra kabul/ret verir; başvuru başkana görev+uygulama bildirimi+e-posta olarak düşer.

## Yeni Linear görevleri

Kullanıcı yeni görevler istedi; mevcut denetim/yol haritası kayıtları korunup yeni teslim kuyruğuna bağlandı. Yeni parent: [E4N-160 — BAŞLANGIÇ](https://linear.app/e4n/issue/E4N-160/baslangic-acik-uyelik-referans-abonelik-grup-gorusmesi), Acil/Backlog. 161 ürün paketi491ec05/kabul5c9deaa ile tamamlandı; yalnız görev oluşturmak Done değildir. Kanıt: [[E4N/09-Dogrulama/BAS-01-Acik-Normal-Uyelik-Vergi-Tekilligi-2026-10-09]].

| Sıra | Yeni görev | Öncelik/büyüklük | Eski ilgili kapsam |
|---|---|---|---|
| 1 | [E4N-161 — BAŞ-01 Açık normal üyelik, şirket/vergi tekilliği ve eski hesap geçişi](https://linear.app/e4n/issue/E4N-161/bas-01-acik-normal-uyelik-sirketvergi-tekilligi-ve-eski-hesap-gecisi) | Acil / XL |84,85,105 |
| 2 | [E4N-162 — BAŞ-02 Üyelik referans ilişkisi ve web görünümü](https://linear.app/e4n/issue/E4N-162/bas-02-kayitta-uyelik-referansini-kalici-iliski-ve-web-gorunumuyle) | Yüksek / L |84,85; yeni referans kararı |
| 3 | [E4N-163 — BAŞ-03 Abonelik/hak durumu ve grup başvuru kapısı](https://linear.app/e4n/issue/E4N-163/bas-03-abonelik-satin-almahak-durumu-ve-grup-basvuru-kapisini-tamamla) | Acil / XL |84,86,102 |
| 4 | [E4N-164 — BAŞ-04 Grup seçimi, gerçek analiz ve meslek görünümü](https://linear.app/e4n/issue/E4N-164/bas-04-uye-icin-grup-secimi-gercek-analizler-ve-meslek-gorunumu) | Yüksek / L |102,103 |
| 5 | [E4N-165 — BAŞ-05 Başvuru/görüşme görevi/bildirim/mail/kabul-ret](https://linear.app/e4n/issue/E4N-165/bas-05-grup-basvurusu-baskan-gorusme-gorevibildirimmail-kabul-veya-ret) | Acil / XL |90,102,103,92 |

161 Done;162–165 Backlog. Çalışma sırası1→2→3→4→5. Gerçek bağımlılıklar:161 blocks162/163/164;163+164 blocks165. Keşif verisi, abonelik API'si tamamlanana kadar bağımsız hazırlanabilir; final Katıl davranışı abonelik kapısıyla aynı kaynaktan olmalı. 161 tamamlandı, sıradaki162; mobil/LMS ve küçük bağımsız UI işleri önüne geçmez.

Eski84/85/105/90/102/103/92 açıklamaları yeni görev bağlantılarıyla güncellendi. Aynı kapsam eski ve yeni kayıtta ayrı teslim/progress sayılmaz. Eski kayıtlar kalan geniş hedefleri ve geçmiş kanıtları korur; gerçek kabul olmadan kapatılmaz.

## Paket kabul sınırları

- 161: açık web kayıt + zorunlu şirket/vergi doğrulama + DB UNIQUE/normalize + tüm kayıt/profil/admin/visitor-conversion writerları + eski hesap/rol/link geçişi. Eşzamanlı aynı numara tek sahip; eski duplicate için kişi seçilmez. API/veri/web/test/build/commit birlikte.
- 162: üyelik referansı ekonomik iş yönlendirmesinden ayrı ilişki; kayıt/referans kaynağı/admin görünümü/değişiklik geçmişi. Kendi kendine/geçersiz referans/silinme/tekrar sınırları. Eski belirsiz referansı tahmin etme; davetiyeyi gizli kayıt kapısı yapma.
- 163: aktif abonelik sunucuda doğrulanmış kalıcı kaynaktan; account_status ACTIVE tek başına ödeme kanıtı değil. Abonesiz join403 ve yeni başvuru/görev yok; doğrulanmış aktif abonelikte başvuru. Mevcut callback/owner/idempotency korunur; fake ödeme ile UI/API/DB kabulü.
- 164: keşfe özel minimal API, aktif üyeler/meslek dağılımı ve başkan hariç35 doluluk; kişisel telefon/email/vergi/referral detayları ifşa edilmez. Grup liste/detail, doğru sayım, hata/boş/loading/stale-owner, durum ve Katıl hakkı.
- 165: başvuru/görev/notification/outbox aynı transaction; tekrar aynı başvuruda tek görev/mail. CurrentDBbaşkan yalnız kendi grubunda görüşme sonrası karar; kapasite/concurrency/ret geçmişi/üyenin kendi durum görünümü. Mail failure/retry/UNKNOWN gözlenir; fake mail kabulü.

Parent160 bütün başlangıç akışı aynı sürümde gerçek browser→API→DB ve build/commit ile kabul edilmeden Done olmaz. Mevcut Done kapasite89, roster157 ve aktör geçmişi159 yeniden yazılmaz. Son P37/109'a yeni akış dahil edilir.

## Hâlâ açık ayrıntılar

Türkiye VKN/şahıs TCKN ve silme sonrası kalıcı rezervasyon kesinleşti. Eski duplicate sahibi ve numarasız legacy üyelerin tamamlama politikası açık. Referanssız kaydın politikası ve referrer seçiminin kod/link/kişi yöntemi. Kullanıcı davetiye zorunlu değil dedi; referans zorunlu veya opsiyonel kararı bu cümleden çıkarılmaz. Abonelik ücret/dönem/grace hakları/yeniden açılma. Keşif KPI'ları; meslek/dolu grup ve çoklu başvuru; başkan yok/değişim/SLA/admin istisnası.

Bağlı ürün davranışı uydurulmaz; bağımsız teknik hazırlık devam eder. Canlı DB/deploy/gerçek ödeme-mail yok, izole doğrulama. MobilSprint7/LMS Sprint8 ertelenmiş; rol/veri sınırları ilgili paketlerde test edilir, kapsamlı güvenlik Sprint6.

Mevcut kanıt: [[E4N/06-Gap-Analizi/Uyelik-Kayit-Grup-Basvuru-Denetimi-2026-10-09]]. Bugünkü işlem Linear plan/kapsam/bağımlılık güncellemesidir; çalışma zamanı kodu değişmedi.

9 Ekim uygulama:161 açık normal kayıt/tekillik/kalıcı rezervasyon/geçiş provası API+web+DB+test+build ile tamamlandı; canlı migration yok.162 referans yöntemi sorusu açık.
