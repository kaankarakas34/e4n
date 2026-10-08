# Existing web acceptance bundle (P37)

Run `npm --prefix server run test:web-acceptance` from the managed checkout.
Node dependencies and Docker with PostgreSQL 17 are required. The runner executes
33 contract suites sequentially, including private profile/session isolation,
the 15 delivered WEB packages, route
ownership, admission/transfer/capacity, payment, meetings, referrals, support,
scheduled transactions and synthetic backup/restore. Referral verification uses
the actual **web** transport; it does not require a mobile checkout.

Each database suite owns a disposable local database. Payment and mail tests use
their existing fake adapters. The runner removes inherited database URLs and
service credentials from its child environment. It never applies a live schema,
sends real mail, charges a real payment or deploys an application.

## Evidence

Every run writes `output/web-acceptance/<UTC timestamp>/report.json` and a log per
suite. Results are saved after each suite; the complete report has `finishedAt`,
`passed` and `failed`. An interrupted report is incomplete. A nonzero child exit
or spawn error is FAIL, and any FAIL makes the runner exit nonzero. Keep failed
reports when fixing a fixture; rerun the bundle to record new evidence.

The recorded Git commit is the **base HEAD at run start**. When running with local
changes, identify those changes and the final commit in the delivery note; the
base hash alone does not identify the tested working tree. Logs are local
evidence, not published telemetry.

## Acceptance boundaries

PASS means the assertions of that existing contract passed. It does not mean all
routes, browsers, historical production records or future product rules passed.
The isolated smoke suite deliberately retains documented unresolved defect
baselines; a passing smoke run does not fix those defects.

`releaseReady` remains false even if all 33 suites pass. The report records:

- BLOCKED: remaining scoring/removal/ban, service/admission/company/membership
  decisions and exact shuffle payment/grace/restriction/reopening policy.
- OPEN: live schema rehearsal, group-scoped roles, historical
  attendance/tickets and complete shuffle/history/notify. The direct database
  capacity invariant is covered by migration 0016 and its PostgreSQL contract;
  migration 0017 covers atomic, replay-safe membership reminder delivery claims;
  migration 0018 covers durable authorized web job execution history.
- NOT_RUN: a fresh whole-flow browser acceptance. Previous package browser
  fixtures are separate evidence, not a substitute for this gate.
- DEFERRED: Sprint 6 broad security and production release acceptance.
- EXCLUDED: Sprint 7 mobile and Sprint 8 course, education and exam work.

P37 remains In Progress until its full web acceptance gates are satisfied.
The bundle is an executable regression gate for the existing system, not a new
product feature or a completed release.

### Known baselines that prevent product acceptance

The smoke log explicitly records these existing behaviours as baselines, not
accepted target rules:

| Existing observation | Remaining gate |
| --- | --- |
| ACTIVE account without subscription plan/end date can request a group or power team | D07/D10 membership and rights policy |
| Status updates can leave two ACTIVE members with the same profession | D05 service classification and the complete conflict invariant |
| A user can have two ACTIVE closed-group records; removal deletes membership rows without placement history | P10/P17 membership model and placement history |
| Repeated visitor records increase the current score; traffic-light response has no month/source/rule version | D01–D04 monthly scoring, deduplication and removal policy |
| Shuffle notification endpoint is absent | Full shuffle/history/notification package |

Passing these baseline assertions is evidence that the limitation still exists.
Do not translate the suite PASS count into a web completion percentage.

## 5 October 2026 verification

- Initial bundle: `2026-10-05T18-02-09-651Z`, 22 PASS / 4 FAIL.
- Repaired bundle: `2026-10-05T18-07-12-950Z`, 26 PASS / 0 FAIL, exit 0.
- Both reports preserve their original results under `output/web-acceptance/`.
  Base HEAD: `6d7da316768433a4935c93060960705571af7b95`; local changes are the
  harness, npm script and fixture repairs delivered with this document.
