# E4N devam durumu — 9 Ekim 2026

## En son — canlı yayın tamamlandı
- Kullanıcı tüm yapılanları canlıya alma yetkisi ve DB parolasını sağladı. main/foundation ürün SHA2fefd8a push; production dpl_7NZF4USEqSCdsToRdfeYPQQdFSfN READY/custom domains www.event4network.com ve event4network.com doğrulandı. Normal üyelik formu ve API canlı; eski source-only/not-live satırları aşağıda tarihseldir.
- Tam PG17 yedeği + gerçek public restore34tablo/581satır; 27 gerçek geçiş/repeat0, drift rollback ve veri koruma PASS. Canlı28kullanıcı,11normalrolgeçişi,3kalıcıvergi rezervasyonu. RLS/client revoke47tablo, anonymous47/47denial ve ownerAPI PASS. Blog2tablo/4functionwarn, parola rotasyonu ve kapsamlıSEC açık; secrets Git'e eklenmedi, eski gömülü helper/config kaldırıldı.
- 40API/veri PASS7bc1ff2; fixture/katalogallowlist düzeltmesi sonrası 03a99de build+108browser/finalDB/cleanup PASS; yalnız2fefd8a izinSQL/manifest farkı gerçekrestore/API/anon gate ile ayrıca doğrulandı. Aynı committe40+108 iddiası yok. Gerçek hesap/ödeme/mail üretim testi yapılmadı. YeniJWT nedeniyle eskioturum tekrar giriş gerektirir.
- P09/E4N-81 Done; P37/E4N-109 InProgress/releaseReady=false. E4N-161 canlı kabul eklendi,162–165 hâlâ kalanbaşlangıçakışı. Mobil/LMS ertelenmiş. Sonraki bağımsız web işi ilgili Linear karar/kabulüne göre seçilir; bu geçişi tekrar yapma. Üretim dağıtımı tamamlandı; sonraki kod işleri için normal izole doğrulama sınırı devam eder.
- Ayrıntı/rollback/kanıt: [[E4N/09-Dogrulama/Canli-Yayin-Gecisi-2026-10-09]]. Yerel gerçek yedek/kişisel satırları Obsidian/Linear/Git'e kopyalama.

## Çalışma
- Checkout: C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2; dal codex/e4n-sprint1-foundation. Son ürün491ec05, kabul5c9deaa; kod/kanıt push sonucunu git ile kontrol et.
- Eğitim dışı web; bağlı veri/API/ekran/test işleri bütün paket. MobilSprint7, kurs/eğitim/sınavSprint8 en son.
- 9 Ekim kullanıcı yeni görevler istedi: E4N-160 başlangıç parent/Acil. İlk161 açık normal üyelik+şirket/vergi tekilliği+legacy geçiş →162 üyelik referansı →163 abonelik/grup başvuru kapısı →164 grup keşfi/analiz →165 başkan görüşme görevi/bildirim/mail/karar. 161 Done,162–165 Backlog;161/163/165 Acil,162/164 Yüksek. Bağlar161→162/163/164;163+164→165. [[E4N/07-Sprintler/Baslangic-Akisi-Oncelik-Plani-2026-10-09]]. Eski84/85/105/90/102/103/92 ilgili kapsamları yeni kuyruğa bağlandı; aynı teslimi iki kez sayma. 161 açık kayıt/kalıcı vergi tekilliği ürün paketi uygulandı ve doğrulandı; canlı migration yok.

## Son durum
- E4N-150–158 Done; yeniden uygulama.157 kapalı grup,158 lonca başvuru/onay/ret/çıkarma; currentDByetki, ACK/doğrulanmışGET, işlem kilidi. Ayrıntı ilgili P39 grup/lonca9Ekim paket notunda.
- E4N-159 Done: kapalı grup üyelik aktörü/teknik işlem/ortak kimlik veri-API-web paketi;25şema fresh/19+24upgrade/restore ve ilgili contractlar PASS; temiz fc42c49 build ve6browser/finalDB+cleanup PASS. [[E4N/09-Dogrulama/P19-Uyelik-Islem-Aktoru-API-Web-2026-10-09]]. Yeniden uygulama.
- P37 önceki24şema bütün kabulü:39API/build/102browser PASS, d3c6e96; [[E4N/09-Dogrulama/P37-Grup-Lonca-Dahil-Butun-Web-Kabulu-2026-10-09]]. Yeni25şema için yenilenmiş bütün kabul değildir. Root rehearsal aktör browserını içerir. E4N-109 InProgress; releaseReady=false.
- Ana açıklar: E4N-98 bilet/ödeme/legacy;91 geçmiş nedeni/dönem/puan-ban/retention;101 dönem/uygunluk/bildirim;106 üretim operasyonu;111 kalan ürün/API;109 nihai kabul. Sonraki bağımsız büyük web paketini seç; yalnız ilgili görev/kararı oku.
- Kararlar: [[E4N/01-Kararlar/Acik-Kararlar]]. COMMUNITY_MEMBER yeni ürün kodunda kaldırıldı; normal kayıt davetiye/admin üyelik onayı olmadan, zorunlu şirket adı+tekil VKN/TCKN+vergi dairesi+şirket/fatura adresiyle (belge dosyası yok). Kimin kimin üyelik referansı olduğu korunacak. Grup isteği için aktif abonelik zorunlu; kayıt olmak abonelik değil. Başkan görüşme sonrası kendi grubuna kabul/ret. Başkan hariç35; gecikmede5gün günlükmail sonra kısıtlama; shuffle öncesi1gün ödeme. Referanssız kayıt/seçim yöntemi, vergi legacy/ülke-tür, başkan istisna/SLA ve ödeme kesim/hak ayrıntılarını uydurma.
- CanlıSupabasewrite/deploy/gerçek ödeme-mail yok. İzole doğrula. İlgili rol/veri sınırları şimdi; kapsamlıSEC58/59/120 Sprint6.

