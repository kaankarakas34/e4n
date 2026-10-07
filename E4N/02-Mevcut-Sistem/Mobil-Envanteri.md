# Mobil uygulama envanteri

Kaynak: `mobile/app`, `mobile/constants/api.ts`, `mobile/utils/api-client.ts`; 1 Ekim 2026 statik incelemesi. `mobile` ayrı Git deposudur. Bu not çalıştırılmış bir mobil uygulama testi değildir.

**2 Ekim kaynak güncellemesi:** `mobile/constants/api.ts` artık geliştirmede Android emülatörü için `http://10.0.2.2:4000/api`, diğer yerel ortam için `http://localhost:4000/api`; üretim varsayılanında `https://event4network.com/api` kullanıyor. `EXPO_PUBLIC_API_URL` öncelikli. Aşağıdaki eski adres ve 404 gözlemi 1 Ekim kaynak sürümüne aittir; güncel yayın paketinin adresi/commit'i doğrulanmadı. Ayrıntı [[E4N/06-Gap-Analizi/Web-Mobil-Yetenek-ve-API-Sozlesmesi|eşitlik sözleşmesinde]].

## Yapı ve bağlantı

- Expo Router altında 33 TSX dosyası var: 2 kök, 2 kimlik doğrulama, 6 sekme, 9 üye özelliği, 14 yönetim ekranı.
- Geliştirme API adresi `http://192.168.1.155:4000/api`; üretim için kodda `https://e4n-backend.vercel.app/api` yazıyor. 1 Ekim 2026 GET denemelerinde bu adres `/api/health` ve `/api/events` için 404 döndürdü. Bağlı Vercel hesabındaki `e4n` projesinin üretim alan adı `event4network.com`; mobil uygulamanın mağaza/yayın sürümü ayrıca doğrulanmadı.
- `api-client.ts`, `BASE_URL + endpoint` ile `fetch` yapar, JSON gövde gönderir ve SecureStorage'daki JWT'yi `Authorization: Bearer` başlığına koyar. Mobil ekranda doğrudan Supabase istemcisi görülmedi.

## Ekran grupları

| Grup | Dosyalar | Kaynakta görülen iş |
|---|---|---|
| Giriş | `(auth)/login`, `(auth)/register` | Giriş, kayıt |
| Sekmeler | `(tabs)/index`, `events`, `network`, `profile`, `menu`, `_layout` | Özet, etkinlik, üye ağı, profil ve menü |
| Üye özellikleri | `features/activities`, `lms`, `messages`, `payment`, `referrals`, `reports`, `settings`, `store`, `support` | Görüşme, eğitim, mesaj, ödeme, referans, rapor, ayar, mağaza, destek |
| Yönetim | `admin/index`, `applications`, `email`, `events`, `groups`, `lms`, `professions`, `reports`, `shuffle`, `subscriptions`, `tickets`, `timer`, `users` | Yönetim panosu ve alt ekranları |
| Kabuk | `_layout`, `modal`, `features/_layout` | Navigasyon ve modal |

`features/store` yalnızca “Mağaza Çok Yakında” sayfasıdır. `admin/lms` kullanıcıyı masaüstü yönetim paneline yönlendiren açıklama ekranıdır.

## Mobil istekleri ile bağlı sunucu uçları

Eşleşme, [[E4N/02-Mevcut-Sistem/API-Uc-Noktalari|bağlı Express uçları]] ile yöntem ve yol karşılaştırmasıdır. Aynı isimli fakat bağlanmamış `server/src/routes/*` dosyaları eşleşme sayılmadı.

| Mobil ekran/iş | İstek | Bağlı API tanımı | Statik sonuç |
|---|---|---|---|
| Giriş, kayıt | `POST /auth/login`, `POST /auth/register` | Var | Yol eşleşiyor |
| Profil | `GET /users/me` | Var | Yol eşleşiyor |
| Özet | `GET /reports/stats`, `GET /notifications` | Var | Yol eşleşiyor |
| Etkinlik | `GET /events`, `POST /events/:id/register` | Var | Yol eşleşiyor |
| Üye ağı, yönetim kullanıcıları | `GET /users` | Var | Yol eşleşiyor |
| Referans | `GET/POST /referrals` | Var | Yol eşleşiyor |
| Eğitim listesi | `GET /courses` | Var | Yol eşleşiyor; yanıt şekli incelenmeli |
| Yönetim grupları | `GET/POST /groups`, `GET/POST /power-teams` | Var | Yol eşleşiyor |
| Yönetim etkinlikleri | `GET/POST /events`, `PUT/DELETE /events/:id` | Var | Yol eşleşiyor |
| Meslek yönetimi | `GET /professions`, `DELETE /professions/:id` | Var | Yol eşleşiyor |
| Başvuru yönetimi | `PUT /professions/:id`, `PUT /users/:id` | Var | Yol eşleşiyor |
| Rapor yönetimi | `GET /reports/stats` | Var | Yol eşleşiyor |
| Görüşmeler | `GET/POST /activities` | Yok | Ekran istekleri bağlı API'de bulunmadı |
| Ödeme | `GET /payments/me` | Yok | Bağlı API'de `payment/*`, `memberships`, `admin/accounting/payments` var; bu yol yok |
| Abonelik yönetimi | `GET /payments/history` | Yok | Yol bulunmadı |
| Destek talebi, yönetim biletleri | `POST/GET /support`, `PUT /support/:id/status` | Yok | Bağlı API `tickets/*` yollarını kullanıyor |
| Kişisel rapor | `GET /users/me/stats` | Yok | Yol bulunmadı |
| Shuffle yönetimi | `POST /shuffle` | Yok | Bağlı API'de `POST /shuffle/save` ve `POST /admin/shuffle/save` var; işlem semantiği de farklı olabilir |
| Başvuru listesi | `GET /public-visitors` | Yok | Bağlı API'de `GET /admin/public-visitors` var |

Bu farklar gerçek uygulamada 404 olup olmadığını tek başına kanıtlamaz: üretim mobil adresinin hangi sürüme gittiği ve canlı dağıtım henüz doğrulanmadı. Özellikle `admin/shuffle` ekranının metni tüm üyelerin yeniden dağıtılacağını söylüyor; mevcut `POST /shuffle` tanımı yok. Canlı veride shuffle denenmemeli.

## Sonraki haritalama doğrulaması

1. Mobil üretim API adresinin hangi dağıtıma işaret ettiğini salt okunur biçimde doğrula.
2. Yol eşleşen uçlarda yanıt biçimi ve ekranın beklediği alanları karşılaştır.
3. Mobil navigasyonun ekranlara gerçekten erişip erişmediğini ve rol kapılarını incele.
4. Eksik uçları hedef farkı olarak kaydetme aşamasında R kararlarıyla birlikte değerlendir.
