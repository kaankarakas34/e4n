# PAR-04 — Admin etkinlik kartındaki bilinmeyen veri

3 Ekim 2026; commit `8ff5a0d`, yönetilen dala push edildi.

## Teslim ve test

Eksik/geçersiz attendees alanı0 katılımcı sayılmaz. Array ve her satırın boş olmayan string id'si doğrulanır; gerçek[]0 ve doğrulanmış liste length korunur. Eksik/geçersiz kapasite Bilinmiyor. Eksik/tanınmayan event_type Sosyal değil Tür bilinmiyor; gerçek SOCIAL etiketi korunur.

`node test/admin-event-participants.mjs`: gerçek TSX kontrollü eksik/null/object/invalid row/empty id, gerçek boş/count, unknown capacity/type ve SOCIAL; önceki katılımcı/rol/pending/fiyat/tarih/form regresyonları geçti. İlk unknown-type assertion filtredeki Sosyal option'ını da yakaladı; yalnız kart Badge'ine daraltılıp test tekrar başarılı. `node test/event-read-screens.mjs`, `npm run check`, staged diff başarılı.

Test gerçek DOM/tarayıcı/HTTP/DB/mobil değildir. Katılımcı liste API'sine yeni alan/rol eklenmedi. Canlı işlem veya dağıtım yok; ana PAR02/04 ve Sprint6 güvenlik açık.

## Tür sözleşmesi kaynak denetimi

AdminEvents typeMap NETWORKING/CONFERENCE/SOCIAL'i meeting, WORKSHOP/SEMINAR'ı education yapıyor. Aktif server event POST/PUT type alanını saklıyor, liste SELECT e.*; event_type gönderilmiyor/saklanmıyor. Bu statik kaynak kanıtıdır. meeting→üç alt tür ve education→iki alt tür ters eşlemesi bilgi kayıplıdır; herhangi bir ürün alt türü uydurulmadı. Şema/yayın/HTTP ölçümü bu tur yok.

Düzenleme formu event.event_type değerini alıyor; undefined için submit typeMap fallback meeting. Böylece yalnız başlık düzenlemesi education kaydını meeting yapabilir. Bu commit yazma gövdesini değiştirmedi. Sıradaki bağımsız iş mevcut server type korunarak bilinmeyen subtype ile title-only güncellemede tür alanını değiştirmemek ve kontrollü payload testi. Ayrıntılı tür kalıcılığı ve filtre eşitliği ayrı açık ürün/model işi.
