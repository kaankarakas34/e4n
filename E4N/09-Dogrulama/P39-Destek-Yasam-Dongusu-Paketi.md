# P39-B — Destek yaşam döngüsü paketi

3 Ekim 2026. E4N-127 Done; ana P39/P08/PAR açık. Commit `a2823cb`, yönetilen dal `codex/e4n-sprint1-foundation`; push başarılı, local/remote HEAD eşit ve çalışma ağacı temiz.

## Birlikte tamamlanan kapsam

Talep oluşturma → ilk mesaj → üye/başkan kendi listesi ve detayı → yanıt → admin cevap/kapat/aç → iki web ekranında güncel liste/detay.

- Yeni `0009_support_mutations.sql`: kullanıcı + requestKey primary key, operation/fingerprint, ticket FK, JSON sonuç ve zaman. 36 uygulama tablosu / 9 sürüm. Eski tickets/ticket_messages değiştirilmez; geriye sahiplik/statü ataması yok.
- Aktif handler sahibi `server/src/support-processing.js`; index'teki 145 satırlık eski blok yerine tek kurulum. tickets/support liste, oluşturma, detay, mesaj ve durum alias'ları ortak modüle bağlı. Eski bağlantısız route dosyaları monte edilmedi.
- Aynı kullanıcı/anahtar advisory transaction kilidi; ardından ticket row lock. Talep + ilk mesaj + receipt veya yanıt + ticket durum/güncelleme + receipt tek commit. Aynı anahtar yarışında tek talep/mesaj; farklı eylem/hedef/metin409.
- Kaydedilmiş eski ACK tekrar dönerken yeni mesaj/durum yazılmaz: eski reply kapatılmış talebi yeniden açmaz; eski close tekrarından sonra daha yeni open korunur. Snapshot ACK mevcut son durum iddiası değildir; ekran yeniden GET ile güncel sonucu alır.
- Olmayan durum hedefi404; geçersiz UUID/anahtar/gövde/statü400; üye/başkan başka hesabın talebinde403, statü değişikliği ADMIN. OPEN/ANSWERED/CLOSED mevcut sözlüğü korunur. Üye kapalı talebe yanıt veremez (mevcut web davranışı); admin yanıtının ANSWERED davranışı korunur.
- Detay tek repeatable-read snapshot'ta ticket/mesaj okur; liste/detail deterministik eşit-zaman sıralaması. Kaydetme hatası gerçek500 ve rollback; hayali success yok.
- İki web ekranı aynı giriş/özne/hedef için belirsiz sonuçta aynı key'i tekrar kullanır; kesin ACK sonrası yeni intent. Mevcut taslak, tek pending, hedef/oturum/unmount ve refresh hata ayrımı korunur. API reply ACK ticket/message/status; status ACK ticket/requested status eşleşmesi ister.
- Teknik girdi sınırı: boş metin reddi, başlık255, mesaj10000 karakter; DB VARCHAR sınırı uygulamada görünür400. Ürün D01–D10 kararları seçilmedi.

## Kanıt

| Doğrulama | Sonuç |
| --- | --- |
| `node server/test/support-flow.mjs` | PostgreSQL17 + gerçek Express/api.ts: üç paralel create/reply tek satır, owner/role/anon, tickets/support alias, invalid400/missing404/foreign403, fingerprint409, read/status/message ACK, eski ACK yeni durumu değiştirmez, SQL failure rollback/same-key retry, admin reply/close yarış, legacy key'siz gövde,8→9 eski ticket/mesaj korunması ve tekrar0 |
| `node test/user-support-read.mjs` | Gerçek TSX kontrollü hook/API: mevcut liste/detail/yazma sınırlarının tamamı; create/reply lost-response aynı key, ACK sonrası aynı metin yeni intent |
| `node test/admin-support-list.mjs` | Gerçek admin TSX kontrollü: rol/target/pending/read/write regresyonları; reply/status lost-response aynı key, ACK sonrası yeni intent |
| `node test/support-api.mjs` | Gerçek API transport kontrollü fetch: wrong-target/malformed/status/message ACK reddi, key gövdesi, HTTP404 korunur |
| `node server/test/isolated-smoke.mjs` | Temiz9/tekrar0/36 tablo; eski init adoption8;0001–0004→9; drift/checksum/manualHTTPDDL sınırları. Puan/grup/shuffle için bilinen hata baz çizgileri düzelmiş sayılmaz |
| `node server/test/payment-flow.mjs`, `meeting-contract.mjs` | Yeni migration zincirinde ödeme ve toplantı gerçek izole HTTP/DB regresyonları geçti; downgrade fixture'ları0009'u doğru sırada kaldırır |
| `npm run check`, `npm run build`, `git diff --check` | Geçti; mevcut büyük paket/eski Browserslist uyarıları sürüyor |

İlk support fixture koşusunda JWT ADMIN olmasına rağmen DB sender_role MEMBER tutulmuştu; fixture'da gerçek rol verisi eşleştirildi, nihai tüm koşular geçti. Testler izole loopback PostgreSQL; canlı Supabase/SMTP/ödeme/üretim dağıtımı yok. Konteynerler kaldırıldı.

## Açık sınırlar

- Key'siz eski istemciler eski şekille çalışır, onlar için dedup garantisi yok. Web key bellekte; sayfa yenileme/unmount sonrası otomatik intent kurtarma bu paket değildir. Aynı anahtar/aynı metin yalnız aynı kullanıcı kapsamındadır.
- 0009 migration ve yeni ACK yanıtı, yeni istemci sürümünden önce hazır olmalı. Canlı adoption/yedek/rollback uygulanmadı; P09/P36 açık. Yeni JSON receipt için saklama/silme politikası P10 kapsamında; ticket/user silinince ilişkili receipt cascade olur.
- Gerçek tarayıcı DOM/Expo/cihaz kabulü ve mobilde requestKey/ACK adaptasyonu açık. Ana P39/PAR işleri bu paketle kapatılmadı; tam güvenlik Sprint6.

## Sonraki paket ve mobil çalışma durumu

P32/PAR03–04 destek akışını mobilde aynı API/rol/yanıt/tekrar sözleşmesine getir; üye ve admin ekranı + ortak istemci + test birlikte. Yönetilen web checkout'ta mobile gitlink `db20284` ve klasör boş, .gitmodules yok. Asıl mobil kaynak `C:/Users/murat/OneDrive/Desktop/e4n2/mobile` içinde ayrı repo ve **dirty**: değiştirilmiş takipli dosyalar ve untracked auth/tabs/admin/features/constants/api/hooks/utils. Bu mevcut kaynak korunur; boş gitlink ilk örneğine geri dönülmez. Önce mobile mevcut notlar/kod/commitleri incele; değişiklikleri kaybetmeden izole snapshot/managed mobile dalında çalış. Web ana dalı bu teslimde mobile gitlink'i değiştirmedi. Kullanıcıdan yeni D kararı gerektirmeyen destek eşitliği yapılabilir.
