# P32-C — Tamamlanmış görüşme kaydı

4 Ekim2026. E4N-130 Done. Uygulama `21c7a00`, patch metadata `d5e3f8c`; yönetilen dal push. 3 Ekim kesilen oturumun iki değişikliği korunup devam edildi; yeni paralel çalışma açılmadı. Yerel output scratch/bundle commit edilmedi.

## Birlikte teslim edilen akış

Eski mobil `/activities` GET/POST ve user_id_2/status gövdesi kaldırılarak mevcut activities route'u ortak workspace activity moduna bağlandı. Partner, gerçek yerel tarih/saat, isteğe bağlı not ve native UUID ile `/one-to-ones` kaydı; owner-scoped yalnız COMPLETED/ACTIVITY geçmişi, ACK/aynı-key retry/tek mutation kilidi ve session/pending sınırları. Talep ayrı tabloda kalır, tamamlanmış görüşmeye/puanlı kayda çevrilmez.

Server partner/self/ID/not/date/takvim günü doğrular. Existing one_to_ones PK yeni requestId tekrarını korur; aynı içerik200, yeni201, farklı owner/giriş409. Requester FOR NO KEY UPDATE sıralama kilidi ve tek transaction: aktivite+mevcut score+history. History yazımı başarısızsa aktivite ve kullanıcı skor değişikliği rollback. Replay skor/history tekrar yazmaz. Eski key'siz istemci dedup garantisi yok.

Testte puan hesaplayıcının kullandığı **user_score_history tablosunun sürümlü şemada olmadığı** bulundu. `0010_score_history.sql` eklendi: mevcut user/score/color/created_at sözleşmesi, FK/check/index/RLS; yeni puan formülü veya backfill yok. Şema10 sürüm/37 tablo. İlk extension UUID varsayımı testte düzeltildi; native PostgreSQL gen_random_uuid kullanılır. Canlıdaki olası mevcut tablo/şema için P09 ayrı geçiş provası hâlâ gereklidir; migration canlıda çalıştırılmadı.

Web getOneToOnes artık talepleri ve legacy PENDING satırlarını completed saymaz; özet karşı tarafı incoming/outgoing yönüne göre okur. Web Activities oluşturma formunda submit handler olmadığı ayrıca tespit edildi: **web kayıt yazma akışı bu pakette tamamlanmadı**, sonraki pakettir.

## Kanıt

- Gerçek Express/api.ts/PG17 ve gerçek mobil api-client/service: same-key eşzamanlı201/200, tek aktivite/tekhistory; farklı giriş/foreign/request-key409; partner404/auth401/invalid400/takvim günü400. History trigger hatası500→aktivite+score+history değişmez→aynıkeyretry201. Ayrı aynı-requester paralel kayıtlar skor snapshotında kaybolmaz; mevcut requester-only10puan/0–100/renk kuralı korunur, karşı taraf ve legacy kayıtlar değişmez.
- Gerçek mobil TSX/service kontrollü tests: activity-mode completed filtre, optional notes/keyretry, talep akışı regresyonu, invaliddate/pending/contextABA/unmount; gerçek web read adapter ve meeting hook/modal regresyonu başarılı.
- Mobil TypeScript, web check/build, offline Android Metro1400 modül exit0; scoped completed-activities.patch reverse-check başarılı. Son metin düzeltmesi kontrollü TSX testinde doğrulandı; Metro dependency gate başarılıdır, cihaz testi değildir.
- Fresh10/eski6→10/eski8→10 migration, isolated-smoke37 tablo, ödeme ve destek regresyonları başarılı; disposable konteynerler temizlendi. İlk schema/history/UUID ve smoke kapasite assertion güncelleme hataları final geçişte giderildi; kapasite baz çizgisi34→36 korunur.
- Final diff-check başarılı. Nested patch eski silinen/context satırlarının whitespace'ini korur; yalnız patch artefact için `.gitattributes` end-of-line kontrolü kapalı, uygulama kaynakları normal kontroldedir.

## Kalan kapsam ve sıra

Linear tam sayfa74 kayıt:20 Done/20 In Progress/34 Backlog; ürün yüzdesi değildir. Ana P32/PAR, cihaz/depo/release, key reload ve diğer scoring kategorilerinin transaction sınırları açık. Mobil ayrı dirty/no-remote kaynak korunur; yalnız paket patch/testleri yönetilen dalda. Canlı DB/SMTP/ödeme/üretim deploy yok; D01–D10 seçilmedi.

**Sonraki paket web Activities kayıt formu:** mevcut partner seçimi+API'de saklanan tarih/not, keyed ACK/pending/context, kayıt sonrası calendar/summary read-refresh ve izole kabul. Formdaki süre/lokasyon alanları aktif API/tabloya kaydolmuyor; yeni ürün/şema kuralı uydurulmayacak, mevcut desteklenen alanlarla açık sözleşme uygulanacak. P32-C server/mobile işi tekrar yapılmayacak.
