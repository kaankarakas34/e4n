# Kapalı grup başvuru ve üye işlemleri — 9 Ekim 2026

Ürün commit: `5c1badb`, `codex/e4n-sprint1-foundation`. E4N-157 **Done**, E4N-111/P39 kapsamında mevcut kapalı grup onay, ret ve çıkarma API/veri/web paketi; üç ekran: GroupManagerDashboard, AdminGroupDetail, GroupDetail. Ana E4N-111 kalan hedefler için In Progress.

- Başkan paneli `REQUESTED` başvuruları sayar/gösterir. Ret, desteklenmeyen `REJECTED` durumunu göndermek yerine mevcut silme yolunu kullanır.
- Silme güncel DB hesabı ve mevcut ortak grup yöneticisi kontrolüyle aynı transaction/kapasite kilidinden geçer. Token rolü tek başına yeterli değildir. Eksik hedef404; geçersiz gövde/query400; doğru group/user/removed ACK. Geçmiş trigger'ı başarısızsa silme geri alınır; eşzamanlı iki silme bir200/bir404 ve tek geçmiş üretir.
- Üç ekran ortak işlem kilidi ve doğrulanmış yanıt kullanır. Başarılı işlem sonrası gerçek liste okunur. Kayıp/yanlış yanıt veya liste okuma hatası, liste kontrol edilene kadar yeni yazmayı engeller; kontrol GET'tir, yazmayı tekrarlamaz. Hesap/rol/token/grup değişimi ve eski bağlama dönüş önceki cevabı geçersiz kılar. Kapasite/403 hatası başarı göstermez.

Kabul: izole PG17 `test:group-capacity` PASS (kapasite/transfer/shuffle regresyonu, güncel rol, silme/history rollback/race); TypeScript/route kontrolü ve production build PASS. Son hedefli gerçek Vite→Express/JWT→PG17 tarayıcı/son DB **7/7 PASS**, temiz `5c1badb` üzerinde paket kaynak SHA256 başlangıç/son eşit. Kanıt: `server/docs/group-roster-acceptance-2026-10-09.json`. İlk hedefli tur da7/7; son tur tip/kaynak kanıtı değişikliğinden sonra temiz committe çalıştı. Tüm39API/89browser regresyonu yeniden koşulmuş gibi sunulmaz.

Bu mevcut yönetim akışının teknik teslimidir. Nihai D08 kabul/başkan modeli, çıkarılma nedeni/puan/engel/yeniden başvuru, dönem ve üyelik hakları kararı değildir. Mevcut ortak yöneticilik yorumu korunur; lonca yolları ayrı kalır. Yeni migration/backfill yok. Canlı Supabase, gerçek ödeme/mail/deploy yok; releaseReady=false.

Token ölçümü: oturumdaki kümülatif `token_count` sayaç farkları kullanıldı; giriş/önbellek/çıktı ayrı raporlanır. Ölçüm dosyası aynı kabul JSON'undadır. Önceki etkinlik paketi ile kapsam/test/model koşulları aynı olmadığından kullanım farkı, optimizasyonun tek başına sağladığı maliyet tasarrufu değildir. Fatura tutarı hesaplanmadı.

06:40:51 UTC kapanış öncesi ölçüm: bu tur69.140 önbellek dışı giriş +29.809 çıktı (iç düşünme çıktıya dahildir), önceki etkinlik paketi488.403 +51.562. Bu iki kalemin toplamı98.949 karşı539.965, gözlenen fark%81,7. Önbellekli giriş bu tur6.850.176, önceki42.705.024; bunlar sıfır maliyet varsayılmaz. Bu ölçüm son kayıt/push ve final mesajını içermez. Aynı kapsamlı kontrollü deney olmadığından%81,7 nedensel veya parasal tasarruf iddiası değildir. Kısa dosya/araç yanıtları ve ilgili testlerle tamamlanan paket izlenir; mevcut uzun sohbet geçmişinin etkisi sürer.