- Document/invoice upgrade fixtures now reverse migrations 0015 and 0014 before
  replaying the earlier migration chain. The production history-order check
  remains intact. Visitor queue's transpiled fixture resolves the newly imported
  capacity validator. Referral suite accepts `--web-only` and exercises the real
  web transport without a mobile checkout; existing mobile mode is retained.
- These four failures were test fixture/runner integration failures, not proof
  of four new product defects. Runtime source, migration SQL and product policy
  are unchanged in this acceptance bundle.
- No fresh browser run or build was needed for these test/document-only changes.
  Whole browser acceptance and every gate listed above remain open.

## Full application browser fixture

A separate browser package now exercises the real application, rather than
standalone component mocks. In one terminal, start
`npm --prefix server run test:web-browser:fixture`. Wait for `WEB_BROWSER_READY`.
In another terminal run `npm --prefix server run test:web-browser -- <path-to-playwright-cli.js>`.
Use the installed Playwright CLI JavaScript entry (the CLI skill's cached
installation is suitable). No `@playwright/test` framework is required.

The fixture creates a disposable PostgreSQL 17 container, applies all 17 versions,
seeds admin/member/president/applicant accounts, a full group, a vacant group, an
event with two attendees, and an accepted connection. Vite loads the actual App
router and components, with environment file loading disabled and synthetic
Supabase client settings. Nodemailer is replaced with a local fake adapter.

The browser redirects the existing localhost:4005 API transport to the fixture's
actual loopback Express server. **Responses are not mocked.** Other network
origins, including analytics/fonts, are blocked. Native confirmation/alert
dialogs are deterministic in the fixture; native dialog behaviour itself is not
accepted by this test. Real email, payment, Supabase and deployment are absent.

The CLI driver records cases, method/path/status evidence, page errors and
screenshots in `output/web-browser/<timestamp>/`, then reads the final database
state through a secret-protected local control endpoint. It checks the applicant
remains REQUESTED after 409, the group remains 35 members plus president, two
attendance rows are preserved, uploaded PDF bytes match, and one message belongs
to the member/president pair. It closes its browser and requests fixture cleanup;
the fixture also has a 20-minute shutdown limit. Each run needs a fresh fixture.

### Browser evidence, 5 October

Final `2026-10-05T18-27-57-502Z/browser-report.json`: **21 PASS / 0 FAIL**.
This covers real admin/member login, admin dashboard/reports/member directory/
visitor queue/accounting/group catalog, event card **2 / 50** and participant
modal, group rejection and tabs, document upload/member download, personal
reports/groups/activities, selected-day calendar data, registered-event view,
message send, role switch hiding admin data, and final database state.

An initial browser setup stopped at a native confirmation dialog and used two
obsolete heading locators. Its CLI log and screenshots were retained; it is not
a complete test result. A subsequent rehearsal passed 20 cases; the final fresh
fixture additionally checked selected-day event data and persisted PDF bytes.
Base HEAD `b8058d4` identifies the base checkout; the browser helper additions are
local changes delivered with this section. No runtime source was changed.

**Observation at that run (resolved in the later profile package below):** actual member navigation logs a caught SQL failure in
the legacy `/api/users/:id` profile query: `one_to_ones.receiver_id` does not exist,
so it falls back to a basic profile. A 200 and rendered page do not prove the
profile metrics/last-meetings contract. Record this under P30/P40 and verify that
whole profile/dashboard package separately. The new typed report/calendar flows
passed their stated cases; they do not resolve that fallback.

This fresh browser evidence advances P37's existing-flow gate. Remaining target
rules, historical production data, profile metrics, all untested interactions
and broad security/release acceptance keep `releaseReady=false` and P37 open.

## Private profile and dashboard context package, 5 October

