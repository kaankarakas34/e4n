# WEB-01 — Kişisel rapor API ve web paketi

Tarih: 4 Ekim 2026. E4N-133 Done; ana P39/E4N-111 açık.
Commit/push: [09a2731](https://github.com/kaankarakas34/e4n/commit/09a2731684081106b82d8a180c59b5bacad81b8a).
Local/remote HEAD eşleşti; managed tracked temiz, output kanıtları korunur.

## Teslim

GET /api/reports/me yalnız JWT owner; 7d/30d/90d/1y=365 elapsed gün.
Aynı DB snapshot zamanı, başlangıç dahil/bitiş hariç; REPEATABLE READ READ ONLY.
GET skor/DDL yazmaz, migration eklenmedi:10 sürüm/37 tablo.

| Metrik | Kaynak |
| --- | --- |
| Verilen/alınan referans | giver/receiver owner, created_at kohortu, güncel sonuç |
| Başarılı iş hacmi | PG decimal metin; NULL/negatif eski tutarda toplam unknown, bilinen alt toplam ayrı |
| Tamamlanan birebir | requester veya partner owner, COMPLETED, meeting_date; talep değil |
| Katılan ziyaretçi | inviter owner, ATTENDED/JOINED, visited_at |
| Eğitim saati | user_id owner, sum(hours), completed_date; CEU kuralı değil |
| Kayıtlı güncel puan/renk | users mevcut değer; null unknown, dönem ortalaması değil |

Web Reports gerçek API/typed validation/loading/error/retry/zero/unknown ve owner/token/range/ABA/unmount sınırlarıyla tamamlandı. AdminReports ayrı mevcut ekran korundu. Sabit grafik/12 CEU/PDF alert/kayıtsız rozetler kaldırıldı. İş hacmi tahsilat veya ödeme geliri sayılmaz. Kod sözleşmesi server/docs/personal-reports.md.
Mobil E4N-134 ayrı Low/Backlog; bu teslimde mobil değişmedi.

## Doğrulama

- node server/test/personal-reports-contract.mjs PASS: gerçek web transport/bearer → Express/izole PG17/10 migration; decimal10.10+20.20=30.30, missingamount/nullscore, tüm aralıklar, gerçek boş veri; foreign/future/request/invite dışlama; anonymous401/kayıpowner404/ekuserId-bozuk-tekrarperiod400; GET users/referrals/history snapshot değişmedi; readfailure500→sonraki200.
- node test/personal-reports.mjs PASS: actual TSX+typed service controlled hooks/transport; loading/error/retry/zero/unknown/owner/range/ABA/unmount/ADMIN/malformed/period validation.
- npm run check, npm run build, git diff --cached --check PASS. Mevcut büyük bundle/caniuse/baseline uyarıları sürer.
- Gerçek Playwright /reports: izole HTTP fixture ile render, dönem seçimi, hata500, tekrar yükleme/toparlanma PASS. Gerçek DB kanıtı ayrı HTTP/PG testinde; tek birleşik browser→DB oturumu iddia edilmez.
- Google Fonts/Analytics dış ağ çağrıları tarayıcıda bilerek engellendi; rapor JavaScript hatası görülmedi. Ekran görüntüsü managed output/playwright/personal-reports-web.png. Kendi browser/Vite/konteyner kapandı.

Canlı Supabase yazımı, üretim deploy, gerçek ödeme/SMTP yok. Canlı şema provası P09 ve kapsamlı güvenlik Sprint6 açık.

## Devam

P39 yönetici raporu kaynak/tarih/kapsam doğruluğu: aktif stats/charts sabit70/30, dönüşüm20 ve örnek grafik. Önce AdminReports/aktif route/P08 karşılaştır, sonra API+web+izole veri/rol kabulü bütün paket. D01 aylık puan/D07 hak seçme. Ardından kalan API yöntem/yol/yanıt farkları ve P40 sahiplik. Web işi varken mobil başlatma.

Linear:78 kayıt=23 Done/20 In Progress/35 Backlog. Epic/ana/alt kayıt birlikte, ürün yüzdesi değildir.

