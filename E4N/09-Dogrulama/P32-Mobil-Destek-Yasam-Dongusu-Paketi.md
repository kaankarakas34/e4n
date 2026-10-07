# P32-A — Mobil destek yaşam döngüsü

3 Ekim 2026. E4N-128 Done. Commit `0c4951a4a97af9ff210732fc00da74e88600f895`, yönetilen `codex/e4n-sprint1-foundation` dalına push; remote HEAD eşit.

## Teslim

Mobil üye/başkan destek liste/detail/create/reply ve ADMIN yanıt/kapat/aç ortak workspace/service ile uygulanmıştır. Owner/hedef/mesaj/tarih ve yazma ACK doğrulaması, loading/error/retry/gerçek boş ayrımı, tek senkron mutation kilidi, belirsiz sonuçta aynı requestKey ile tekrar ve eski context/hedef/unmount sonuç sınırları vardır. Kapalı talepte üye yanıt yazamaz. Doğrulanan yazma sonrası liste/detail yenilenir; read hatası yazmayı tekrar etmez. Yenilemede seçili talep yoksa detay kapanır.

Server ön koşulu: `a2823cb` destek API sözleşmesi ve 0009 migration. Expo54'ün zaten kurulu expo-modules-core3.0.29 bağımlılığı native UUID için doğrudan tanımlandı; native SDK yükseltilmedi.

## Kanıt

- Mobil TypeScript önce/sonra exit0.
- `node test/mobile-support.mjs <mobile-root>`: gerçek ortak TSX/service, kontrollü hook/transport; member/admin yaşam döngüsü, pending, aynı-key retry, malformed/foreign/target ACK, session ve unmount sınırları başarılı.
- `node server/test/support-flow.mjs <mobile-root>`: gerçek mobil api-client/service → izole Express/api.ts/PostgreSQL17; owner/admin list/detail, keyed create/reply/status replay, eski close ACK yeni OPEN durumunu geri değiştirmez. Mevcut destek transaction/rollback/race/8→9 testleri de başarılı; konteyner temizlendi.
- Offline Android Metro export: 1398 modül, exit0; 43 asset/Android bundle üretildi. Cihaz testi veya uygulama dağıtımı değildir.
- Scoped `patches/mobile/support-lifecycle.patch` reverse-check ve git diff check başarılı. Patch yalnız iki route, ortak component/service ve iki dependency satırını içerir; önceden dirty kaynak bazına göre çıkarıldı.

## Açık sınırlar ve devam

Gerçek mobil kaynak kök `mobile` ayrı dirty Git repo ve remote yok. Yerel kaynak güncellendi; yalnız bu paket patch/testleri yönetilen dala kaydedildi. Diğer mobil değişiklikler ve boş eski gitlink korunur. Kaynak deposu entegrasyonu, cihaz ve release kabulü hâlâ açık; P32/PAR03–04 tamamlandı sayılmaz. Key bellekte, reload kurtarma yok. Canlı Supabase/SMTP/gerçek ödeme/üretim dağıtımı yapılmadı; D01–D10 seçilmedi.

Linear API anlık görüntü: 72 kayıt,18 Done/20 In Progress/34 Backlog; ürün tamamlanma yüzdesi değildir. Sonraki aday paket mobil toplantı talep akışının mevcut ortak API ile eşitliği; önce gerçek mobil route ve P32/PAR bağımlılıkları okunacak. Bu destek paketi yeniden yapılmayacak.