The active `/api/users/:id` reader now uses canonical `one_to_ones.partner_id`,
counts both directions, and returns the latest three meetings with stable date/id
ordering and counterpart names. Metrics retain their existing all-history scope;
no monthly scoring, money or rights policy is introduced. All ACTIVE groups are
returned without choosing an arbitrary primary group. The profile header consumes
those groups instead of displaying the hardcoded `Liderler Global` label.

The read-only repeatable-read snapshot verifies the current database actor: only
the owner or a current ADMIN receives the private profile. Anonymous, foreign,
deleted and demoted actors are checked; SQL failure returns a redacted error,
never a successful basic-profile fallback. The web transport validates owner,
target, metrics, groups and latest-meeting fields. Profile and dashboard requests
discard stale owner/role/token results; retry refreshes the current context.
Profile edit responses are re-read through the complete DTO before display.

`2026-10-05T18-46-10-332Z/report.json`: **28 PASS / 0 FAIL**. Two new suites
exercise actual PostgreSQL/Express/web transport and the real Zustand store's
delayed responses. The previous 26-suite evidence remains historical.
Production build and final TypeScript checking passed. Base HEAD is `7687799`;
runtime, consumers and test changes are the working tree delivered with this
section. No migration is added; source remains 15 versions / 41 application
tables plus its ledger. Broader membership/scoring/shuffle decisions and release
gates remain open; P30/P40/P37 are not marked DONE from this package alone.

Fresh final browser fixture `2026-10-05T18-52-51-923Z/browser-report.json`:
**23 PASS / 0 FAIL**, including the actual admin member profile's four meetings,
latest three counterpart rows, real ACTIVE group header, and rejection of a
member reading somebody else's private profile. The earlier 23-case run
`18-48-49-384Z` is preserved: its screenshot exposed the legacy hardcoded group
header, which was corrected and asserted in the final fresh run. The browser,
API, Vite and owned PostgreSQL fixture are closed after verification.

## Membership reminder delivery package, 7 October

Migration 0017 adds the private, unique delivery claim used by the existing
membership reminder schedule. The database claim, in-app notification and user
marker commit atomically; mail is attempted once after commit and its
`SENT`/`UNKNOWN`/`NO_EMAIL` outcome is retained. The existing five trigger
days and ACTIVE filter are unchanged.

The initial 29-suite run retained one failure: the group-capacity migration
upgrade fixture tried to replay 0015/0016 while the later 0017 ledger entry still
existed. The fixture now rolls later schema state back first; its focused rerun
passed. The clean full rerun
`2026-10-07T12-06-02-614Z/report.json` finished **29 PASS / 0 FAIL**.
Production build, isolated smoke and the 43-table synthetic backup/restore also
passed.

`releaseReady` remains false. Live Supabase migration/cutover, production
scheduler/provider monitoring, five-day restriction rules, remaining product
decisions, full browser release acceptance and Sprint 6 security gates are open.

## Styled full application browser evidence, 7 October

Final fresh run `2026-10-07T16-23-16-419Z/browser-report.json`: **24 PASS / 0 FAIL**.
The fixture now starts from the application root so Tailwind resolves its config
and content. A computed-style probe rejects missing utility CSS. Schema metadata
uses the actual applied migration count. Actor storage is reset before React
hydration, and message verification selects the conversation paragraph rather
than the identically worded preview.

The earlier 12-14-27 run passed DOM/data checks with missing styles and is not
visual acceptance. The 16-18-35 run retained one ambiguous message locator FAIL;
the 16-20-08 run was stopped after a fixture login race and is incomplete.
The final run verifies styled UI, actual HTTP and persisted database state;
screenshots were visually inspected. All owned fixture processes were closed.
P37 remains In Progress with the remaining product/live/security release gates.

## Current shuffle workspace package, 7 October

