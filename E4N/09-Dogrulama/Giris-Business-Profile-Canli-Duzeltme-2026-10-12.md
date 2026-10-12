# Giriş hatası ve canlı düzeltme — 12 Ekim 2026

- Kullanıcının konsol kaydı: `/api/users/me` 500, `column "business_profile" does not exist`. Meta/GTM CSP mesajları ayrı izleme isteklerine ait.
- Yönetilen checkout ve origin/main üzerinde mevcut `81b05f76a83aefbea10ea5b60f27e14605086f88` düzeltmesi bulundu; kod tekrar değiştirilmedi. Canlı eski `63ab0bb` sürümündeydi; yeni SHA için dağıtım bulunmuyordu.
- Kullanıcı açıkça “Evet, canlıya al” onayı verdi. Mevcut yönetilen kaynak Vercel CLI ile production yayımlandı. Mobil değişikliği .vercelignore kapsamı dışında tutuldu.
- Deployment `dpl_8kZtiReqZ46YH3FR2QPBRM5fY9oJ` READY; www.event4network.com ve event4network.com aliasları aynı dağıtımda. Canlı login HTTP200, yeni index-D7DnNCRf.js ve yeni CSP başlığı doğrulandı. Oturumsuz `/api/users/me` HTTP401.
- `node --check` index.js/business-profile.js PASS; business-profile-contract 5 test PASS; route-ownership-static 233 rota PASS; git diff --check PASS. Vercel production build başarılı.
- Gerçek `/api/users/me` handler kodu izole sorgu adaptörüyle 4/4 PASS: mevcut sütun/profil; eksik sütun; eksik sütun+DDL izni reddi; diğer DB hatasının 500 kalması. İlk üçü 200 ve doğru hesap/profil yanıtı verir. Gerçek PostgreSQL testi değildir; Docker daemon çalışmadığından PG testi çalıştırılmadı.
- Gerçek kullanıcıyla production giriş testi yapılmadı; kullanıcıdan yeni sürümle tekrar giriş bekleniyor. Ayrı canlı DB migration veya kullanıcı/ödeme/mail testi yapılmadı. Mevcut düzeltme ilk ilgili istekte sütun eklemeyi deneyebilir; izni yoksa login salt profil fallback ile devam eder.
- Ana E4N-111 kapsamı açık kalır. Bu küçük düzeltme için yeni teslim görevi oluşturulmadı.
