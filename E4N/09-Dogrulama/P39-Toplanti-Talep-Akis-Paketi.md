# Toplantı talebi — DB, API ve web akış paketi

3 Ekim 2026. Linear: [E4N-124](https://linear.app/e4n/issue/E4N-124/p39-a-toplanti-talebi-akisini-db-api-ve-web-birlikte-tamamla), Done. Commit: [5dbafa3](https://github.com/kaankarakas34/e4n/commit/5dbafa3), `codex/e4n-sprint1-foundation` dalına gönderildi. Önceki d95bdc3 hata baz çizgisini gideren uygulamadır.

## Kullanılabilir akış

Profilde konu/tarih/saat seç → talep oluştur → gönderen ve alıcının listesinde gör → alıcı kabul/ret verir → iki web görünümü gerçek durumu gösterir. Onaylanan talebin mevcut takvim bağlantısı korunur. API liste hatası boş liste değildir; yazma sonucu belirsizse başarı gösterilmez, taslak korunur. Doğrulanmamış e-posta gönderimi vaatleri kaldırıldı.

## Veri ve API

- `0007_meeting_requests`: yeni `one_to_one_requests` tablosu, gönderen/alıcı users FK, kendine talep engeli, PENDING/ACCEPTED/REJECTED kısıtı ve taraf/tarih indeksleri. Legacy `one_to_ones.updated_at` nullable eklenir, eski zaman bilgisi uydurulmaz.
- Talep kayıtları gerçekleşmiş faaliyet tablosundan ayrı. Eski faaliyet satırları ve kullanıcı puanları değişmez; talep/karar puan hesaplamaz. Faaliyetin mevcut kayıt yolu korunur. D01–D10 yeni kuralları seçilmedi.
- POST `/api/one-to-ones/request`: gönderen JWT; aynı anahtar ve içerik 200/tek kayıt, ilk oluşturma 201, farklı içerik 409. Oturum/form içi belirsiz tekrar aynı anahtarı kullanır; yeni form/anahtar aynı toplantıyı ayrıca oluşturabilir.
- GET `/api/one-to-ones`: iki veri kaynağından yalnız ilgili tarafların kayıtları, isim/yön/kayıt türü. İstemci liste şekli/tarih/sahiplik doğrular; hatalar çağırana gider.
- PUT durum: yalnız alıcı, yalnız PENDING geçişi; aynı karar tekrarında 200. Karşıt eşzamanlı iki kararda tek kazanan 200, diğeri 409. Eski COMPLETED değiştirilemez, ekranda Tamamlandı gösterilir.
- İki görünüm ortak hook kullanır: loading/error/retry, tek pending, yazma onayı ile sonraki liste hatası ayrı. Oturum/hedef/unmount değişimindeki eski yanıtlar uygulanmaz. Form çift tık kilidi ve tarih doğrulaması içerir.

## Doğrulama

| Kontrol | Sonuç / kanıt kapsamı |
|---|---|
| `node server/test/meeting-contract.mjs` | Geçti. Atılabilir loopback PostgreSQL17 + gerçek Express + gerçek api.ts. 7 sürümlü temiz kurulum; mevcut 6 sürüm yükseltmesi ve satır/puan koruma; oluşturma/tekrar/çakışma; anonim/taraf/ilgisiz/alıcı sınırları; 200/409 yarışı; GET500 istemcide reject. |
| `npm run test:isolated` (server) | Geçti. 35 uygulama tablosu/7 sürüm; tekrar/checksum/CLI/legacy-init ve 0001–0004 yükseltme regresyonları. Önceden bilinen diğer iş kuralı hata baz çizgilerini de içerir; hepsi giderildi anlamına gelmez. |
| `node test/meeting-flow.mjs` | Geçti. Gerçek hook, iki TSX görünümü ve modal kontrollü React harness: read/error/retry, ACK/pending, oturum/hedef/unmount, aynı anahtar tekrar, tarih ve durum etiketleri. |
| `node test/meeting-read-api.mjs` | Geçti. Gerçek istemci malformed/yanlış hedef/yanlış status ACK reddi, karar verilmiş anahtar tekrarı, legacy durum ve okuma hatası. |
| Kullanıcı/admin destek testleri | Geçti; paylaşılan API değişikliği regresyonu. |
| `npm run build`, `npm run check`, `git diff --check` | Geçti. Derlemede mevcut paket boyutu/veri güncelliği uyarıları var. |

## Kalan ana kapsam

Gerçek tarayıcı ve Expo cihaz/mobile talep eşitliği doğrulanmadı. Canlı Supabase şeması, gerçek yedek/adoption/geri dönüş ve yayın P09/P36'da açık. Migration API importunda/canlıda çalıştırılmadı; yayından önce migration sırası ve mevcut şema uyumu ayrıca değerlendirilmeli. Yeni users FK'leri P10 silme/saklama tasarımına eklenmeli; otomatik cascade seçilmedi. Canlı yazma, üretim dağıtımı, e-posta veya gerçek ödeme yapılmadı.

## Çalışma biçimi

Bu teslim tek bütün akıştır. Bundan sonraki teslimlerde de veri → API → ilgili ekranlar → izole kabul birlikte tamamlanır; alt ekran düzeltmesi bitiş olarak sunulmaz. Karar gerektirmeyen ortak sözleşmeler tamamlandıktan sonra P09/P10/P11 veri ve durum temeli; ilgili D kararlarıyla üyelik/ödeme → grup → puan/hak → shuffle sırası korunur. Mobil ve Sprint6 kabulü ayrı kapanış koşuludur.