Fresh full API/data run 2026-10-07T16-38-58-920Z: **30 PASS / 0 FAIL**. Fresh single-fixture actual application browser 2026-10-07T16-43-51-855Z: **27 PASS / 0 FAIL**, including real current memberships, locked preview without writes, stale revision409 and refresh, plus unchanged final database records. Focused concurrent/same-placement revision replay also PASS. Build/check PASS. The interrupted 16-37-17 browser encountered local ERR_NETWORK_CHANGED while Docker fixtures changed the host network; it is not acceptance evidence.

See shuffle-workspace.md. This does not complete period eligibility, immutable assignment history or notification delivery; existing legacy save callers may omit the revision while this web screen supplies it. P28/P29/P39/P37 and release gates stay open. No new migration; runtime ownership164 routes/19providers,17retained legacy.

## Durable web operation package, 7 October

Fresh API/data bundle 2026-10-07T17-08-35-447Z: **31 PASS / 0 FAIL**; focused final audit-log/null-DTO changes also PASS. Browser2026-10-07T17-13-17-877Z: **29 PASS / 0 FAIL**, including actual administrator invocation, persisted result, refresh without re-execution, member isolation and final database state. Synthetic restore includes a durable job history row,44tables with catalog/ACL/RLS equality; fresh18/repeat0. Build/check/syntax PASS. First30/1payment fixture upgrade-count failure corrected; first browserfixture connection initialization failed before acceptance. See web-job-operations.md. Production scheduler activation/session connection validation, champion periods, pending product decisions and broad security remain open.

## Atomic shuffle execution history package, 7 October

Schema chain19; immutable execution snapshots include actual before/after membership statuses and role changes. The existing shuffle regression covers history insertion failure with full rollback and retry, current-role list/detail isolation, stale/replay/concurrent single record, historical names after rename, and a full35+president redistribution. The real browser now saves a distribution, reads its persistent history and role change, rejects a member's history view, and reconciles37 unique ACTIVE assignments with the saved snapshot. Previous group/pending final-state assertions apply to earlier no-write browser runs; this run intentionally performs an isolated successful shuffle. Live eligibility/period/notification rules remain open.

Final shuffle history acceptance: API/data2026-10-07T17-40-49-108Z31PASS0FAIL, fresh browser2026-10-07T17-45-16-446Z31PASS0FAIL; build/TS/syntax/diffPASS. First browser incomplete found the transient36-member bug; fixed by archiving before resetting leaders. Isolated synthetic restore45tables/catalog/ACL/RLS/triggers and actual history/job rows. No live changes; releaseReadyfalse.

## 7 October membership record package

output/web-acceptance/2026-10-07T18-02-15-840Z/report.json:32PASS/0FAIL. output/web-browser/2026-10-07T18-06-08-150Z/browser-report.json:34PASS/0FAIL, including actual owner/admin record screens, authorized invoice download and member admin-route rejection with final persisted-data reconciliation. BaseHEAD4e1d115 plus the membership record working tree; see delivery note for final source scope. Both are regression evidence; releaseReady remains false and product/schema/security gates remain open.

## Durable group membership history,7October

output/web-acceptance/2026-10-07T18-21-36-986Z/report.json:33PASS/0FAIL. The earlier31/2 run failed old migration/table-count fixture assumptions; both were corrected. Focused history rerun after the explicit timestamp-column index ordering passed. output/web-browser/2026-10-07T18-26-37-721Z/browser-report.json:37PASS/0FAIL; actual member/admin history, older-page load, refresh and owner boundaries with real shuffle-change reconciliation. Synthetic restore includes two real membership history rows,46tables and immutable controls. Source20;174routes/23providers. Build/TypeScript PASS; base66550ad plus delivery working tree. Technical connection history does not close canonical period/removal policy, live adoption, broad security or releaseReady gates.

## 8 October — registration and attendance separation

