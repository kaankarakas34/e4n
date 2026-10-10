# P40 â€” API route sahipliÄŸi ve otomatik regresyon kapÄ±sÄ±

Kaynak giriÅŸ `src/index.js`. `route-ownership.json` 8 Ekim profil/fatura paketiyle mevcut182 API method/path ve28 provider (index/admin router/24 installer) kaydÄ±nÄ± iÃ§erir. Yeni `src/self-profile.js`, GET `/api/user/profile-settings` ve mevcut PUT `/api/users/me` tek sahibidir. `tools/route-ownership.mjs` JS AST Ã¼zerinden gerÃ§ek import/mount/installer Ã§aÄŸrÄ±larÄ±nÄ± Ã§Ã¶zer; support array alias ve Ã¶deme callback literal for-of ÅŸablonlarÄ±nÄ± aÃ§ar. Parametre adÄ± farkÄ± duplicate yolu gizlemez. AynÄ± method/path, tekrar installer/mount, Ã§Ã¶zÃ¼lmeyen route ve korunmuÅŸ eski modÃ¼l mount'u kontrolÃ¼ baÅŸarÄ±sÄ±z kÄ±lar. Her yeni provider veya dinamik route biÃ§imi gerektiÄŸinde analiz ve runtime testi birlikte gÃ¼ncellenir.

`npm run check/build` static kapÄ±yÄ± Ã§alÄ±ÅŸtÄ±rÄ±r. Server `npm run test:routes` static mutant testlerini ve gerÃ§ek izole PostgreSQL17/Express karÅŸÄ±laÅŸtÄ±rmasÄ±nÄ± Ã§alÄ±ÅŸtÄ±rÄ±r. Build production DB baÄŸlantÄ±sÄ± gerektirmez. JSON sayÄ±mlarÄ± davranÄ±ÅŸ eÅŸdeÄŸerliÄŸi, trafik veya kapsamlÄ± gÃ¼venlik onayÄ± deÄŸildir. Method/path eÅŸitliÄŸinde gÃ¶lgelenme yoktur; farklÄ± URL desenlerinin sÄ±ralama etkisi bu statik kapÄ±nÄ±n tamamladÄ±ÄŸÄ± bir gÃ¼venlik iddiasÄ± deÄŸildir.

## ModÃ¼l kararÄ±

17 eski kaynak korunur ve bugÃ¼nkÃ¼ sunucuya baÄŸlanmaz. Mevcut endpoint sahibi JSON'daki activeOwner alanÄ±dÄ±r; eÅŸ URL eski handler'Ä±n yeniden kullanÄ±labileceÄŸi anlamÄ±na gelmez. Education kaynaklarÄ± eÄŸitim ertelendiÄŸi iÃ§in korunur. Broken support.js yerine aktif support-processing.js, rapor web ekranlarÄ±nda yeni reports modÃ¼lleri, event/auth/group mevcut doÄŸrulanmÄ±ÅŸ aktif kaynaklarÄ± yetkilidir. Liste17: attendance/auth/common/education/events/groups/memberships/notifications/onetoones/powerteams/referrals/reports/tickets/user/users/visitors/support.

16 eski router80 tanÄ±m/75 aktif eÅŸleÅŸme; eski support ayrÄ±ca5/5 eÅŸleÅŸme. BeÅŸ eski unmatched yol: DELETE education/:id, PUT ve DELETE one-to-ones/:id, DELETE users/:id, PUT visitors/:id. Bunlar ihtiyaÃ§/kayÄ±t saklama/puan/Ã¼rÃ¼n kararÄ± olmadan yeni API olarak aÃ§Ä±lmaz. P41 yeni Ã¶zellik/kaldÄ±rma deÄŸerlendirmesinde korunur; P40 route sahipliÄŸi kararÄ± bu yollarÄ± uygulama veya silme kararÄ± deÄŸildir. BÃ¶ylece17 modÃ¼lÃ¼n operasyonel hedef statÃ¼sÃ¼ belirlenmiÅŸtir; P39 kalan gerÃ§ek web Ã§aÄŸrÄ±/yanÄ±t/yetki farklarÄ± ayrÄ± aÃ§Ä±k kalÄ±r.

## Ã–nceki P40 temel teslim kanÄ±tÄ±

Static test PASS:163 yol/18 provider/17 legacy, injected duplicate/legacy mount/repeated installer/unresolved route reddi. GerÃ§ek izole runtime contract PASS:14 migration/repeat0; actual Express metadata163 method/path tam eÅŸleÅŸir, duplicate yok. GerÃ§ek JWT/current DB ADMIN/member/anonymous ve private-no-store iÃ§in admin catalog/directory/reports HTTP kontrolÃ¼ PASS.

Mevcut isolated-smoke PASS fresh/upgrade/adoption/HTTP regresyonu; eski kusurlar baseline olarak korunur:36 kiÅŸiye Ã§Ä±kan kapasite, member approval200, aylÄ±k skor metadata eksikliÄŸi, eski shuffle500/notify404 ve member delete FK500/rollback. Bunlar baÅŸarÄ±lÄ± hedef kabulÃ¼ deÄŸildir; D ve P17/P18/P20/P21â€“29/P39/SEC iÅŸleri aÃ§Ä±ktÄ±r. Runtime provider kontrolÃ¼ tÃ¼m163 route iÃ§in E2E davranÄ±ÅŸ testi olarak sunulmaz. UI deÄŸiÅŸmediÄŸi iÃ§in yeni browser kabulÃ¼ yok.

Yeni migration veya Ã¼retim davranÄ±ÅŸ deÄŸiÅŸikliÄŸi yok. CanlÄ± Supabase yazma/deploy/mail/Ã¶deme yok; mobil/LMS geliÅŸtirilmedi. Check/build/diff/syntax sonuÃ§larÄ± teslim notunda kayÄ±tlÄ±dÄ±r.

8 Ekim shuffle kurtarma: GET /api/admin/shuffle-submissions/:id mevcut shuffle-history provider içinde eklendi; güncel JSON182route/28provider/17legacy. Rol/owner ve immutable işlem receipt doğrulaması shuffle-workspace kontratında; sayımlar tümrouteE2E/SECkabulü değildir.

10 Ekim P27/P28 shuffle simülasyonu ve dönemi: POST /api/admin/shuffle-preview mevcut src/shuffle-workspace.js provider içinde eklendi; güncel JSON 200 route / 31 provider / 17 legacy. D09 35 kapasite, meslek çakışması sert koşulları ve 4 aylık dönem doğrulaması canonical-period-and-simulation-contract ve shuffle-workspace kontratında PASS.

10 Ekim P39/P41 Web API uyumu ve bileşen kararları: POST /api/admin/members src/routes/admin.js içine eklendi; güncel JSON 203 route / 31 provider / 17 legacy. Admin panelinden doğrudan üye oluşturma akışı (CreateMember.tsx, CRM lead dönüşümü), zorunlu VKN/TCKN, vergi dairesi, fatura adresi doğrulaması ve bcrypt hash entegrasyonu sağlandı. 5 eski mock sarmalayıcı (@deprecated) ve ertelenmiş LMS uçları sınıflandırıldı. Admin member creation kontratı (6/6 PASS) ve route ownership runtime (203/203 PASS) doğrulandı.
