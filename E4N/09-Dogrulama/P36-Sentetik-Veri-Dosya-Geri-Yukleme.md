# P09/P35/P36 — Sentetik veri ve kalıcı dosya geri yükleme provası

`npm --prefix server run test:restore` yalnız yeni, rastgele adlı disposable PostgreSQL17 Docker konteyneri oluşturur. Üretim URL'si veya dış yedek kabul etmez; environment DB ayarları import öncesi loopback fixture ile değiştirilir. Yeni şema14 sürüm/41 uygulama tablosu; ledger ile42 tablo. Üç sentetik hesap, Unicode mesaj, kayıt/PENDING bilet, sahipli ve NULL sahiplikli ödeme, PDF fatura ve belge bytea örnekleri vardır. Diğer tablolar boş olabilir; gerçek23 kullanıcı/11 grup üyesi/5 ödeme provası değildir.

## Uygulanan prova

1. Her42 tablonun satır sayısı ve sıralı JSONB satırlarının SHA256 manifesti, kolon/kısıt/indeks/tetikleyici/fonksiyon kataloğu, effective ACL/owner/RLS, policy/default grant ve sequence durumları yakalanır. Bytea hex ile korunur; binary NUL/non-UTF8 içeren PDF fixture vardır. Manifest synthetic-only ve `productionBackup:false` kaydıyla output'a yazılır; kişisel satırlar rapora yazılmaz.
2. PostgreSQL17 `pg_dump -Fc` schema+data yedeği konteyner içindeki sabit fixture dosyasına alınır. Ayrı yeni hedef DB'ye `pg_restore --exit-on-error --single-transaction` yapılır. Manifest eşleşir, sürümlü migration tekrar0'dır.
3. Hedefte fatura bytes aynı uzunlukla bozulur. Satır sayısı aynı kaldığı halde row hash farkı yakalanır. Aynı yedekle yalnız disposable hedefte `--clean --if-exists --single-transaction` geri yüklenir; manifest yeniden eşleşir.
4. Gerçek mevcut invoices handler/JWT/current DB role kullanılarak geri yüklenmiş DB'den HTTP indirme doğrulanır: üye kendi PDF bytes200/cacheprivate-no-store, anonymous401, diğer üye404, sahteADMIN claim404, güncelADMIN200, DB rolü düşürülmüş eskiADMIN token404. Mail fonksiyonu testte çağrı olursa hata üretir. Web'de kullanılan download endpoint'i korunur; yeni ekran veya tarayıcı testi iddiası yok.

PG17 dump/restore kısıtları reparse ederken varchar-literal array dış `::text[]` cast'ini eleman `::text` cast'ine çevirebilir. Yalnız bu dar literal-array yazımı katalog karşılaştırmasında normalize edilir; enum değeri, sütun, operatör veya diğer SQL farkları korunur. `relacl=NULL` implicit owner grants ile açık owner-only grant aynı effective ACL olarak karşılaştırılır. Bu raw catalog SQL hash'inin birebir eşitliği iddiası değildir.

## Sınırlar ve sonraki kapılar

Bu paket P09/P36'nın gerçek canlı yedek, canlı sürümsüz adoption ve release kapısını kapatmaz. Eski `/uploads` faturalarının kaynak bytes erişimi/URL sayımı/taşıma eşlemesi P35'te açık; yeni bytea'nın dump/restore ile korunması doğrulandı. Önceki canlı katalog kopyası satır içermediği için bu sentetik veri provası da gerçek üretim yedeği yerine sunulmaz. Üretim rollerinin/global grants ve Supabase auth/storage yönetim şemalarının ayrıca doğrulanması gerekir. Konteyner aynı cluster içinde pre-existing anon/authenticated rollerini kullanır; cross-cluster role restore kabulü değildir. Sürekli yazım altında snapshot/cutover, RPO/RTO, hacim ve süre kabulü yapılmadı. Docker içi dump test sonunda konteynerle kaldırılır; kullanıcı yedeği saklandığı iddia edilmez.

P26'daki kayıt/PRESENT geçmişi gerçek yoklama kanıtından ayırt edilemiyor. P25/D hak ve puan hedefleri ile geçmiş veri eşlemesi onaylanmadan bütün attendance satırları yeni anlamla işaretlenmedi. Teknik sırada bu bağımsız geri yükleme paketi uygulandı; P26/P14 ana görevleri açık.

Dayanak: [PostgreSQL17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html). Database dump cluster rollerini içermez; custom archive restore aracı gerektirir. Canlı Supabase'e DDL/DML, üretim deploy veya ödeme/mail yok. Mobil/LMS başlamadı; mevcut tablolar yalnız yedekte korunur.


Commit/push `b8bf465da76b0560cf31587b442d511a4c63b694`; Linear81/107/108IP ve98 kalan kapısı güncellendi. Son testPASS, syntax/diffPASS.
