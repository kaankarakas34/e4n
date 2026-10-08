# P39 bağlantılar ve yönlendirme kaynak kabulü

Teslim kaydı: 35bb24a yönetilen dala push edildi. E4N-111 açıklaması, E4N-109 ve E4N-132 yorumları 8 Ekim 10:05 UTC güncellendi. Ana hedefler açık; mobil/LMS kapsamı değişmedi.


## 8 Ekim — P39 bağlantı kaynağı ve yönlendirme bütün web paketi

Sorun: Bağlantılarım ve EXTERNAL yönlendirme alıcıları /user/friends ortak ACTIVE grup/lonca satırlarından geliyordu; acceptedfriend_requests kaynağı kullanılmıyordu. Shuffle/grup değişikliği kabul edilmiş bağlantıyı görünümden silebiliyordu.

Çözüm: GET /api/user/connections güncel DB sahibi, private/no-store, readonly repeatable-read ve minimal id/name/profession/company/city DTO ile iki yöndeki ACCEPTED bağlantıları okur. Ortak üyelik kabul değildir; PENDING/REJECTED/self hariç. Çelişkili çift kayıt409,1000üzeri503; sahip query override400, silinmiş hesap401. Eski friend_requests verisi yeniden yorumlanmadı, migration yok. Bağlantılarım ve EXTERNAL formu aynı tipli kaynakta; INTERNAL grup/lonca listesi korunur.

Web: yükleme/hata/gerçek boş/yenileme/Türkçe isim-meslek-şirket-şehir arama, çalışan profil ve doğru recipient parametreli mesaj bağlantısı. Hesap+rol+token bağlamı/eski yanıt koruması; alıcı listesi yenilenirken silinmiş/reddedilmiş seçimi temizler. Sahte sıfır performans rozeti ve çalışmayan mesaj düğmesi yeni gerçek akışa taşınmadı. Grup/lonca katalog ve başvuru kolları korunur.

Kanıt: gerçek uygulama/Express/JWT/izole PG17 taze browser **61PASS0FAIL**, output/web-browser/2026-10-08T09-59-34-816Z/browser-report.json. Önceki55senaryo +6bağlantı/yönlendirme senaryosu ve sonDBuzlaştırması: kabul edilmiş farklı grup/ortak üyelik olmayan admin görünür; pending applicant/common seat hariç; hata/retry/arama/profil/mesaj; EXTERNAL kayıpPOSTyanıtı+aynıkeyretry tekDBsatırı, yenileme, iptal edilen seçimin temizlenmesi, ilgisiz hesapta empty. Fake500 yalnızUIhata testi; veritabanına gerçek API üzerinden erişildi. SonDBtekEXTERNALPENDING ve önceki tüm invariants korundu.

Üç odaklı gerçek API/veri kontratı PASS: connections (iki yön, grup ayrılığı, privacy/DTO/owner/duplicate409/readfailure/recovery/bounded503/read-only), referral --web-only (mevcut lifecycle/score rollback + acceptedsource ve grup/lonca ayrılığı), route ownership (177exactstatic/Expressroute,24provider,17retainedlegacy). Loglar output/p39-connections-contract.log, output/p39-referral-contract.log, output/p39-route-contract.log. Build/diff PASS, output/p39-connections-build.log; mevcut bundle/browser-mapping uyarıları. Güncel kaynakla toplu34APIrun yapılmış iddiası yok; önceki P26 birleşik34kanıt ayrı. Screenshot gözle incelendi. Ownedfixture/browser/API/Vite/DB kapatıldı.

Sınırlar: bu paket kabul edilmiş bağlantıların liste/alıcı kaynağını düzeltir. Mevcut POST /referrals alıcı uygunluğunu yeni friend/group politika kuralıyla kısıtlamaz; EXTERNAL yalnız farklıgrup olmalıdır veya INTERNAL yazımı ortakgrup zorunluluğudur diye yeni ürün kararı seçilmedi. Eski /user/friends ortaküyelik endpointi uyumluluk için korunur; mobil ertelenmiştir. Tüm legacywriters/auth/rol/broadRLS güvenlik kabulü ve P39 D'ye bağlı diğer yollar açık. CanlıSupabase/deploy/gerçekmail/ödeme yok; şema22migration/46apptable+ledger=47 değişmedi. P39/P37 InProgress, releaseReady=false; yeni küçükDoneiş yok.

Sonraki büyük web işi: mevcut kabul edilmiş bağlantı/yönlendirme kaynağı tamamlandı; P39'un kalan aktif web çağrıları ve P37 kabul matrisindeki karar bağımsız boşluklar güncel envanterle ele alınır. Üyelik/grup/puan/shuffle XL ürün kararları ve gerçekcanlıgeçiş/provider kapıları açık; mobil7/LMS8 enson.
