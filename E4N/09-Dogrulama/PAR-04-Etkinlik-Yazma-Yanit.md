# PAR-04 — Etkinlik yazma yanıtı

3 Ekim 2026. `46ac7cd` ve API ACK düzeltmesi `00eb5e3` yönetilen dala gönderildi.

eventStore create/update/delete hatayı çağırana reject eder, loading çözülür/error saklanır ve mevcut cache korunur. Create/update kayıt nesnesi id/title/start_at/is_public biçimi doğrulanır; update id hedefle eşleşir. DELETE yalnız success=true ile cache satırını kaldırır. API deleteEvent önceden yanıtı düşürüyordu; server ACK artık return edilir. İlk commit sonrası TypeScript void.success hatası bunu ortaya çıkardı, ikinci committe düzeltildi ve son tsc başarılıdır.

AdminEvents create/update catch görünür alert; başarısız form kapanmaz/reset olmaz. Delete ve status catch de görünür hata verir. Sonuç belirsizliğinde kesin silinemedi iddiası yapılmaz. Mevcut server POST/PUT RETURNING kayıt, DELETE success=true sözleşmesi kaynakta incelendi; POST/PUT/DELETE JWT-only ve DELETE rowcount anlamı ayrı açık. Bu tur server/rol politikası değişmedi; HTTP/DB çağrısı yapılmadı.

`node test/event-store-write.mjs` gerçek Zustand/persist store: reject/null/bozuk/wrongid mevcutcache korunur; confirmed create/update/delete cache değişir, error/loading temizlenir. `node test/admin-event-participants.mjs` gerçek TSX: create/update failure form açık, delete/status görünür error; önceki katılımcı akışı regresyonu. `node test/meeting-read-api.mjs` gerçek API DELETE ACK dönüşü ve önceki read testleri başarılı. Son `npm run check` exit0, diff/push/temiz dal. Kontrollü API/store/component ortamı, gerçek ağ/tarayıcı/cihaz yok; canlı Supabase/ödeme/mail/dağıtım yok.

Tek mutation tüketicisi kaynak taramasında AdminEvents; read tüketicileri AdminEvents/AdminDashboard/UserEvents. Genel fetchEvents hata resolve/cache ve malformed read, ilk fresh read/oturum kapsamı açık. Sıradaki bağımsız iş read sözleşmesi ve bütün tüketicilerin loading/error/gerçek boş/cache durumu; description optional filtreleme. Mutation tek pending/stale session kapsamı da ayrı açık; bu teslim onları çözmez. D kararları/ana PAR02/04/Sprint6 kapanmadı.
