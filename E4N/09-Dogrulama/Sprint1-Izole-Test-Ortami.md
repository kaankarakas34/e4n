# Sprint 1 — izole PostgreSQL/API doğrulama ortamı

**1 Ekim 2026. Linear:** [P04 / E4N-76](https://linear.app/e4n/issue/E4N-76/p04-uretim-disi-veritabani-ve-akis-dogrulama-ortamini-kur). Kod: `codex/e4n-sprint1-foundation` dalı, commit `185d87d`. Kaynak: `server/test/isolated-smoke.mjs`, `server/test/README.md`, `server/package.json`.

`server/` içinde `npm ci` ve `npm run test:isolated` çalıştırılır. Script, adı rastgele seçilen geçici `postgres:17` konteynerini yalnız `127.0.0.1` üzerindeki rastgele porta bağlar. `init.sql` dosyasının demo seed öncesi şema bölümünü, sonra uygulamanın açılış migration'ını çalıştırır. Yalnız `example.invalid` sentetik fixture kullanır; canlı Supabase satırı çekmez, mevcut Docker Compose veritabanına dokunmaz, ödeme/e-posta göndermez. API'yi aynı süreçte yalnız loopback üzerinde dinletip sağlık ve etkinlik listesini ölçer. `finally` bloğunda konteyneri kapatır.

## İlk doğrulama sonucu

| Ölçüm | Sonuç |
|---|---|
| Geçici DB sürümü | PostgreSQL 17.11 (`postgres:17`); canlı Supabase okuması 17.6. Minör sürüm farkı açık. |
| Kaynak şeması | İlk `init.sql` 20 tablo. Açılış migration'ı `groups.meeting_day` yokluğunda SQLSTATE `42703` ile duruyor. Script bunu kaydedip **yalnız atılacak geçici konteynerde** alanı ekleyerek devam ediyor; ikinci migration sonrası 31 tablo. |
| Yerel API sağlık | 200 ve DB bağlantısı başarılı. |
| Açık etkinlik listesi | 500; SQLSTATE `42702` (ambiguous `status`). |
| `group_members` ACTIVE → INACTIVE | SQLSTATE `23514` (check kısıtı). |
| Fixture etkinlik sayısı | GET sonrası 1; bu fixture gelecekte tarihli. Genel GET yan etkisinin yokluğunu kanıtlamaz. |

**Yeni H19 bulgusu:** Temiz kurulum `server/init.sql` ile açıldığında `server/src/config/migrate.js:42` mevcut olmayan `groups.meeting_day` kolonunu değiştirmeye çalışıyor. `runMigrations()` hatayı yakalayıp dışarı fırlatmadığı için başlangıç kodu migration tamamlanmış gibi ilerleyebilir; 31 tabloya ulaşmak için geçici test shim'i gerekti. Kalıcı çözüm [P09 / E4N-81](https://linear.app/e4n/issue/E4N-81/p09-surumlu-migration-tabanini-ve-sema-kurulum-provasini-olustur) kapsamında.

Bu ortam **kaynak şemasını** kurar, canlı Supabase şemasının klonu değildir. Canlı `notifications` alanları ve diğer driftler bu testte kendiliğinden görünmez; ilgili işlerde hedefli fixture/migration testi eklenmelidir. P04 test altyapısını tamamlar; P05 etkinlik hatası, P07 bildirimler ve P09 migration ayrı işlerdir.

## P05 yerel düzeltme doğrulaması

`codex/e4n-sprint1-foundation` dalında `GET /api/events` içindeki yazma sorgusu kaldırıldı. Açık liste artık `e.status` ile JOIN belirsizliğini önlüyor ve biten etkinlikleri veritabanını değiştirmeden dışarıda bırakıyor. Sentetik gelecek/yayınlanmış, geçmiş/yayınlanmış ve gelecek/taslak kayıtlarıyla `npm run test:isolated` tekrar çalıştı: açık liste 200 ve 1 kayıt, `mode=admin` 200 ve 3 kayıt; GET sonrası tüm durumlar başlangıçtaki gibi (`DRAFT`, `PUBLISHED`, `PUBLISHED`). Sağlık 200; H19 migration shim'i ve `group_members` 23514 bulgusu aynen devam ediyor. Bu kaynak kodu düzeltmesidir; canlı dağıtım doğrulanmadı.

## P09 ilk şema düzeltmesi

`9e0fab6` commit'i `runMigrations()` içinde `groups.meeting_day` alanını türünü değiştirmeden önce ekler ve hatayı çağırana yeniden fırlatır. Aynı izole PostgreSQL 17.11 veritabanında temiz kurulum ve ikinci çalıştırma başarılı; shim olmadan 31 kaynak tablosu. Bilerek `users` tablosu geçici olarak yeniden adlandırıldığında migration `42P01` hatasını çağırana iletti; tablo adı test sonunda geri alındı ve konteyner silindi. Bu H19 kaynak düzeltmesini doğrular. P09'un sürümlü zinciri, 34 tabloya tamamlama, canlı drift ve geri dönüş tasarımı henüz tamamlanmadı.
