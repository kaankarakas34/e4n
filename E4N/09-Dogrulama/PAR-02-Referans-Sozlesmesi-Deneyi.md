# PAR-02 — Web/mobil referans oluşturma sözleşmesi

## Uygulama — `cf78ccf`

Bağlı POST iki alıcı alanını kabul ediyor: web receiverId ve mobil receiver_id. İkisi farklı verilirse400; eksik/boş/UUID olmayan alıcı400. İki istemci biçimi201 ve birer gerçek satır oluşturdu. Gönderen body giverId/giver_id ile değiştirilemez; JWT kullanıcı kimliği korundu. Oturumsuz401; ilgisiz oturumun userId query'si iki kaydı görünür yapmadı. Hatalı isteklerde satır sayısı artmadı. `npm run test:isolated` geçti; canlı yazma/dağıtım ve Expo cihaz testi yok. Web sahte başarı/listede hata yutma önceki P39 commitlerinde giderildi. Aşağıdaki500/0 gözlemi tarihsel baz çizgisidir.

**2 Ekim 2026.** Bağlı API `server/src/index.js`, web `src/stores/referralStore.ts`, mobil `mobile/app/features/referrals.tsx` ve mobil `utils/api-client.ts` karşılaştırıldı. Çalışma zamanı kanıtı `codex/e4n-sprint1-foundation` dalındaki `server/test/isolated-smoke.mjs` ile yalnız atılabilir PostgreSQL 17.11 veritabanında üretildi. Aynı sentetik MEMBER JWT'si ve aynı alıcı kullanıcı ID'si kullanıldı. Canlı Supabase'e yazılmadı; Expo ekranı burada çalıştırılmadı.

| Adım | Gövde / yanıt | DB önce–sonra |
|---|---|---|
| Mobil ekranın gönderdiği biçim | `POST /api/referrals`, `receiver_id` ile HTTP 500 | Yeni referans satırı 0 |
| Web mağazasının gönderdiği biçim | Aynı yol, `receiverId` ile HTTP 201 | Yeni referans satırı 1; oturumlu GET listesinde aynı ID görüldü |

Neden: bağlı API `req.body.receiverId` okuyor; mobil `formData` ise `receiver_id` alanını doğrudan gönderiyor. `referrals.receiver_id` NOT NULL olduğu için mobil biçimde INSERT başarısız. `apiClient` HTTP hatasını `ApiError` olarak ele alıyor ve mobil ekran hata uyarısı gösteriyor. Bu, kaynak gövdesinin izole API'ye gönderilmesinin sonucudur; yayın mobil derlemesinin aynı kaynak olduğu henüz doğrulanmadı.

Ayrı web bulgusu: `referralStore.createReferral` API hatasını yakalayıp yerel sahte referans oluşturuyor, listeye ekliyor ve başarılı sonuç olarak döndürüyor. Bu kod yolu, sunucuda satır oluşmadığında kullanıcıya oluşturuldu izlenimi verebilir. Bu etki kaynakta kesin; tarayıcı ekranı hata koşuluyla ayrıca denenmedi. Web `getReferralsByUser` da GET hatasını boş diziye çeviriyor.

Başarılı web biçimli API çağrısında puan fonksiyonu `user_score_history` tablosu olmadığı için SQLSTATE `42P01` logladı; referans INSERT'i ve 201 yanıtı yine gerçekleşti. Bu, daha önceki H08 puan/geçmiş atomiklik bulgusunu aynı akışta doğrular; puan kuralı D kararları gelmeden değiştirilmez.

**Hedef sözleşme için açık iş:** API ve iki istemci tek `receiverId`/`receiver_id` biçiminde birleşmeli; geçersiz gövde anlamlı 4xx vermeli; başarısız oluşturma hiçbir platformda başarılı kayıt gibi görünmemeli. P32/P39/PAR-03 uygulama ve PAR-05 uçtan uca kabul işleriyle izlenir. Üretim verisiyle test yapılmaz.
