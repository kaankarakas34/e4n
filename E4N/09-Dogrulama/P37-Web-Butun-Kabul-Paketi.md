# P37 — Eğitim dışı web toplu kabul paketi

5 Ekim 2026. Commit ve push: [b8058d4](https://github.com/kaankarakas34/e4n/commit/b8058d4a931df1f8ecb95db74df98d94ef86f139). Linear E4N-109 **In Progress**; sürüm kabulü tamamlandı sayılmadı.

## Teslim

Mevcut eğitim dışı web/API/veri akışlarını tek komutla, sırayla çalıştıran 26 testlik kabul paketi: `npm --prefix server run test:web-acceptance`. Her testin sonucu, süre, exit code ve log dosyası rapora yazılır. Herhangi bir hata toplam komutu başarısız yapar. Gerçek web transportları, Express/JWT ve izole PostgreSQL testleri kullanılır; bu yeni ekran veya küçük cron teslimi değildir.

İlk bütün çalıştırma **22 PASS / 4 FAIL**. Belge/fatura yükseltme fixture'ları yeni 0014/0015 ledger sırasını geri almıyordu; ziyaretçi fixture'ı yeni kapasite importunu çözemiyordu; referral testi zorunlu mobil dizin argümanı istiyordu. İlk rapor silinmedi. Zincir sırası kontrolü gevşetilmeden fixture'lar düzeltildi, referral gerçek web transportunu kullanan `--web-only` moduna ayrıldı. Bunlar dört yeni ürün hatası değil, test kapısı uyumsuzluklarıdır.

Tekrar bütün çalıştırma **26 PASS / 0 FAIL**, exit 0. Başlangıç 18:07:12 UTC, bitiş 18:11:31 UTC. Mobil/LMS uygulaması başlatılmadı.

## Kabul matrisi

| Mevcut kapsam | Sonuç | Kanıt sınırı |
| --- | --- | --- |
| Kaynak ve gerçek Express route sahipliği | 2 PASS | 163 route; bütün 163 route E2E iddiası değil |
| İzole şema/auth/mevcut sorun baselines | 1 PASS | Eski sorunların varlığını da doğrular; hedef ürün kabulü değil |
| WEB01–15 rapor, bağlantı, mesaj, belge, fatura, etkinlik kaydı, takvim, grup, aktivite ve admin ekran API'leri | 15 PASS | API/DB ve typed web servis kontratları; yeni bütün browser çalıştırması yok |
| P17 kabul/transfer/rol/shuffle kapasite | 1 PASS | Uygulama transaction sınırı; doğrudan DB invariant henüz açık |
| Ödeme, toplantı, referral ve destek yaşam döngüsü | 4 PASS | Sahte ödeme/e-posta adaptörleri, izole veri ve sahiplik/rollback |
| Etkinlik tamamlama ve champion transaction işleri | 2 PASS | Mevcut metrikler ve dönem davranışı; yeni puan politikası değil |
| Sentetik backup/restore | 1 PASS | 15 migration / 41 uygulama tablosu + ledger / 42 manifest; gerçek üretim kopyası değil |

## Açık sorunlar ve kararlar

- D07/D10: plan/bitiş tarihi olmayan ACTIVE hesap mevcut durumda grup/lonca başvurusu yapabiliyor. 5 gün günlük mail ve sonunda kısıtlama kararı kayıtlı; ücret/dönem, süre başlangıcı, haklar ve açılma ayrıntıları seçilmedi.
- D05/P16: aynı profession için status update sonrası iki ACTIVE kayıt kalabiliyor. Hizmet sınıflandırması ve tam invariant açık.
- P10/P17: aynı kişide iki ACTIVE kapalı grup kaydı ve tarihçe olmadan üyelik satırı silme mevcut baseline. Grup bazlı başkanlık, veri modeli ve doğrudan DB kapasite koruması açık.
- D01–D04: tekrarlanan ziyaretçi kayıtları puanı artırıyor; traffic-light yanıtında ay/kaynak/kural sürümü yok. Aylık puan, çıkarma ve yasak hedefi henüz kabul edilmedi.
- Tam shuffle geçmişi ve bildirim akışı eksik; shuffle ödeme kesim saati, grace etkileşimi ve geç ödeme sonrası haklar kullanıcıyla konuşulacak.
- Canlı şema geçiş provası, eski yoklama/bilet yorumları, bütün browser kabulü ve Sprint 6 kapsamlı güvenlik/sürüm kapıları açık. `releaseReady=false`.

**26/26 PASS web projesinin %100 tamamlandığı anlamına gelmez.** Bu ölçüm teslim edilen mevcut kontratların regresyonudur. Yeni hedef ve açık sorunlar ayrıca kapanmalıdır. E4N-109 DONE yapılmadı.

## Kanıt dosyaları

Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`.

- İlk rapor: `output/web-acceptance/2026-10-05T18-02-09-651Z/report.json`.
- Düzeltme sonrası tam rapor: `output/web-acceptance/2026-10-05T18-07-12-950Z/report.json`; aynı dizinde 26 log.
- Kaynak açıklaması: `server/docs/web-acceptance.md`; runner: `server/test/web-acceptance.mjs`.

Raporlardaki Git hash test başlangıcındaki base HEAD `6d7da31`dır; test edilen yerel fixture/runner değişiklikleri final `b8058d4` commitindedir. Yalnız test ve doküman değişti; runtime/migration SQL/ürün kuralları değişmedi. Yeni build/browser iddiası yok. Syntax ve diff check PASS. HEAD/origin aynı, tracked temiz; output/CLI temp scratch korunuyor. Test container'ları kapanmış durumda. Canlı Supabase yazma, gerçek ödeme/mail veya dağıtım yok.

## Sonraki büyük paket

Üyelik XL → grup/kabul/kapasite XL → puan/çıkarma XL → shuffle XL sırası korunur. Karar kapıları aşılmadan hak/ücret/kesim zamanı seçilmez. Karardan bağımsız sonraki çalışma P10/P17 grup bazlı rol ve DB invariant tasarımı/kabulü veya P37'nin kalan gerçek browser akışlarıdır; bu 26 kontrat tekrar yeni iş diye sayılmaz. Mobil Sprint 7, eğitim/sınav Sprint 8 en son.
