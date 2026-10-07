# Abonelik yazma hatası sözleşmesi — 2 Ekim 2026

`membershipStore.create/update` API hatasını store error'a yazıp Promise'i başarılı bitiriyordu. MemberProfile ve Membership bunu başarı sayıp bildirim gösteriyordu. `03183b9` ile create/update artık hatayı çağırana geri fırlatır; renew/expire bu reddi taşır. Cache hata/bozuk yanıtta değişmez. Create boş/kimliksiz yanıtı; update yanlış veya eksik kimliği reddeder. renew bulunmayan cache kaydında API isteği yapmadan hata verir; sessiz başarı yok.

MemberProfile iptal düğmesi yeni rejected Promise'i yakalar ve iptal edilemedi bildirir. Mevcut create/renew catch'leri başarısızlığın ardından başarı bildirmez. Membership hata metni üyelik güncellenemedi der; ödeme sağlayıcısının başarısız olduğunu iddia etmez. Üyelik dönem/formül/rol/tarife veya ödeme callback kuralları değiştirilmedi.

## Kanıt

- Gerçek Zustand store testi create/update/renew/expire hatalarının rejected Promise olması, değişmeyen cache, error/loading; bulunmayan renew API çağrısı yok; bozuk/yanlış kimlik yanıtı reddi; başarılı create/expire cache ve error temizlenmesi geçti.
- Gerçek iki ekran kontrollü hook/store testi create/renew başarısızlığında ödeme/profil başarı mesajı yok; expire hatası yakalanıyor. Ödeme sağlayıcısı, e-posta veya ağ çağrısı yapılmadı.
- `npm run check` exit0; React Best Practices kontrolünde yeni hook/bağımlılık/paket veya ek veri isteği yok, mevcut Promise catch zincirleri doğrulandı. Gerçek tarayıcı veya üretim ödeme kabulü değildir.
- `03183b9` yönetilen dala push, çalışma ağacı temiz. Canlı Supabase yazması/dağıtım yok.

## Açık kalan sınırlar

API başarılı yanıt verdiğinde uygulanan gerçek üyelik/tarife/sonradan callback başarısızlığı ayrı eski risklerdir; bu düzeltme bunları kapatmaz. Cache kullanıcıya göre ayrılmıyor; MemberProfile/Membership store fetch error/loading okumadığından görüntülenen abonelik verisinin güncelliği ayrıca açık. fetchAll hata yutma davranışı bu turda değişmedi; AdminSubscriptions önceki düzeltmeyle error okur. D07 ve kapsamlı güvenlik Sprint 6 takvimi korunur. Ana PAR04 Done değildir. Sonraki bağımsız iş bu iki ekranda abonelik okuma/cache/hata sınırı denetimi.
