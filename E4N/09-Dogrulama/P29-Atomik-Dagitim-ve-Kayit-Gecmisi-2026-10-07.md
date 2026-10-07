# P29 — Atomik dağıtım ve kayıt geçmişi

## Paket

- Mevcut shuffle save transactionına0019kalıcıexecutionhistory bağlandı. Önceki/sonraki bütün grup bağlantıları (ACTIVE/REQUESTED/INACTIVE), isim/durum/rol/joined_at ve güncelactor snapshot olarak korunur. Email/telefon/password/ödeme alınmaz.
- Groupmutation/advisory ve satırkilitleri içinde mevcutrolesreset/archive/upsert/35capacity + historyinsert + commit. Historyfail tümüyelik/rol değişikliklerini rollback yapar. Stale409 veya concurrentloser geçmiş satırı üretmez. Başarılıyanıt executionId taşır.
- KayıtUPDATE/DELETE/TRUNCATE23514 ile korunur; DBowner triggerı kaldırabilir, kriptografik değişmezlik iddiası yok. RLS ve public/anon/authenticated tabloyetkisi reddi; listeindeksi. Tarihifarklıkuralla actor/groupFKcascade eklenmedi.
- GerçekcurrentDBADMIN listlast100 + singleUUIDdetail API, read-onlyrepeatableread/private-no-store; queryreject/unknown404. Yeniwebhistoryliste/refresh/detailbefore-after/roles ve oturumizolasyonu; shuffleekranından bağlantı.

## Sınırlar

Dörtaylıkdönem veya ödemehak/kesim/başkan semantiği uydurulmadı. EskiACTIVEfilter/globalrolesreset/REQUESTEDupsert davranışları aynıdır; hedefkuralların onayı değildir. Eski tarihi atamalar geri oluşturulmaz. Mevcutworkspace historyAvailablefalse hedefdönemgeçmişiyle ilgilidir; yeniekrangerçekexecutionkayıtlarıdır. Legacyrequestrevisionisteğebağlı kalır; körretrygüvenli sayılmaz. Undo/retention/missedperiod/notify teslimatı kurulmadı. AnaP29/P28/P09/P37 releaseReadyfalse; canlıwrite/deploy/realmail/payment yok, mobil/LMSenson.

## İzole kabul

Fresh19/repeat0 ve18→19upgrade; actualPG17/ExpressJWT. İlkSQLfailurefixture dollarquoting düzeltildi. Atomicledgerinsertoutage rollbackroles/üyelikler ve retrytekbatch; geçmişrename/mutationdanetkilenmiyor; concurrency200/409tekbatch; stale/replaynohistory; immutableupdate/delete/truncate; currentadmin/member/fakeJWT/deleted/demotion; DTOowner/null/countconsistency; beforepending ve afteractive/arşivler korunur. Syntheticrestore history ve webjob gerçeksatırlarını/catalog/ACL/RLS içerir. Sonbütünkabul/browser/buildkanıtı aşağıya eklenecek.

## Gerçek tarayıcı bulgusu ve giderim

İlkbrowser17-35-49-379Z başarılıshuffle aşamasında35üye+başkan grubunda mevcutrollenreset→36üye geçici durumunu yakaladı; DBcapacity23514 ile rollback. APItransaction içinde ACTIVEarşivleme rollerdenönce alınarak finalsemantik korunup geçicicapacityihlali kaldırıldı. Yeni focusedactual35+başkan→35+ayrı1yerleşim, rolPRESIDENT→MEMBER, expectedRevisionnulllegacyhistory, total38yerleşimveatomikcheckpoint PASS. İlkbrowserincomplete/ECONNRESET kabul değildir; son taze browser ayrıca gerekir. FixturefailureSQL dollarquote veparamuuidtyping düzeltilenler testkurulumudur.

## Son kabul

FinalfullAPI/dataoutput/web-acceptance/2026-10-07T17-40-49-108Z/report.json:31PASS/0FAIL, archive-before-role-reset düzeltmesi dahil. Önceki17-30-11full31PASS eskiorderiydi; tekbaşına finalkanıt değildir. Focusedshufflehistory19fresh/repeat0/18upgrade + gerçek35+başkan→35+1target, legacyrevnull, outage/retry/race/immutable/rename PASS. ProductionbuildPASS(output/shuffle-history-build.log), TScheckPASS, diff/syntaxPASS; ownership169routes/21providers/17retainedlegacy. Mevcutbundle veBrowserslistmetadata uyarıları sürer.

FinalfreshrealApp/Vite→Express/JWT→PG17browser2026-10-07T17-45-16-446Z/browser-report.json:31PASS/0FAIL. Başarılıshuffle→executionID→historylist/detail→beforePRESIDENT/afterMEMBER→refreshtekrecord, memberhistorydenied; finalDB37uniqueACTIVE+tekhistory37+beforeREQUESTEDpreserve veafterACTIVEreconcile. MevcutPDF/message/event2/50/oldrevision409/closedadmission409 dePASS. Ekrangörüntüsü incelendi. İlk17-35-49browser capacitybug ve kesintiden ötürü incomplete, kabul değildir. Finalownedbrowser/API/Vite/PGcontainerkapalı.

Restore45tableswithrowhash/catalog/ACL/RLS/triggers,19repeat0, gerçekshufflehistory vewebjobrow dahil sentetikgeri yüklemePASS. TestbaseHEADb942636; bu teslim çalışan ağaç değişiklikleriyle doğrulandı. CanlıSupabase/write/deploy/realmail/paymentyok; releaseReady=false. Commit/push sonucu Linear'da kayıtlı.
