# P40 — API route sahipliği ve otomatik regresyon kapısı

Kaynak giriş `src/index.js`. `route-ownership.json` 8 Ekim profil/fatura paketiyle mevcut179 API method/path ve26 provider (index/admin router/24 installer) kaydını içerir. Yeni `src/self-profile.js`, GET `/api/user/profile-settings` ve mevcut PUT `/api/users/me` tek sahibidir. `tools/route-ownership.mjs` JS AST üzerinden gerçek import/mount/installer çağrılarını çözer; support array alias ve ödeme callback literal for-of şablonlarını açar. Parametre adı farkı duplicate yolu gizlemez. Aynı method/path, tekrar installer/mount, çözülmeyen route ve korunmuş eski modül mount'u kontrolü başarısız kılar. Her yeni provider veya dinamik route biçimi gerektiğinde analiz ve runtime testi birlikte güncellenir.

`npm run check/build` static kapıyı çalıştırır. Server `npm run test:routes` static mutant testlerini ve gerçek izole PostgreSQL17/Express karşılaştırmasını çalıştırır. Build production DB bağlantısı gerektirmez. JSON sayımları davranış eşdeğerliği, trafik veya kapsamlı güvenlik onayı değildir. Method/path eşitliğinde gölgelenme yoktur; farklı URL desenlerinin sıralama etkisi bu statik kapının tamamladığı bir güvenlik iddiası değildir.

## Modül kararı

17 eski kaynak korunur ve bugünkü sunucuya bağlanmaz. Mevcut endpoint sahibi JSON'daki activeOwner alanıdır; eş URL eski handler'ın yeniden kullanılabileceği anlamına gelmez. Education kaynakları eğitim ertelendiği için korunur. Broken support.js yerine aktif support-processing.js, rapor web ekranlarında yeni reports modülleri, event/auth/group mevcut doğrulanmış aktif kaynakları yetkilidir. Liste17: attendance/auth/common/education/events/groups/memberships/notifications/onetoones/powerteams/referrals/reports/tickets/user/users/visitors/support.

16 eski router80 tanım/75 aktif eşleşme; eski support ayrıca5/5 eşleşme. Beş eski unmatched yol: DELETE education/:id, PUT ve DELETE one-to-ones/:id, DELETE users/:id, PUT visitors/:id. Bunlar ihtiyaç/kayıt saklama/puan/ürün kararı olmadan yeni API olarak açılmaz. P41 yeni özellik/kaldırma değerlendirmesinde korunur; P40 route sahipliği kararı bu yolları uygulama veya silme kararı değildir. Böylece17 modülün operasyonel hedef statüsü belirlenmiştir; P39 kalan gerçek web çağrı/yanıt/yetki farkları ayrı açık kalır.

## Önceki P40 temel teslim kanıtı

Static test PASS:163 yol/18 provider/17 legacy, injected duplicate/legacy mount/repeated installer/unresolved route reddi. Gerçek izole runtime contract PASS:14 migration/repeat0; actual Express metadata163 method/path tam eşleşir, duplicate yok. Gerçek JWT/current DB ADMIN/member/anonymous ve private-no-store için admin catalog/directory/reports HTTP kontrolü PASS.

Mevcut isolated-smoke PASS fresh/upgrade/adoption/HTTP regresyonu; eski kusurlar baseline olarak korunur:36 kişiye çıkan kapasite, member approval200, aylık skor metadata eksikliği, eski shuffle500/notify404 ve member delete FK500/rollback. Bunlar başarılı hedef kabulü değildir; D ve P17/P18/P20/P21–29/P39/SEC işleri açıktır. Runtime provider kontrolü tüm163 route için E2E davranış testi olarak sunulmaz. UI değişmediği için yeni browser kabulü yok.

Yeni migration veya üretim davranış değişikliği yok. Canlı Supabase yazma/deploy/mail/ödeme yok; mobil/LMS geliştirilmedi. Check/build/diff/syntax sonuçları teslim notunda kayıtlıdır.
