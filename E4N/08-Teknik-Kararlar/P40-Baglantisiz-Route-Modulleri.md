# P40 — Bağlantısız API route modülleri

## 5 Ekim — önem/büyüklük sırası ve P40 teslim

Kullanıcı web işlerini önem ve büyüklükle sıralayıp başlamayı istedi. [[Web-Onem-ve-Buyukluk-Sirasi-2026-10-05]] kaydedildi; Linear111/98/109 öncelik notu güncellendi (98/109High). Yürütme sırası P39/P40L → P26/P14XL → P09/P11/P35/P36XL → P34L → P37L → SEC+P38XL; P33M/P41M–L son. Üyelik/hak/grup/kabul/puan/çıkarma/shuffleXL karar hattı yüksek önemle ayrı; D uydurulmaz, mobil/LMS enson.

P40/E4N112 Done; babb59e52feea61465257b0cc3a2fdf2952bd6ec push. Kanıt [[P40-API-Sahiplik-ve-Regresyon-Kapisi]].163 APIroute/18provider/17 retainedlegacy actualExpress exactmatch; source18routerfiles/adminmounted17unmounted.17modül operasyonel statüsü koru/bağlama;5legacyextra writepath P41ürün ihtiyacı açık. Build/check AST regressionguard ve mutant/static/PG17runtime14/repeat0/auth/cache PASS; existingisolatedsmoke baselinePASS. Check/build/diff/syntaxPASS, kaynak14/41 değişmedi. Tüm163E2E/güvenlikhedefi tamamlandı iddiası yok; UI değişmedi yeni browser yok.

Sonraki P39: eğitim dışı gerçek ekran çağrılarının typed API/method/path/yanıt ve rol karşılıklarını güncel163registry+WEB01–15 ile uzlaştır. Karar bağımlı CreateMemberPOST/shufflenotify ihtiyacını D kapsamında tut; yeni5legacywritepathları otomatik açma. Kalan çağrı farkları D'ye bağlıysa yapılabilir sıra2 mevcut etkinlik/ödeme kayıt-yoklama/tekrar/veri bütünlüğüne geç; P39'ü sırf sayıyı yükseltmek için Done yapma. P30/P31hedefkabulü, canlıkopya/geri dönüş, SEC açık. Yeni küçükreadonlyekran görevleri üretme.

İzole smoke kapasite36/memberapproval200/puanperiodmetadataeksik/shuffle500-notify404/memberdeleteFK500rollback eski kusurlarını yeniden gösterdi. Bu testPASS bu kusurları giderilmiş veya yayına hazır yapmaz. Canlıya yazma/deploy/mail/payment yok; managedtrackedclean/scratchoutputuntracked/HEADorigineşit.

**1 Ekim 2026.** Kaynak: `server/src/index.js` giriş noktası, `server/src/routes/` dizini ve repo içi import araması. Bu envanter bağlı sunucu için statik kanıttır; farklı giriş noktası veya dağıtılmış eski sürüm davranışı anlamına gelmez.

`server/package.json` sunucuyu `node src/index.js` ile başlatır. `index.js` yalnız `./routes/admin.js` dosyasını import eder ve `app.use('/api/admin', adminRoutes)` ile bağlar. Dizin içindeki 18 dosyanın 1'i bağlı, **17'si bağlı değil**. Bu dosyalardaki `router.get/post/...` tanımları bugünkü giriş noktasında endpoint açmaz. Aynı amaçlı bazı endpoint'ler `index.js` içinde ayrıca tanımlıdır; bu, bağlantısız dosyaların davranışının üretimde kullanıldığı anlamına gelmez.

