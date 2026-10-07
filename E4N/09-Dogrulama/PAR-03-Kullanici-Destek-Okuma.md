# PAR-03 — Kullanıcı destek okumaları

3 Ekim 2026, commit `3c34a4c`, yönetilen dala push.

## Uygulama

Liste array/row/id/user_id/subject/status/date/metin doğrulanır. ADMIN API sözleşmesi tüm talepleri döndürür; diğer oturumlarda user_id mevcut kullanıcıya ait olmalıdır. Yanlış sahip veya malformed tüm response görünür hata yapar. Gerçek [] ayrı boş hal; network error sahte boş sonuç değil.

Detay ticket id ve listeden alınan sahibi doğrular; messages array/row/ticket_id/id/sender_id/metin/date doğrulanır. Loading/error/retry/trueempty ayrılır. Talep seçimi önceki mesajı gizler; target/sequence/ref eski sonuçları atar. Close, session değişimi ve unmount sınırları. Yeni hesapta eski liste/detail/modal/draft gizli ve effectte sıfırlanır. Auth yokken istek yok. Eski create/reply callback oturum ve reply hedef sınırı eklendi; bu teslim yazma ACK/pending tamamlandığı anlamına gelmez.

## Kanıt

`node test/user-support-read.mjs`: gerçek TSX transpile, hook/API enjeksiyonu. MEMBER liste/owner, malformed/network, trueempty/retry; detail wrongtarget/wrongowner/message/date, seçim/close/logout/session/unmount. Başarılı.

`npm run check` exit0, `git diff --check` başarılı. Önceki admin yazma commitinde tam build başarılı; bu ikinci commit için build tekrar çalıştırılmadı, tip kontrolü geçti.

## Sınır ve sonraki iş

DOM/tarayıcı/HTTP/DB/Expo kanıtı değil. Canlı Supabase yazılmadı. Server create /tickets 201 ticket row (id/user_id/subject/status/created_at/updated_at); reply 201 success=true. Sonraki iş bu farklı ACK sözleşmelerini doğrulamak, ortak tek pending ve confirmed-write/read-refresh ayrımı, modal kapanıp yeniden açılırsa yeni taslağın korunması. PAR02/03/04 ana kabulü, ürün kararları ve Sprint6 güvenlik açık.
