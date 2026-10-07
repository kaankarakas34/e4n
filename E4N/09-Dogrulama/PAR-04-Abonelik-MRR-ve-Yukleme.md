# Abonelik MRR ve yükleme sözleşmesi — 2 Ekim 2026

`5543b53`: web AdminSubscriptions plan adından7200/6500/5750/6000 ekleyen MRR tahmini kaldırıldı. Gelir kaynağı/formülü doğrulanmadığından Veri yok; boş listede bile bilinmeyen MRR0 ilan edilmez. D07 tarifesi/dönemi seçilmedi.

Admin ekranı store loading/error durumunu okur; ilk taze yükleme tamamlanmadan persistent cache satırlarını/özetlerini göstermez. Hata için alert/retry, loading için status; hatada eski liste ve yanlış0 KPI görünmez. Başarılı gerçek boş liste normal şekilde gösterilir. Store fetchAll null/bozuk kök yanıtı artık başarılı[] yapmaz; error durumunda cache korunur ama bu admin ekranda gizlenir.

## Kanıt

`node test/membership-store.mjs`: gerçek Zustand store null/nesne/string/hata yanıtlarını error sayar; başarılı gerçek[] cache/error temizler. `node test/admin-subscriptions.mjs`: gerçek bileşen kontrollü hook/store ile ilkcache/yükleme/hata gizlenmesi, retry, gerçek liste/boş ve MRR bilinmiyor doğrulanır. `npm run check` exit0, diff check temiz, commit push/temiz ağaç. Backend değişmedi; canlı DB/ödeme isteği yok. Gerçek tarayıcı kabulü açık.

## Açık veri ve karar sınırları

- GET memberships ADMIN'a tüm users satırlarını döndürür; gerçek membership tarihçesi değildir. End_date/plan users abonelik alanlarından, status account_status veya AD_EXPIRED sanal durumundan geliyor. Yeni üyelik modeli/tarihçe kararı seçilmedi.
- MRR dışındaki select etiketlerinde eski7200/39000/69000 fiyat metinleri var; tarih/dönem ve yazma akışı D07 kapsamında ayrıca incelenmeli. Bu teslim bütün tarife ekranını düzeltti iddiasında bulunmaz.
- membershipStore create/update hataları store error ile yakalanıp çağırana throw edilmez. MemberProfile/Membership tüketicileri bu store error/loading alanlarını okumuyor; cache veya başarı bildirimi farkı denetlenmeli.
- CREATE/UPDATE membership yanıtında start_date/last_renewal_date NOW üretilen alanlar var; bu kaynağı gerçek tarihçe olarak kullanma. Üyelik hakları/tarifeler/yenileme D07 kararına bağlı.
- Ana PAR04 tamamlanmadı. Sonraki bağımsız iş MemberProfile/Membership store hata→başarı bildirimi sözleşmesi; yetki ve üretim yan etkisi sınırları izole incelenecek.