| Durum | Dosyalar | İnceleme yönü |
|---|---|---|
| Bağlı | `admin.js` | Admin route'larının ilk işleyicileri burada; yinelenen gölge tanımlar P40 dalında kaldırıldı. |
| Bağlantısız router | `auth.js`, `attendance.js`, `common.js`, `education.js`, `events.js`, `groups.js`, `memberships.js`, `notifications.js`, `onetoones.js`, `powerteams.js`, `referrals.js`, `reports.js`, `tickets.js`, `user.js`, `users.js`, `visitors.js` | `index.js` karşılıklarıyla yöntem, yetki, yanıt ve yan etki karşılaştırılmadan bağlanmaz veya silinmez. |
| Bağlantısız eski parça | `support.js` | Modül düzeyinde tanımlanmamış `app` kullanıyor; router export'u yok. Bugünkü giriş noktasında import edilmiyor. Doğrudan bağlama denemesi çalışma hatası doğurur. |

`index.js` içindeki yorumlanmış `payment.js` import/mount satırlarına karşılık bu dizinde `payment.js` dosyası yok. Ödeme özelliği için aktif `index.js` endpoint'leri ve veri akışı P10/P39 kapsamında ayrıca ele alınmalı.

**2 Ekim:** P40'ın yinelenen yol temizliği ayrı [[P08-Tekrarlanan-Rotalar-Matrisi|matriste]] ilerledi; gölgeli üye listesi ve tekli bildirim okundu kaldırılınca kalan çift sayısı 3 oldu. Bağlantısız modül sayısı değişmedi.

**2 Ekim ikinci devam:** Kalan üç gölgeli tanım da ilk handler'ın izole regresyonundan sonra kaldırıldı; bağlı giriş noktasında yinelenen çift sayısı 0. Bağlantısız modül sayısı 17 ve bunların sahiplik kararı açık.

## Bağlantısız router'ların aktif yol eşlemesi — 2 Ekim

16 `router` dosyasındaki 80 method/yol tanımı, dosya adına göre varsayılan `/api/...` mount önekiyle bağlı `index.js` tanımlarıyla statik karşılaştırıldı. **75'i aynı method ve tam yola karşılık geliyor; 5'inin birebir aktif karşılığı yok.** Bu sayı kodun veya yanıtın eşdeğer olduğunu göstermez. Modüller bugün mount edilmediği için aşağıdaki beş yol da bu dosyalardan hizmet vermiyor.

| Bağlantısız modül | Tanım / birebir aktif eşleşme | Açık yeni yol |
|---|---:|---|
| `attendance.js` | 1 / 1 | — |
| `auth.js` | 3 / 3 | — |
| `common.js` | 5 / 5 | — |
| `education.js` | 3 / 2 | DELETE `/api/education/:id` |
| `events.js` | 8 / 8 | — |
| `groups.js` | 14 / 14 | — |
| `memberships.js` | 1 / 1 | — |
| `notifications.js` | 3 / 3 | — |
| `onetoones.js` | 4 / 2 | PUT ve DELETE `/api/one-to-ones/:id` |
| `powerteams.js` | 10 / 10 | — |
| `referrals.js` | 3 / 3 | — |
| `reports.js` | 4 / 4 | — |
| `tickets.js` | 5 / 5 | — |
| `user.js` | 5 / 5 | — |
| `users.js` | 8 / 7 | DELETE `/api/users/:id` |
| `visitors.js` | 3 / 2 | PUT `/api/visitors/:id` |

Yeni görünen beş yolun semantiği ayrıca incelendi: eğitim silme giriş yapan üyenin kaydıyla sınırlı ve puan yeniden hesaplıyor; bire bir görüşme düzenleme isteyenle sınırlı, silme isteyen veya ADMIN için; üye silme ADMIN kontrolünden sonra geniş bağımlılık temizliği deniyor; ziyaretçi güncelleme davet edenle sınırlı ve puan hesaplıyor. `DELETE /users/:id`, aktif `DELETE /admin/members/:id` ile aynı URL sözleşmesi veya aynı veri temizliği sayılmaz. Web `src/api/api.ts` aramasında bu beş method/yola doğrudan çağrı görülmedi; başka istemci/dağıtım kullanımı bu gözlemle dışlanamaz. Toplu mount, var olan 75 yola ikinci handler ekleyebilir ve beş yeni yazan/silen yolu açar. P40 hedef kararında her modül için korunacak kaynak, bu beş yolun ürün ihtiyacı ve aktif eşdeğerlerin yanıt/yetki farkı ayrı ele alınmalı.