Migration0021 adds REGISTERED without rewriting history. Fresh21/repeat0/pre20upgrade; existing46-table restore preserved. Whole actual API/data33PASS0FAIL (2026-10-08T08-16-50-617Z), fresh styled browser38PASS0FAIL (2026-10-08T08-25-39-153Z): new booking/reload single POST, counter2→3, newREGISTERED vs legacyPRESENT, final DB and prior whole-flow scenarios. First browser08-22-20-410Z disconnected ECONNRESET and is not acceptance. P26 explicit check-in/provenance/historical interpretation and D/provider gates remain open; releaseReady=false.

## 8 October — existing meeting/referral/support lifecycle browser package

See [web-lifecycle-browser-acceptance.md](web-lifecycle-browser-acceptance.md). Fresh full browser suite **50 PASS / 0 FAIL**: `output/web-browser/2026-10-08T08-53-33-947Z/browser-report.json`. Three actual actor lifecycles, reloads, unrelated-account privacy and persisted final DB state included. Existing 33 API/data PASS reused on unchanged application code. P37 remains In Progress and releaseReady=false; EXTERNAL referral candidates source mismatch recorded under P39.

## 8 Ekim — P26 yönetici yoklama ve düzeltme paketi

Mevcut ADMIN için gerçek kayıt üzerinden PRESENT/ABSENT gözlemi ve REGISTERED geri alma tamamlandı. Açıklama zorunlu; önceki/sonraki durum, yönetici ve zaman değiştirilemeyen ayrı geçmişte. Veri, iki özel API, tipli web sözleşmesi ve yönetici ekranı birlikte teslim edilir. Başkan yetkisi, yeni puan/hak/fiyat kararı veya eski kayıtların doğruluğu varsayılmadı. Gelecek/iptal/eğitim etkinliğine yeni yoklama yazılmaz.

Doğrulama: gerçek web → API → izole PG17 taze **55 PASS / 0 FAIL**: output/web-browser/2026-10-08T09-38-57-431Z/browser-report.json. Kayıp PUT yanıtında tek yazma ve GET ile uzlaştırma; açıklamalı düzeltme/geri alma/yenileme; kayıt sayısı korunur. API/veri **34 PASS birleşik kanıt**: output/p26-attendance/combined-api-report.json; toplu 09-38-36 turu 33 PASS + eski tablo sayımı beklentisi onarılan isolated-smoke ayrıca exit0. Bu yeni bir 34/0 toplu tur değildir; ilk başarısız raporlar korundu. Yeni kontrat sekiz eşzamanlı aynı istek, replay/stale409, rollback, güncel DB rolü ve geçmiş UPDATE/DELETE/TRUNCATE yasağını doğruladı. Build ve diff kontrolü PASS; 176 route/24 provider/17 retained legacy.

Şema0022: 22 migration, 46 uygulama tablosu + schema_migrations =47; fresh/repeat/0021 yükseltme ve sentetik restore geçti. Canlı migration/deploy/gerçek mail/ödeme yapılmadı. 0021+0022 üretim geçiş kapısı ayrı açıktır.

Sınır: geçmiş yalnız yeni yönetici API işlemlerini kapsar; eski bulk writer/doğrudan SQL tümüyle denetlenmiş sayılmaz. Son manuel durum mevcut duruma eşitse kaynak zamanı gösterilir; legacy PRESENT otomatik doğrulanmaz. Son50 işlem gösterilir, toplam belirtilir. P26/P37/P39 In Progress: bilet/hak/fiyat/provider sandbox, eski veri yorumu ve kalan ürün kararları açık. Sonraki bağımsız web paketi P39 bağlantı alıcı kaynağı/API/ekran uyumu; üyelik, grup, puan ve shuffle XL karar kapıları korunur. Mobil/LMS ertelenmiştir.

## 8 Ekim — P39 bağlantı kaynağı ve yönlendirme bütün web paketi

Sorun: Bağlantılarım ve EXTERNAL yönlendirme alıcıları /user/friends ortak ACTIVE grup/lonca satırlarından geliyordu; acceptedfriend_requests kaynağı kullanılmıyordu. Shuffle/grup değişikliği kabul edilmiş bağlantıyı görünümden silebiliyordu.

