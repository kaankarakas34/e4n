# WEB-02 — Yönetici raporu API ve web paketi

4 Ekim 2026. Linear E4N-135 Done; ana P39/E4N-111 In Progress.
Commit/push: [4b11c1d](https://github.com/kaankarakas34/e4n/commit/4b11c1d155fd394d6d254b2ce63514ca5959c3fd).
Local/remote HEAD eşleşti; managed tracked temiz, output kanıtları korunur.

## Kaynak incelemesi ve teslim

Önceki sabit70/30/dönüşüm20/örnekgrafik düzeltmeleri zaten mevcut kodda null/availabilityfalse olarak uygulanmıştı; tekrar iş sayılmadı. Kalan rapor kaynakları bu pakette sağlandı.

- GET /api/admin/reports: tek REPEATABLE READ READ ONLY snapshot; JWT ve mevcut DB hesabı ADMIN olmalı. Silinmiş/demoted hesabın eskiADMINtoken'ı kabul edilmez.
- Dönem7d/30d/90d/365d; aynı DB now, başlangıç dahil/bitiş hariç. Stock currentaccount/ACTIVEgroup/team ayrı.
- Referans oluşturulma kohortu ve güncel başarı; total/internal/external/unclassified decimal metin; eskiNULL/negatif tutar unknown, bilinen alt toplam ayrı.
- Yeni hesap created_at (net büyüme/deletedhistory değil); COMPLETED one_to_ones meeting_date, talepler/future hariç; ziyaretçi visited_at ve kayıtlı status counts.
- Aylık gerçek UTC tablo, seçilen dönemle kırpılmış ilk/son ay; puantrendi değil. Puan/renk users güncelstored; NULLunknown.
- Yoklama attendance→events.start_at: attendance.created_at tarihine göre sayılmaz; gelecekteki etkinlik/kayıtsız yoklama ABSENT varsayılmaz.
- AdminReports genel/performance/attendance üçsekme aynı typed response. All-or-error/retry/zero/unknown; owner/role/token/range/retry/ABA/unmount sınırları.
- Client validation: beklenen aylar, category/monthly totals exactcents, stocks/performance/attendance ids tutarlı; malformed gösterilmez.

Kod sözleşmesi: managed server/docs/admin-reports.md. Yeni migration yok10sürüm/37tablo. JOINED/CONVERTED eşitlenmedi; ziyaretçi hak/dönüşüm hedefi, yeni puan/üyelik politikası icat edilmedi.

## Kanıt

| Gate | Sonuç |
| --- | --- |
| node server/test/admin-reports-contract.mjs | Actual webbearer→Express/izolePG17/10migration PASS |
| Kaynak/toplam | Internal10.10+20.20=30.30; totalknown35.80; NULLexternalunknown; unclassified5.50; period/monthly totals PASS |
| Dönem/rol | Allranges, future/request exclusion; eventdatevscreated_at; anon401/member403/DBrole403/demotion403/missingadmin403/invalidquery400 PASS |
| Readonly/error | Snapshot değişmedi; injectreadfailure500→sonraki200; gerçekempty0 PASS |
| node test/admin-reports.mjs | Actual TSX/typed:3tabs/zero/unknown/error/retry/session/token/range/ABA/unmount/malformed/totals PASS |
| npm run check/build, stageddiffcheck | PASS; mevcut büyükbundle/caniuse/baseline uyarıları sürer |
| Gerçek Playwright | PGtestinden yakalanmış izolefixtures:3tabs/period7d/30d/500error/retry PASS |

Tarayıcı kanıtı captured fixture yanıtlarıyladır; real HTTP/PG ayrı test, tek birleşik browser→DB oturumu iddia edilmez. GoogleFonts/Analytics dışistekleri bilerek engellendi; üçüncüconsoleerror injected500, raporJSerror yok.
Ekranlar managed output/playwright/admin-reports-overview.png ve admin-reports-attendance.png.
Kendi browser/Vite/PGkonteyner kapandı. CanlıSupabase/productiondeploy/ödeme/SMTP yok.

## Uyumluluk ve devam

Eski /reports/stats mobil app/admin/index.tsx ve reports.tsx'te kullanılıyor; mobil öncelik sonrası ayrıuyarlanacak. Eski stats/charts/traffic/attendance wrappers artık webpagecaller değil; uçlar P08/P40/mobile compatibility ve Sprint6 kapsamına kalır. AdminDashboard ayrı member/group/team listeleri+eventstore kullanır. Bu paket tümraporların/sisteminDone olması değildir.

Sonraki web: güncel P39 aktif PublicProfile friendcheck, MessagesPage messages/conversations/send, DocumentsPage documents, AdminExamssave/delete, CreateMemberPOST ve shufflenotify eksiklerini kullanım/veri/scope/Dbağımlılığına göre bütün paketlere ayır. Önce mevcut sosyalprofil/bağlantı akışını DB ve aktiffriend routes ile karşılaştır; mesaj/documents için mevcut şema ve saklama/erişim ihtiyacını belirle. Dbağlı üyelik/shuffle hakları seçilmez. Mobil134 Low/Backlog ayrı.

Linear tamliste:79 kayıt,24 Done/20 In Progress/35 Backlog. Epic/ana/alt birlikte, ürün yüzdesi değil.
