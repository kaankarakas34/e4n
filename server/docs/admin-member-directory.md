# WEB-14 — Yönetici hesap ve grup üyelik dizini

`GET /api/admin/member-directory`: JWT owner UUID ve güncel veritabanı ADMIN rolü; olmayan hesap401, diğer roller403, query400. Read-only REPEATABLE READ snapshot, private/no-store. Kullanıcılar bir kez listelenir; tüm mevcut grup üyelikleri ayrı dizide döner. Hesap durumu, grup durumu ve üyelik kayıt durumu ayrı kaynak alanlarıdır. Null hesap durumu bilinmiyor; DRAFT grup ve REQUESTED üyelik aktif hak gibi sunulmaz. Meslek onayı, abonelik veya kabul hakkı hesaplanmaz.

Explicit kullanıcı alanları iletişim/şirket/meslek/rol/hesap durumu/kayıt tarihi/görev/LinkedIn ile sınırlı; password ve ödeme bilgisi taşınmaz. En çok5000 hesap/50000 üyelik; taşma503, okuma hatası500. Liste sessizce kesilmez. API güncel kaynak şemasını okur, migration eklemez.

AdminMembers varsayılan yeni dizini: Türkçe arama, rol/hesap durumu/grup filtreleri, ayrı topluluk görünümü, hesap detayı ve tüm grup kayıtları. Bilinmeyen/null değerler korunur. Filtre sentinel değerleri gerçek DB değerlerinden VALUE prefix ile ayrılır. Hata/retry/refresh/loading/gerçek empty ve token-owner değişimi koruması bulunur. Kayıtlı LinkedIn metin gösterilir; URL çalıştırılmaz.

Üye işlemleri düğmesi mevcut legacy yazım kolunu açar. Bu kolun oluşturma/davet/silme/rol/grup taşıma/ücret/şirket kararları, admission ve güvenlik kabulü bu paketle tamamlanmış sayılmaz. P31/P39/D01–D10 ve Sprint6 kapsamı ayrı açık kalır. Mobil ve LMS ertelenmiştir.

## Doğrulama

`node server/test/admin-member-directory-contract.mjs`: izole PG17, kaynak14 migration/repeat0, gerçek Express/JWT/TS transport. Current DB role/revocation/auth/query/cache, unique account + üç ayrı grup (draft/requested dahil), null hesap, private DTO, concurrent writer karşısında tutarlı snapshot/sonraki gerçek okuma, injected failure/recovery, Türkçe arama/filtre/topluluk/duplicate/invalid DTO, admission tablosuna yazmama ve5001 hesap503 PASS.

Gerçek AdminMembers ve testten yakalanmış snapshot ile Playwright PASS: read500/retry, tek hesap/üç üyelik, Türkçe arama/rol/status/grup/topluluk/empty/detail ve bekleyen GET sırasında hesap değişimi koruması. Açık passed=true,3GET; snapshot/browser fixture üretim E2E değildir. Ekran görüntüsü gözle incelendi. `npm run check`, `npm run build`, diff/syntax PASS; mevcut bundle/browser-data uyarıları sürer.

Kaynak14 sürüm/41 tablo değişmedi. Canlı Supabase yazma/migration, deploy, gerçek mail/ödeme testi yapılmadı.