## Az bağlamla devam
Bu not+git → yalnız ilgili Linear görevi/karar/kod. Linear durum kaynağı; Obsidian teknik/karar kaynağı. Tam geçmişi tekrar tarama. Kanıt tek paket notunda; Linear'a kısa sonuç/kalan kapsam/link. Gerçek bütün teslimi doğrulayıpDone, kalan ana işi açık tut. Başarılı logları dosyada tut, yalnız özet/hata oku. İlgili testleri çalıştır; bütün kabulü yeni somut risk veya sürüm kapısı gerektiğinde yinele. Aktif işi kesme/kopyalama. Eski günlük [[E4N/99-Arsiv/Devam-Notu-2026-10-09]].

## Son teslim — BAŞ-01 / E4N-161
- 491ec05 ürün +5c9deaa kabul origin'de. API/DB, 8-way race, deleted reservation, VKN/TCKN, normal login, abonesiz join403 ve browser3/3/finalDB/cleanup PASS. Build, geniş isolated-smoke, six ilgili contract, restore49 tablo ve error-level local advisors PASS. [[E4N/09-Dogrulama/BAS-01-Acik-Normal-Uyelik-Vergi-Tekilligi-2026-10-09]]. Önceki39API/102browser bütün kabulü yeni26şemaya güncel bütün kabul değildir.
- Türkiye VKN/şahıs TCKN; hesap silinse de rezervasyon kalır. Biçim+tekillik, resmi sahiplik doğrulaması değil. Migration eski topluluk rolünü MEMBER'e geçirir; status/abonelik/gruplar korunur; legacy boş kimliklere değer uydurulmaz. Preflight yalnızSELECT/UUID; duplicate/bozuk numara/email varsa adoption durur.
- Sıra162 üyelik referansı →163 abonelik →164 keşif →165 başkan görev/mail/karar.162 için isteğe bağlı özel link veya referans kodu yöntemi kullanıcıya soruldu, yanıt bekliyor; karar uydurma. Bağımsız164 hazırlığı ilerletilebilir. Kanıt tek paket notunda, eski84/85/105 ayrıca aynı teslim olarak sayılmıyor.

## En son kullanıcı düzeltmesi — dört zorunlu şirket alanı
- E4N-161: şirket adı, VKN/TCKN, vergi dairesi ve şirket/fatura adresi zorunlu. Web/API, profil-admin boşaltma engeli ve visitor dönüşümü düzeltildi. Yeni migration27, önceki26 checksum değişmedi; eksik legacy veriler UUID-only preflight v2 raporunda, uydurma yok. API/PG17 + browser3/3/finalDB, self-profile/upgrade/repeat, build ve local error-level advisor PASS. Kanıt aynı BAŞ-01 notunda; bütün web sürüm kabulü sayılmaz. Canlı migration/deploy yok. Sonraki162 referans seçimi yanıtı bekliyor;164 keşif hazırlığı bağımsız.

- Son login düzeltmesi: topluluk üyeliği alanı kaldırıldı; Üye Ol doğrudan /auth/register normal kayıt formuna gider. Kanıt aynı BAŞ-01 notunda.

- Kullanıcı production yayını istedi: Login.tsx düzeltmesi eski canlı main üzerine ayrı c5d6323 commit'iyle main'e push edildi. Vercel production READY/custom domains c5d6323, canlı browser link/metin PASS. Ana foundation branch267f7f5 kodu korunuyor. Canlı SELECT-only incelemede yeni normal kayıt migration26/27 yapıları yok; yeni üyelik API'si yayında değil. İleride main/foundation birleşirken aynı Login hunk'ı korunmalı; canlı DB geçişi ayrı iş. Ayrıntı BAŞ-01 notunda.
