# PAR-04 — Mobil grup/lonca listesi

## 3 Ekim teslimi — `facdfd3`

Yerel mobil `app/admin/groups.tsx` grup/lonca liste API hatasını yutuyordu; null yanıt başarılı [] sayılıyor, eski/boş kart ve varsayılan 1 dönem ayı/0 üye görünüyordu. Liste yükleme, hata/tekrar ve gerçek boş hal ayrıldı. İki yanıt da array olmalıdır; birinin hatası iki listeyi gizler. Hata/yüklemede oluşturma girişi kapalı; ADMIN olmayan kullanıcı bu ekranı/listeleri çağırmaz. Bu yalnız istemci sınırıdır; sunucu GET rol politikası değişmedi.

Kaynak grup listesi member_count değerini group_members tüm kayıtlarını sayarak üretir; ACTIVE filtreli üye sayısı değildir. Kart etiketi Üye Kaydı; gerçek sayı0 korunur, eksik/bozuk sayım bilinmiyor. current_month yoksa 1 uydurulmaz: Dönem bilgisi yok. Route/oturum cleanup eski yükleme sonucunu geçersiz kılar.

## Kanıt ve kaynak ayrımı

`node test/mobile-groups.mjs <yerel mobile/app/admin/groups.tsx>` gerçek bileşen kontrollü hook/API ile HTTP/ağ temsili hata ve null yanıt, alert/retry, eski kart gizleme, gerçek boş, gerçek0 ve eksik dönem/sayım, MEMBER/PRESIDENT sıfır çağrı sınırlarından geçti.

Yerel mobil `npx tsc --noEmit` önce/sonra exit0. Kendi farkımız `patches/mobile/admin-groups.patch`; yerel kaynak üstünde `git apply --reverse --check` başarılı. Patch ve test yönetilen dala commit/push, yönetilen ağaç temiz. Mobil ayrı dirty repo ve remote yok; kullanıcı değişiklikleri git'e topluca alınmadı. Cihaz/Expo/browser/yayın kabulü yapılmadı; canlı API/DB/ödeme/dağıtım yok.

## Açık navigasyon ve sonraki iş

Admin grup/lonca kartlarının onPress'i yok; mobil app route envanterinde grup detay sayfası bulunmadı. Bu teslim navigasyonu tamamlamaz. Web AdminGroupDetail ayrıntılı üye/toplantı/ziyaretçi/referral/synergy kaynakları kullanır ve bazı bilinmeyen metrikleri0 varsayar; web hataları da ayrıca açık.

Sonraki bağımsız iş: mevcut GET /groups/:id ve /groups/:id/members ile lonca eşlerini izole ADMIN/MEMBER/PRESIDENT/anon salt okunur probe ile doğrula, alan/status anlamını kaydet. Sonra mobilde yalnız doğrulanmış okuma alanları için ayrı detay route ve kart bağlantısı oluştur; grup hak/başvuru/rol ataması yazma kurallarını D05/D08/D09 olmadan seçme. PAR04 ana kabul, D kararları ve Sprint6 güvenlik açık.
