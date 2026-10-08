# P39 / P31 — Lonca oluşturma ve ayarlar bütün web teslimi

## Sorun ve teslim

Lonca oluşturma yanıtı kaybolunca web yeni kimlikle tekrar oluşturabiliyordu. Düzenleme API'si gönderilmeyen alanları sıfırlıyor, DRAFT durumunu ACTIVE yapabiliyor; ekran ise gerçek kayıt yerine gönderdiği formu başarı olarak gösteriyordu.

Mevcut oluşturma/düzenleme yolları tek aktif provider'a taşındı. Güncel DB ADMIN yetkisi, transaction ve rol/satır kilidi, UUID ile eşzamanlı tek oluşturma/aynı içerikle tekrar, farklı içerik ve isim çakışmasında 409, doğrulama/404/rollback sağlandı. Gönderilmeyen alanlar, eski şablonun boşlukları dahil, aynen korunur. DRAFT sessizce aktive edilmez. Şema değişmedi: 22 migration, 47 tablo.

Yönetici için özel salt okunur lonca ayar kataloğu eklendi: current DB ADMIN, owner/version, private/no-store, repeatable snapshot, sabit sıralama ve 1000 üstünde açık 503. Web tipli yanıtta sahip/kimlik/tarih/alan/gönderilen içerik eşleşmesini doğrular.

Web aynı bekleyen kimlik ve adı korur; senkron kilit, belirsiz sonuçta aynı işlemi tekrar, modalı kapatıp açma ve sekme değişiminde anahtarın korunması, ACK sonrası yalnız listeyi tekrar okuma birlikte uygulanır. Gerçek durum, Türkçe arama, yükleme/hata/boş/retry ve eski oturum yanıtlarını engelleme vardır. Yönetici detayında gerçek kaydedilmiş satır gösterilir; uyumluluk için GroupDetail ayar çağrısı da gerçek yanıta bağlandı ve oturum/save koruması eklendi.

## Kanıt

- İzole gerçek PG17/Express/TS kontratı PASS: `output/p39-power-team-contract-final.log`. Sekiz eşzamanlı aynı UUID tek satır, replay/conflict/isim çakışması; DRAFT, gönderilmeyen metin/şablonun byte düzeyinde korunması; geçersiz veri/404; güncel rol/demotion/silinmiş hesap; rollback/redacted error; private katalog/sahip/sınır; sahte sahip/ID/ad/tip ACK reddi.
- Runtime sahiplik PASS: `output/p39-power-team-routes.log`; 178 exact route, 25 provider, 17 korunmuş bağlantısız eski modül. Kaynak JSON güncellendi.
- Son build PASS: `output/p39-power-team-build-final.log`. TS ve static sahiplik kontrolü dahil; mevcut bundle ve tarayıcı metadata uyarıları sürüyor. Diff kontrolü PASS.
- Gerçek styled App/Vite → Express/JWT → disposable PG17 tarayıcı turu **66 PASS / 0 FAIL**: `output/web-browser/2026-10-08T14-37-57-049Z/browser-report.json`, bitiş 14:42:45 UTC. Önceki akışlar ve beş lonca senaryosu; final DB'de tek düzenlenmiş lonca ve tek ACK/liste-hata loncası, gerçek açıklama/durum/şablon doğrulandı. Ekran görüntüsü gözle incelendi.
- İlk tur `2026-10-08T14-29-58-625Z` 61 PASS / 4 FAIL olarak korunur; kabul değildir. İngilizce büyük I'nin Türkçe aramada ı olması yüzünden test beklentisi eşleşmedi; takip eden senaryolar ve final DB kontrolü etkilendi. Test Türkçe İ ile düzeltildi; temiz tur geçti.

Kanıt sınırı: browser fixture API'si son gönderilmeyen metin boşluklarını koruma düzeltmesinden önce yüklendi; bu son backend farkı ayrı taze `power-team-settings-contract` ile doğrulandı. Kaynak tek bir yeni 35 API + build + browser prova raporu altında çalıştırılmış gibi gösterilmez. Yeni kontrat ortak runner'a eklendi, bu ekleme tek başına 35/35 yeni kabul kanıtı değildir. Browser raporundaki base HEAD b6b6781'dir; henüz commit edilmemiş uygulama değişikliklerini de kullanır.

## Açık kalanlar

P39/P31 ana hedefleri In Progress. Bu teslim lonca ayar/oluşturma akışıdır; P15 açık lonca üyelik yaşam döngüsü, kabul/başkan/hizmet/üyelik/puan kararları, eski genel katalog/üye/silme/yoklama yollarının bütün kabulü değildir. GrupDetail'in diğer eski işlemleri kapanmaz. Bir create ID'nin eski payloadı, sonradan düzenlenen satırla artık eşleşmezse 409 döner; değiştirilemeyen create receipt defteri kurulmadı. Güncellemede optimistic version yok; çelişen düzenlemelerde son commit geçerlidir.

Bekleyen create kimliği bellektedir; reload sonrası katalogdan kontrol gerekir. Şablon kaydı gerçek e-posta göndermez. Mobil Sprint 7/LMS Sprint 8 ertelenmiş; geniş SEC Sprint 6. Canlı Supabase yazma/migration/deploy/gerçek ödeme/mail yapılmadı. Owned browser/fixture/DB kapatıldı. Yeni küçük Done görevi veya ürün yüzdesi artışı üretilmedi.

Teknik belge: `server/docs/power-team-settings.md`.