### `auth.js` davranış farkı

Üç method/yolun tamamı aktif API'de var, fakat bağlanmamış `auth.js` kayıt handler'ı ile aktif `index.js` kaydı eşdeğer değil. Aktif handler topluluk dışı kayıtta davet token'ı yoksa/yanlışsa 403 döndürür, `COMMUNITY_MEMBER` için ayrı durum/rol seçer ve şirket/konum/profil alanlarını yazar. Bağlantısız handler token doğrulaması yapmaz, bütün kayıtları `PENDING` olarak ekler ve bu ek alanları yazmaz. Doğrudan mount edilmesi ilk çalışan handler'ın seçimine göre kayıt kapısını ve veri sonucunu değiştirir. `create-password` akışı kaynakta benzer; `login` şifresi henüz olmayan hesapta farklı durum kodu/mesaj kullanır. İzole API'de token'sız MEMBER kayıt denemesi 403 ve 0 yeni kullanıcı satırı verdi; bağlantısız modül çalıştırılmadı. Auth yol sahipliği aktif `index.js` olarak korunmalı; gelecekte ayrıştırma yapılacaksa mevcut kayıt kuralları için izole rol/yanıt regresyonu gerekir.

### `events.js` ve `reports.js` davranış farkı

Bağlantısız `events.js` GET `/` hâlâ önce geçmiş etkinliklere UPDATE çalıştırıyor ve açık liste sorgusunda niteliksiz `status` kullanıyor. Aktif `index.js` GET `/api/events` P05 dalında salt okuma ve `e.status` ile düzeltildi; izole testte 200 ve etkinlik durumları değişmedi. Bu modülü topluca mount etmek önceki H01/H03 arızalarını geri getirebilir. Ayrıca bağlantısız açık liste “son 14 gün” koşulu kullanırken aktif yol bitmemiş etkinlikleri seçer; yanıt davranışı da farklıdır.

Bağlantısız `reports.js` GET `/stats` referans tutarlarını türüne göre SUM eder ve ziyaretçi dönüşümünü 0 verir; aktif `index.js` `/reports/stats` gelir alanlarını 70/30 türetir ve dönüşümü sabit 20 gösterir (H23). Bağlantısız modülün otomatik bağlanması rapor sorununu çözme yöntemi değildir: iki hesaplama ayrı doğruluk ve veri sahipliği kararı gerektirir; `/charts` içinde de örnek seri var. Hedef rapor sözleşmesi P39/P41'de kalır.

Bağlantısız `notifications.js` P07 alanlarını (`title/message/read`) kullanıyor ve liste/toplu okundu yolları aktif handler'a benziyor. Tekli okundu yanıtı farklı: bağlantısız handler güncellenen satırı (ve eşleşme yoksa `undefined`), aktif handler `{success:true}` döndürüyor. İzole P40 testi aktif biçimi doğruladı. Bu modül mount edilirse istemci yanıt sözleşmesi değişebilir; P07'nin tekli okundu kabulü korunmalı.

## P40 kararı

Bugün bağlantısız dosyaları silmek veya topluca mount etmek ürün davranışını etkileyebilir. Önce aktif `index.js` yolları ve istemci çağrıları üzerinden özellik sahipliği belirlenir. `support.js` ayrıca çalışır modüle dönüştürülmeden kullanılamaz. Bu 17 dosyanın hedef statüsü P40'ın açık kısmıdır. [[P08-Tekrarlanan-Rotalar-Matrisi|Tekrar matrisi]] aktif route temizliğinin kanıtını içerir.
