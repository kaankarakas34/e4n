# PAR-04 — Mobil grup ve lonca detay okuması

3 Ekim 2026. Yönetilen dal `codex/e4n-sprint1-foundation`, gönderilen commit `6bb352e`.

## Teslim

Yerel mobil `app/admin/groups.tsx` grup/lonca kartları yeni `app/admin/group-detail.tsx` ekranına id/type ile gider. Ekran ADMIN istemci sınırında salt okunurdur; geçersiz UUID/type ve MEMBER/PRESIDENT API çağırmaz. Grup `/groups/:id` ve `/groups/:id/members`; lonca mevcut `/power-teams` listesindeki id ve `/power-teams/:id/members` ile okunur. Tek lonca detay yolu mevcut değildir.

Yükleme, görünür hata/tekrar, gerçek boş üye listesi ve eksik alan ayrımı vardır. Bozuk yanıt başarı sayılmaz; route/oturum kapsamı değişince eski detay gizlenir. Sıra sayacı ve effect temizliği eski sonuçları engeller. Üye sayısı dönen bütün kayıtların sayısıdır, aktif üye sayısı değildir. Platform rolü `user.role`, lonca rolü `group_title` olarak ayrı etiketlenir. Toplantı günü/saati yalnız mevcut grup kaydından gösterilir. Onay/rol/taşıma gibi yazma işlemleri eklenmedi; D05/D08/D09 kararları açık.

## İzole gerçek HTTP kanıtı

`server/test/isolated-smoke.mjs` atılabilir PostgreSQL/sentetik JWT kayıtlarıyla dört GET yolunu ölçer. ADMIN, MEMBER ve PRESIDENT için bütün yollar 200; anonim 401, geçersiz JWT 403. REQUESTED üye de listede ve sayımda bulunur; e-posta alanı döner. Bu sunucu yolları ADMIN veya grup sahipliği sınırı uygulamıyor: istemci ADMIN kontrolü sunucu güvenliği değildir. Sprint 6 E4N-120 girdisi açık kalır.

Olmayan grup 404; olmayan grup üyeleri 200/[]; `/power-teams/:id` 404. Grup/lonca ve üyelik fixture tablolarının GET öncesi/sonrası eşitliği doğrulandı. Fixture kaldırıldı, atılabilir ortam kapatıldı. Önceki kapasite/rol/ödeme/shuffle smoke bulguları beklenen mevcut kusurlar olarak sürer; test komutunun exit0 sonucu bunların düzeldiği anlamına gelmez. Canlı Supabase çağrısı/yazması, ödeme/e-posta veya dağıtım yapılmadı.

## İstemci doğrulaması

- `test/mobile-group-detail.mjs`: gerçek TSX bileşeni kontrollü hooks/API ile grup/lonca kaynakları, hata/tekrar, bozuk/boş yanıt, alanlar, route değişiminde eski veri gizleme ve rol/geçersiz bağlantı sınırı başarılı.
- `test/mobile-groups.mjs`: iki kartın id/type ve route eşlemesi dahil regresyon başarılı.
- Expo'nun mevcut typed-route üreticisiyle ignored `.expo/types` yenilendikten sonra mobil `npx tsc --noEmit` başarılı. Yeni route için any cast veya paket kurulumu yapılmadı.
- `npm run test:isolated`, diff kontrolü ve iki kendi yamasının reverse-check kontrolü başarılı; yönetilen dal push edildi ve temiz.

Mobil depo mevcut kullanıcı değişiklikleriyle dirty ve remote'suzdur. Yalnız kendi değişiklikleri `patches/mobile/admin-group-detail.patch` ve `patches/mobile/admin-groups-navigation.patch`, testleri ve izole HTTP kanıtı yönetilen dala kaydedildi. Önceki grup liste yamasının ardından bu yamalar uygulanır. Cihaz/Expo gezinme, gerçek DOM ve yayın paketi kabulü yapılmadı. Kontrollü testler gecikmeli ağ/unmount senaryolarını ayrıca ölçmedi; bu koruma kaynakta bulunur.

## Sonraki bağımsız iş

Web AdminGroupDetail yükleme/hata ve kaynaksız upcomingEvents=0 gösterimini denetle; gerçek veri/boş/bilinmeyen ayrımını uygula. Ana PAR-04/PAR-02 ve güvenlik kabulü açık kalır.
