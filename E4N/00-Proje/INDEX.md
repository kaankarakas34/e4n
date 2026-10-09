# E4N belge haritası

İçerik kopyası değil, ihtiyaca göre okuma haritası. Bilinen görevde yalnız ilgili notu/bölümü aç. Eski envanterler tarihsel baz çizgisidir; güncel davranışı kaynak ve testle doğrula.

| İhtiyaç | Kaynak |
|---|---|
| Devam, son teslim, sınırlar | [[E4N/00-Proje/Devam-Notu]] |
| Kesin/açık ürün kararları | [[E4N/01-Kararlar/Kararlar]], [[E4N/01-Kararlar/Acik-Kararlar]] |
| Ödeme, gecikme, kapasite, shuffle kararları | [[E4N/01-Kararlar/Uyelik-Gecikme-Kapasite-ve-Shuffle-2026-10-05]] |
| Hedef kapsam | [[E4N/00-Proje/E4N_Denetim_Dokumantasyon_ve_Gelistirme_Master_Plani]] |
| Paket sırası ve ertelenen kapsam | [[E4N/07-Sprintler/Web-Birlestirilmis-Paketler-2026-10-08]], [[E4N/07-Sprintler/Kapsam-Ayrimi-2026-10-05]]; yalnız sıra/kapsam bölümü |
| Mimari ve veri akışı | [[E4N/02-Mevcut-Sistem/Tam-Sistem-Haritasi]], [[E4N/02-Mevcut-Sistem/Veri-Tabani-ve-Veri-Akisi]] |
| Şema/geçiş | [[E4N/02-Mevcut-Sistem/Sema-Kaynaklari]], [[E4N/09-Dogrulama/P09-Mevcut-Sema-Gecis-Tasarimi]]; güncel migration: `server/migrations/` |
| API sahipliği | `server/docs/route-ownership.md`; gerektiğinde `server/docs/route-ownership.json` |
| Üyelik/grup | `server/docs/membership-records.md`, `server/docs/membership-history.md`, `server/docs/group-capacity.md` |
| Etkinlik/yoklama | `server/docs/event-registration.md`, `server/docs/event-attendance.md`, `server/docs/group-meeting-attendance.md`; son kanıt [[E4N/09-Dogrulama/P26-Etkinlik-Yasam-Dongusu-Web-2026-10-09]] |
| Shuffle | `server/docs/shuffle-workspace.md`, `server/docs/shuffle-submission.md`, `server/docs/shuffle-execution-history.md` |
| Web kabulü/operasyon | `server/docs/web-release-rehearsal.md`, `server/docs/web-job-operations.md` |
| Diğer teknik notlar | `rg --files server/docs` ile konu adını bul; bütün dosyaları okuma |
| Tarihsel tam belge kataloğu | [[E4N/00-Proje/Belge-Katalogu]]; yalnız bu harita yetmezse |

Görev durumu ve kabul kriterleri Linear'dan alınır. Paket kanıtının tamamı Linear'a veya bu indekse kopyalanmaz. Devam notu en fazla 3.000 karakter hedefler; geçmiş [[E4N/99-Arsiv/Devam-Notu-2026-10-09]] içindedir.