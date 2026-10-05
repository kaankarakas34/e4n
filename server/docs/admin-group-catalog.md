# WEB-15 — Yönetici grup kataloğu

`GET /api/admin/group-catalog`: JWT UUID sahibi, güncel DB ADMIN, eksik hesap401/diğer rol403/query400. Read-only REPEATABLE READ snapshot, private/no-store. Explicit grup id/name/status ve users ile eşleşen group_members sayımları: total_records, active_records, requested_records, other_records, unknown_records. Sayımların toplamı doğrulanır. Üyelik kaydı ACTIVE olması grup ACTIVE olduğu veya kabul hakkı bulunduğu anlamına gelmez; DRAFT/null grup ayrıca gösterilir. Hesabı olmayan orphan membership sayılmaz. Hiç üyelik kaydı olmayan grup gerçek0 döndürür. En çok5000 grup, taşma503/okuma hatası500; sessiz kesme yok.

AdminGroups grup sekmesi typed AdminGroupCatalog kullanır: Türkçe arama, gerçek statü/null filtresi, hata/tekrar/yenileme/boş, context/token değişimi guard ve çalışan detail linki. Katalog lonca API'sine bağlı değildir. Lonca sekmesi kendi okumasını/hatasını gösterir, Shuffle ayrı mevcut kol. Bu kolların tüm yaşam döngüsü bu paketle tamamlanmış sayılmaz.

Mevcut WEB11 grup oluşturma UUID tekrarı korunur; saved create sonrası katalog tekrar okunur. Yapay current_month||1 ve member_count||0 Üye gösterimi kaldırıldı. Yeni dönem/kapasite35/başkan/kabul/hak/hizmet/shuffle kuralı seçilmedi. WEB12 grup detay paketi yeniden uygulanmadı.

## İzole kanıt

`node server/test/admin-group-catalog-contract.mjs` gerçek PG17/Express/JWT/TS transport PASS: fresh14/repeat0, current-role/revocation/auth/query/cache, total3/active1/requested1/null1, DRAFT/zero/null grup, concurrent writer snapshot ve sonraki gerçek okuma, private minimal DTO, Türkçe filtre/unknown/sentinel/invalid count/duplicate, injected500/recovery,5001 grup503 ve genuine empty. İlk fixture aynı meslek ve baseline INACTIVE constraint nedeniyle reddedildi; fixture mevcut kurala göre düzeltildi. Baseline ACTIVE/REQUESTED/null ayrı test edildi; other_records doğrulaması yalnız izole runtime legacy varyantında group_members_status_check kaldırılarak yapıldı. Üretim şeması değişmedi; bu varyant yeni INACTIVE politikası değildir.

`node server/test/group-settings-contract.mjs` WEB11 server create/update/current-admin/concurrent UUID/replay/conflict/partial/status/rollback/real TS regresyonu yeniden PASS.

Gerçek AdminGroups + catalog/captured PG fixture Playwright açık passed=true:7 katalogGET/1 loncaGET/2 aynı UUID createPOST; hata/retry, ayrılmış sayımlar, Türkçe filtre/null/filter-empty/database-empty/detail navigation, lonca500 sonrası grup görünümü, kayıp create yanıtı aynı UUID kullanıcı tekrarı/readback, held read sırasında owner değişimi PASS. Create yanıt fixture'ına mevcut savedGroup sözleşmesinin meeting_dates alanı eklendi; ilk browser fixture bu alan eksik olduğu için tamamlanmadı. Son run tamamlandı. Tarayıcı fixture ve route destination doğrulaması üretim E2E değildir. Screenshot gözle incelendi.

`npm run check`, `npm run build`, diff ve node syntax PASS; mevcut bundle/browser-data uyarıları. Kaynak14 sürüm/41 tablo, yeni migration yok. Canlı Supabase yazma/migration/deploy/gerçek mail/ödeme testi yapılmadı. P30/P31/P39/P40/D01–D10/SEC release hedefleri açık; mobil/LMS ertelenmiş.