Çözüm: GET /api/user/connections güncel DB sahibi, private/no-store, readonly repeatable-read ve minimal id/name/profession/company/city DTO ile iki yöndeki ACCEPTED bağlantıları okur. Ortak üyelik kabul değildir; PENDING/REJECTED/self hariç. Çelişkili çift kayıt409,1000üzeri503; sahip query override400, silinmiş hesap401. Eski friend_requests verisi yeniden yorumlanmadı, migration yok. Bağlantılarım ve EXTERNAL formu aynı tipli kaynakta; INTERNAL grup/lonca listesi korunur.

Web: yükleme/hata/gerçek boş/yenileme/Türkçe isim-meslek-şirket-şehir arama, çalışan profil ve doğru recipient parametreli mesaj bağlantısı. Hesap+rol+token bağlamı/eski yanıt koruması; alıcı listesi yenilenirken silinmiş/reddedilmiş seçimi temizler. Sahte sıfır performans rozeti ve çalışmayan mesaj düğmesi yeni gerçek akışa taşınmadı. Grup/lonca katalog ve başvuru kolları korunur.

Kanıt: gerçek uygulama/Express/JWT/izole PG17 taze browser **61PASS0FAIL**, output/web-browser/2026-10-08T09-59-34-816Z/browser-report.json. Önceki55senaryo +6bağlantı/yönlendirme senaryosu ve sonDBuzlaştırması: kabul edilmiş farklı grup/ortak üyelik olmayan admin görünür; pending applicant/common seat hariç; hata/retry/arama/profil/mesaj; EXTERNAL kayıpPOSTyanıtı+aynıkeyretry tekDBsatırı, yenileme, iptal edilen seçimin temizlenmesi, ilgisiz hesapta empty. Fake500 yalnızUIhata testi; veritabanına gerçek API üzerinden erişildi. SonDBtekEXTERNALPENDING ve önceki tüm invariants korundu.

Üç odaklı gerçek API/veri kontratı PASS: connections (iki yön, grup ayrılığı, privacy/DTO/owner/duplicate409/readfailure/recovery/bounded503/read-only), referral --web-only (mevcut lifecycle/score rollback + acceptedsource ve grup/lonca ayrılığı), route ownership (177exactstatic/Expressroute,24provider,17retainedlegacy). Loglar output/p39-connections-contract.log, output/p39-referral-contract.log, output/p39-route-contract.log. Build/diff PASS, output/p39-connections-build.log; mevcut bundle/browser-mapping uyarıları. Güncel kaynakla toplu34APIrun yapılmış iddiası yok; önceki P26 birleşik34kanıt ayrı. Screenshot gözle incelendi. Ownedfixture/browser/API/Vite/DB kapatıldı.

Sınırlar: bu paket kabul edilmiş bağlantıların liste/alıcı kaynağını düzeltir. Mevcut POST /referrals alıcı uygunluğunu yeni friend/group politika kuralıyla kısıtlamaz; EXTERNAL yalnız farklıgrup olmalıdır veya INTERNAL yazımı ortakgrup zorunluluğudur diye yeni ürün kararı seçilmedi. Eski /user/friends ortaküyelik endpointi uyumluluk için korunur; mobil ertelenmiştir. Tüm legacywriters/auth/rol/broadRLS güvenlik kabulü ve P39 D'ye bağlı diğer yollar açık. CanlıSupabase/deploy/gerçekmail/ödeme yok; şema22migration/46apptable+ledger=47 değişmedi. P39/P37 InProgress, releaseReady=false; yeni küçükDoneiş yok.

Sonraki büyük web işi: mevcut kabul edilmiş bağlantı/yönlendirme kaynağı tamamlandı; P39'un kalan aktif web çağrıları ve P37 kabul matrisindeki karar bağımsız boşluklar güncel envanterle ele alınır. Üyelik/grup/puan/shuffle XL ürün kararları ve gerçekcanlıgeçiş/provider kapıları açık; mobil7/LMS8 enson.

