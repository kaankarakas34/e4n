# PAR-04 — Başkan paneli yoklama yanıtı ve tek gönderim

3 Ekim 2026, `8d79052` yönetilen dala push edildi.

## Teslim

Mevcut GroupManagerDashboard submitAttendance çağrısı, yalnız success=true ve dolu string eventId yanıtıyla kayıt onayı gösterir. Reject/null/bozuk yanıt başarı değildir; “Kayıt sonucu doğrulanamadı. Yeniden göndermeden önce toplantı kayıtlarını kontrol edin.” mesajı gösterilir. Ağ hatasının kesin başarısız kayıt olduğunu iddia etmez, otomatik yeniden POST yapmaz.

Ref kilidi aynı render/tick içinde tek pending çağrı sağlar; kaydet düğmesi işlem boyunca disabled. Payload yalnız formda gösterilen ACTIVE üyelerden oluşur; görünmeyen REQUESTED kayıtların varsayılan PRESENT değeri gönderilmez. Mevcut toplantı tarihi/konusu/durum sözleşmesi korunur; yeni puan/mazeret/vekil kuralı seçilmez. Formun mevcut varsayılan PRESENT seçimi ayrıca ürün kabulüne tabidir.

Başarılı ACK ile mevcut kayıt tabına geçilir ve liste GET yenilenir. GET hatası ayrı “Kayıt onaylandı; liste yenilenemedi, yeniden kayıt göndermeyin” durumudur; kayıt başarısız denmez. Kullanıcı/rol/grup bağlamı değişince eski callback göndermez ve eski sonuç bildirim/veri yazmaz; unmount sonrası state yazılmaz. Test kullanıcı ve rol değişimini ölçtü; ayrı grup değişimi testi yapılmadı.

Toplantı oranları null/denominator0/tutarsız sayıda Veri yok; gerçek %0 ve %50 korunur. Kaynak etiketi kayıtlı katılım/güncel aktif üye oranıdır; PRESENT başvuru kaydıyla da kullanılabilir, fiziksel yoklama kanıtı değildir. Aggregate kodu bilinmeyen sayıyı0 yapmaz; bu aggregate şu anda ekranda kullanılmıyor.

## Kanıt

- `node test/manager-attendance.mjs`: gerçek TSX kontrollü hooks/API; reject/null/bozuk ACK, onay ve refresh hatası ayrımı; aynı handler çift çağrısı→tek submit ve disabled; yalnız ACTIVE payload/konu/hedef; kullanıcı/rol değişimi ve eski handler; unmount state değişmez; null/0 denominator/tutarsız/gerçek %0/%50 oranları başarılı.
- `npm run check` TypeScript exit0; diff kontrolü başarılı; commit/push/temiz yönetilen dal.

Gerçek ağ, HTTP/DB rol yazma deneyi, tarayıcı/cihaz veya dağıtım yapılmadı. API/server bu tur değişmedi, istemci mevcut yazma yolunu kullanıyor. Canlı Supabase/ödeme/e-posta testi yok. Sunucu her çağrıda yeni events kaydı ve async puan hesabı üretir; JWT-only kaynak rol/sahiplik/idempotency bulguları önceki notta açık. İstemci kilidi farklı sekmeler, timeout sonrası elle tekrar veya sunucu tekrarı için çözüm değildir. D01/Sprint6 ve ana PAR02/04 kabulü açık.

## Sonraki bağımsız iş

Başkan paneli ilk yüklemede cache/kısmi kayıt, hata→grup yok ve referrals catch→[] davranışlarını taşıyor; oturum/grup okuma bağlamı ve görünür hata/tekrar için gerçek kaynakları denetle. Shared getGroupActivities ve getMeetingAttendance hatayı[] yapıyor. Önce bu teknik okuma/hata sözleşmesini düzelt; mevcut rol/sahiplik politikasını ürün kararı olmadan icat etme.
