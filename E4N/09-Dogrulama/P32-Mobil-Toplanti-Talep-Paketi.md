# P32-B — Mobil toplantı talep yaşam döngüsü

3 Ekim2026. E4N-129 Done. Commit `0e6dba7a0d14e7919c864e4030748e145b324f70`; yönetilen dal push ve remote HEAD eşit. `output/` yerel scratch/bundle, commit değildir.

## Kaynak ve teslim

Mobil `features/activities.tsx` tamamlanmış görüşme kaydı için eski `/activities` GET/POST ve user_id_2/status/notes kullanıyor; aktif API bu yolu sunmuyor. Web toplantı talebi ise ayrı `one_to_one_requests` tablosu ve `/one-to-ones/request`, liste/status API'sidir. Talep, tamamlanmış aktivite ve puanlı kayıt birbirine dönüştürülmedi.

Bu paket yeni `/features/meeting-requests` ve menü bağlantısını, typed `utils/meetings-api.ts` ile tamamlar. Gelen/giden talepler, ACTIVITY geçmişinin ayrı etiketi, üye seçimi/konu/yerel tarih-saat, keyed talep oluşturma, yalnız PENDING alıcının kabul/red eylemi, kabul edilen toplantıda web ile aynı bir saatlik Google Calendar şablon bağlantısı vardır. Takvim açılışı yalnız kullanıcı eylemidir.

Liste ve üye okumasında loading/error/retry/gerçek boş ayrılır. Geçersiz takvim günü/saat yazma yapmaz; kendi kendine talep yok. Owner/id/date/notes/status ve ACK doğrulanır. Tek senkron mutation kilidi, belirsiz ACK sonrası aynı giriş için aynı native UUID, gerçek ACK sonrası yalnız read-refresh; context/generation/sequence/unmount ve A→B→A eski callback sınırları uygulanmıştır. Key bellekte, reload kurtarma yok.

Ön koşul mevcut 0007 request schema/API ve P32-A native UUID dependency; bu pakette server üretim kodu veya şema değişmedi. Mevcut puan/üyelik kuralları seçilmedi/değiştirilmedi.

## Doğrulama

- Mobil TypeScript `tsc --noEmit` exit0.
- `node test/mobile-meetings.mjs <mobile-root>`: gerçek screen/service; kontrollü RN hook/transport ile gelen/giden/aktivite, invaliddate no-write, pending kilidi, key retry, read hata/gerçek boş, people failure, foreign/target ACK, takvim URL ve session ABA/unmount/menu geçti. Takvim servisine istek gönderilmedi; cihaz render testi değildir.
- `node server/test/meeting-contract.mjs <mobile-root>`: gerçek mobil api-client/service → disposable loopback Express/api.ts/PostgreSQL17; users/self exclusion, same-key tek request, farklı giriş409, owner liste, sender/foreign karar reddi, recipient karar/replay, request/activity ayrımı. Mevcut9 migration/eski6→9/karşıt karar yarışı200+409/readerror testleri geçti. Legacy aktivite ve performance_score snapshotları değişmedi; konteyner temizlendi.
- Offline Android Metro export1400 modül/43asset exit0. Native cihaz/kullanıcı hesabı/release testi değildir.
- Scoped patch yalnız menu ek satırı/yeni route/yeni service; pre-change dirty kaynak bazından reverse-check geçti. Patch içindeki boş context satırı son diff-check için normalize edildi, tekrar reverse-check başarılı; final staged diff check temiz.

## Açık işler ve sonraki paket

Mobil ayrı repo remote yok, mevcut dirty kaynak/diğer değişiklikler ve gitlink korundu. Paket yerelde uygulanmıştır; patch/testler yönetilen dalda kalıcıdır. Yetkili mobil kaynak deposuna entegrasyon, cihaz ve release kabulü nedeniyle ana P32/PAR açık. Canlı Supabase/SMTP/gerçek ödeme/deploy yok; D01–D10 uydurulmadı.

Linear API tam sayfa:73 kayıt;19 Done/20 In Progress/34 Backlog. Ürün bitiş yüzdesi değildir.

Sonraki bağımsız akış: **H31 tamamlanmış birebir görüşme kaydı** — eski activities route'u gerçek `/one-to-ones` field sözleşmesine eşitle; önce web kayıt tüketicisi/aktif POST/sahiplik/tekrar ve puan güncelleme sınırını denetle, sonra DB+API+web/mobil form+izole kabulü birlikte uygula. Yeni puan formülü veya talep→COMPLETED dönüşümü seçme. P32-B talepleri yeniden yazma; completed kayıt hâlâ açık.
