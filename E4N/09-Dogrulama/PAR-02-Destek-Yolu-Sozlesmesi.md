# PAR-02 — Destek yolu ve veri sonucu

## Uygulama — `d20afb9`

Mobil GET/POST `/api/support`, PUT `/api/support/:id/status` artık `/api/tickets` ailesinin aynı handler/auth/SQL yolunu kullanıyor. Express path dizileriyle üç uyum yolu eklendi; başka detay/mesaj yolu eklenmedi, bağlantısız support.js bağlanmadı. Statik route envanteri path dizilerini de genişleterek saymalı.

İzole prova: mobil ve web POST201, birer tickets satırı; mobil/web ADMIN liste200 ve kaydı görüyor. Mobil status PUT MEMBER403 ve OPEN korundu; ADMIN200 ve CLOSED. Oturumsuz liste401. Ayrı hesaba ait özel fixture ticket üye listesinde görünmedi. İlk testte yanlış header değişken adı düzeltildi; son iki `npm run test:isolated` çalışması geçti. Canlı Supabase/yayın yazması ve Expo cihaz testi yok. Aşağıdaki404 baz çizgisi bu dalda giderildi; P32/PAR ana kabul ve cihaz doğrulaması açık.

**2 Ekim 2026.** Mobil `features/support.tsx` ve `admin/tickets.tsx` `/support` ailesini, web `src/api/api.ts` `/tickets` ailesini çağırıyor. Bağlı Express girişinde `/api/tickets` var; `server/src/routes/support.js` bugün bağlanmıyor ve kendi başına geçerli router değil. Deney aynı sentetik MEMBER/ADMIN JWT'leriyle atılabilir PostgreSQL 17.11 üzerinde yapıldı; canlı Supabase'e yazılmadı.

| İstek | HTTP | DB sonucu |
|---|---:|---|
| Mobil MEMBER POST `/api/support` | 404 | 0 yeni `tickets` satırı |
| Web MEMBER POST `/api/tickets` | 201 | 1 yeni satır; ADMIN GET listesinde ID görüldü |
| Mobil ADMIN GET `/api/support` | 404 | — |
| Web ADMIN GET `/api/tickets` | 200 | Yeni satır listede |

Mobil ADMIN ayrıca PUT `/support/:id/status` çağırıyor; bağlı API'de aynı işlem `/tickets/:id/status` yolunda. Bu son PUT canlı/izole yazma olarak çalıştırılmadı; yöntem ve yol kaynakta karşılaştırıldı. Hedef ortak destek veri modeli ve yol seçimi P32/P39/PAR-03/04 içinde; hata veya 404 boş destek listesi olarak sunulmamalı. Yayın mobil derlemesi bu kaynakla eşlenmedi.