## 8 Ekim — P37 tek komutla taze bütün web teknik provası

Mevcut eğitim dışı web/API/veri için tek sahipli prova komutu eklendi: npm --prefix server run test:web-rehearsal -- <kurulu Playwright CLI JS yolu>.34API/veri paketi → productionbuild → yeni izole PG17/Express/Vite fixture →61gerçekbrowser/finalDBuzlaştırması; önceki rapor veya currentfixturepointer tekrar kullanılmaz. Aynı checkout'ta ikinci prova exclusive lock ile childiş açmadan reddedilir. Kod/bağımlılık/test/configSHA256 veHEAD başta/sonda eşit olmalıdır; değişmiş kaynaktaki farklı sonuçlar birleştirilemez. Başarılı tur sonunda ownedfixture kapatılır, lock kaldırılır.

**Taze tek prova PASS:** API/veri34/34; buildPASS; browser61/61; SourcePASS; cleanupfixtureexit0. Ana rapor output/web-rehearsal/2026-10-08T10-09-34-959Z/report.json; git'te taşınabilir kopyası server/docs/web-rehearsal-2026-10-08.json. API output/web-acceptance/2026-10-08T10-09-35-506Z/report.json; browser output/web-browser/2026-10-08T10-14-37-516Z/browser-report.json. Bu tur önceki birleşik33+1 veya eskibrowserkanıtı değildir. Başlangıç/son commit8158dd3, dirty=true (yeni prova kaynakları henüzcommitdeğildi);298dosya digest a6f837ea7e3aa444a15930bd8120b7388ac7af5d3924db53192a885322113964 eşit. Testedcode yalnızbasecommitile tarif edilmez; working-sourcehashda gerekir. Bitiş10:16:46UTC. Parallelrejectkanıtı output/p37-parallel-prevented.log, normal lockcleanupdoğrulandı.

Kapsam: WEB01–15, rapor/profil/bağlantı/mesaj/dosya/fatura/etkinlik/yoklama/takvim/kişiselgrup/aktivite/ziyaretçi/üyedizini; üyelik/job/shufflegeçmişi, kapasite, mevcutgörüşme/yönlendirme/destek, fakegatewayödeme, jobtransaction, migrationfresh/upgrade/rollback/sentetikrestore.177route/24provider/17legacy;22migration/47table.177route177E2Esenaryo değildir; retainedknownbaselinekusurlar isolated-smokePASSdiye düzelmişsayılmaz. ÖncekiP26/P39akışları bu taze turda yeniden regresyon kapsamına girdi.

**releaseReady=false; P37 InProgress.** Kararbağımlı hedefler ve canlıkabul kapıları açık: D01–04puan/çıkarma/engel; D05/D08/D10hizmet/kabul/şirket; D07ücret/dönem/gecikme başlangıcı/kısıtlanan hak/açılma; exactshufflecutoff; P09gerçeküretimkopyası/adoption; legacyyoklama/bilet/provider ve tümshufflebildirim kabulü; Sprint6SEC58/59/120veP38. Mobil7/LMS8hariç. CanlıSupabasewrite/migration/deploy/gerçeködeme/mail yok. Uygulama davranışı bu P37 turunda değiştirilmedi; runner, kaynakkabulü ve bütün kanıt toplama teslimidir. Yeni küçükDonegörevi açılmadı.

Sonraki çalışma: yapılabilir büyük web paketi seçiminde bu tek provayı ortak kapanış kapısı kullan; büyük üyelik/grup/puan/shuffle hedefleri için kalan D ayrıntılarını uydurma. Güncel P39 aktif çağrı/yanıt ve eskiwritekolları ürün kararlarıyla beraber ele alınır;61senaryo hedeflerin tümünün bittiği iddiası değildir.
