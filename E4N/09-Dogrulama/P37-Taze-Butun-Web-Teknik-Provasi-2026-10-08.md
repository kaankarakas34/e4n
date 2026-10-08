# P37 taze bütün web teknik kabulü

Teslim kaydı: 03db90f yönetilen dala push edildi. E4N-109 açıklaması, E4N-111 ve E4N-110 yorumları 8 Ekim10:19UTC güncellendi; P37 InProgress/releaseReady=false.


## 8 Ekim — P37 tek komutla taze bütün web teknik provası

Mevcut eğitim dışı web/API/veri için tek sahipli prova komutu eklendi: npm --prefix server run test:web-rehearsal -- <kurulu Playwright CLI JS yolu>.34API/veri paketi → productionbuild → yeni izole PG17/Express/Vite fixture →61gerçekbrowser/finalDBuzlaştırması; önceki rapor veya currentfixturepointer tekrar kullanılmaz. Aynı checkout'ta ikinci prova exclusive lock ile childiş açmadan reddedilir. Kod/bağımlılık/test/configSHA256 veHEAD başta/sonda eşit olmalıdır; değişmiş kaynaktaki farklı sonuçlar birleştirilemez. Başarılı tur sonunda ownedfixture kapatılır, lock kaldırılır.

**Taze tek prova PASS:** API/veri34/34; buildPASS; browser61/61; SourcePASS; cleanupfixtureexit0. Ana rapor output/web-rehearsal/2026-10-08T10-09-34-959Z/report.json; git'te taşınabilir kopyası server/docs/web-rehearsal-2026-10-08.json. API output/web-acceptance/2026-10-08T10-09-35-506Z/report.json; browser output/web-browser/2026-10-08T10-14-37-516Z/browser-report.json. Bu tur önceki birleşik33+1 veya eskibrowserkanıtı değildir. Başlangıç/son commit8158dd3, dirty=true (yeni prova kaynakları henüzcommitdeğildi);298dosya digest a6f837ea7e3aa444a15930bd8120b7388ac7af5d3924db53192a885322113964 eşit. Testedcode yalnızbasecommitile tarif edilmez; working-sourcehashda gerekir. Bitiş10:16:46UTC. Parallelrejectkanıtı output/p37-parallel-prevented.log, normal lockcleanupdoğrulandı.

Kapsam: WEB01–15, rapor/profil/bağlantı/mesaj/dosya/fatura/etkinlik/yoklama/takvim/kişiselgrup/aktivite/ziyaretçi/üyedizini; üyelik/job/shufflegeçmişi, kapasite, mevcutgörüşme/yönlendirme/destek, fakegatewayödeme, jobtransaction, migrationfresh/upgrade/rollback/sentetikrestore.177route/24provider/17legacy;22migration/47table.177route177E2Esenaryo değildir; retainedknownbaselinekusurlar isolated-smokePASSdiye düzelmişsayılmaz. ÖncekiP26/P39akışları bu taze turda yeniden regresyon kapsamına girdi.

**releaseReady=false; P37 InProgress.** Kararbağımlı hedefler ve canlıkabul kapıları açık: D01–04puan/çıkarma/engel; D05/D08/D10hizmet/kabul/şirket; D07ücret/dönem/gecikme başlangıcı/kısıtlanan hak/açılma; exactshufflecutoff; P09gerçeküretimkopyası/adoption; legacyyoklama/bilet/provider ve tümshufflebildirim kabulü; Sprint6SEC58/59/120veP38. Mobil7/LMS8hariç. CanlıSupabasewrite/migration/deploy/gerçeködeme/mail yok. Uygulama davranışı bu P37 turunda değiştirilmedi; runner, kaynakkabulü ve bütün kanıt toplama teslimidir. Yeni küçükDonegörevi açılmadı.

Sonraki çalışma: yapılabilir büyük web paketi seçiminde bu tek provayı ortak kapanış kapısı kullan; büyük üyelik/grup/puan/shuffle hedefleri için kalan D ayrıntılarını uydurma. Güncel P39 aktif çağrı/yanıt ve eskiwritekolları ürün kararlarıyla beraber ele alınır;61senaryo hedeflerin tümünün bittiği iddiası değildir.
