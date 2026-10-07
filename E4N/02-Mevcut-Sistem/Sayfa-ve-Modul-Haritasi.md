# Web sayfa ve modül haritası — ilk tur

**Kaynak:** `src/App.tsx`, commit `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab` ve mevcut çalışma ağacı. Dosyada 77 `path=` tanımı, `src/pages` altında 75 TSX dosyası var. Bu kaynak envanteridir; her ekranın çalıştığı henüz test edilmedi.

| Alan | Örnek route'lar | Dosya / bağlı modül |
|---|---|---|
| Tanıtım ve içerik | `/`, `/e4n-nedir`, `/nasil-calisir`, `/hakkimizda`, `/blog`, `/blog/:slug` | `LandingPage`, `E4NNedir`, `BlogListPage`, `BlogPostPage`; blog yazma yolu Supabase Data API |
| Kayıt ve giriş | `/auth/login`, `/auth/register`, `/auth/register-community`, `/auth/pending`, `/create-password` | `Login`, `Register`, `PendingApproval`, `CreatePassword`; API `users` |
| Ziyaretçi/başvuru | `/degerlendirme-basvurusu`, `/ziyaretci`, `/etkinlikler` | `DegerlendirmeBasvurusu`, `VisitorPaymentPage`, `PublicEventsPage`; `public_visitors`, ödeme |
| Üye ana alanı | `/dashboard`, `/profile`, `/membership`, `/events` | `Dashboard`, `Profile`, `Membership`, `UserEvents`; `users`, üyelik ve etkinlik API'leri |
| İş ağı | `/referrals`, `/meetings`, `/activities`, `/messages`, `/group-management`, `/chapter-management` | Referans, toplantı, grup yönetimi ve mesaj ekranları; aktif API bağları tek tek doğrulanacak |
| Yönetim | `/admin`, `/admin/members`, `/admin/groups`, `/admin/shuffle`, `/admin/subscriptions`, `/admin/accounting`, `/admin/events`, `/admin/crm` | `Admin*` sayfaları; role kontrolü hem UI hem API tarafında incelenecek |
| Eğitim/destek | `/education`, `/admin/lms`, `/admin/exams`, `/support`, `/admin/support` | Eğitim, sınav, destek ekranları; `/lms` ve `/lms/course/:id` şu anda `ComingSoon` bileşenine bağlı |
| Belge ve hukuk | `/documents`, `/kvkk`, `/gizlilik-politikasi` vb. | Belge ve yasal metin sayfaları |

`ProtectedLayout` giriş ve `PENDING` durumunu kontrol ediyor. Admin URL'ları bu ortak layout içinde yer alıyor; her admin sayfası ve API uç noktasındaki yetki kontrolü ayrıca denetlenmeli. Bazı eski URL'ler `Navigate` ile yeni yola yönlendiriliyor.

İlk komponent listesi: [[E4N/03-Komponentler/Katalog|Katalog]]. Veri yerleri: [[E4N/02-Mevcut-Sistem/Veri-Tabani-ve-Veri-Akisi|Veri Akışı]].
