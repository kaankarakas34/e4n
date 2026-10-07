# P08 — Tekrarlanan Express yolları ve istemci etkisi

**1 Ekim 2026.** Bağlı `server/src/index.js` ve `server/src/routes/admin.js` sırası statik incelendi; seçili yollar izole PostgreSQL 17.11 + Express API'de sentetik kullanıcılarla sınandı. Canlı API'ye veri yazılmadı. Bu matris P40 uygulamasının baz çizgisidir; ürün kararı gerektiren farklı davranışlar sessizce birleştirilmeyecek.

`app.use('/api/admin', adminRoutes)` ana dosyadaki admin route'larından önce. Router JWT ve ADMIN rolünü başta denetliyor. Bu 12 çiftte ilk router yanıt verirse sonraki `index.js` yolu çalışmıyor.

| # | Method / yol | İlk ve ikinci tanımın karşılaştırması | Karar yönü |
|---:|---|---|---|
| 1 | GET `/admin/members` | Router `company`, `linkedin_profile`, `position` seçmiyor; ana dosya seçiyor. İzole admin 200/member 403; yanıtta `company` yok. | Üye listesi alan sözleşmesi P39'da belirlenip tek handler bırakılmalı. |
| 2 | POST `/admin/move-member` | İki tanım da eski ACTIVE kayda `INACTIVE` yazıp yeni ACTIVE ekliyor; mevcut check `INACTIVE` reddediyor. | Gölgedeki tanım P40'ta kaldırıldı; işlem hatası P20/P11 ile çözülmeli. |
| 3 | GET `/admin/email-config` | İki tanım aynı liste sorgusu/yanıtını kullanıyor. | Router korunup gölgeli tanım P40'ta kaldırılabilir; istemci liste testi gerekir. |
| 4 | POST `/admin/email-config` | İki tanım aynı transaction, aktif kaydı kapatma, INSERT ve 201 yanıtını kullanıyor. | Aynı davranış korunarak tekleştirme. |
| 5 | POST `/admin/email-config/test` | İki tanım aynı `sendEmail` çağrısı ve hata yanıtını kullanıyor. | SMTP gönderimini üretimde tekrarlamadan test ortamında tekleştirme. |
| 6 | PUT `/admin/email-config/:id/activate` | İki tanım aynı transaction ile tümünü pasif, seçileni aktif yapıyor. | Tekleştirme; geçersiz ID ve tekrar çağrı testi. |
| 7 | DELETE `/admin/email-config/:id` | İki tanım aynı DELETE ve `{success:true}` yanıtını kullanıyor. | Tekleştirme; var/yok ID yanıtı testi. |
| 8 | GET `/admin/stats/dashboard` | İki tanım aynı referral/grup/üye toplamı mantığında; izole admin 200/member 403. | Router korunup gölgeli tanım kaldırılabilir; rapor sayıları ayrı P39 konusu. |
| 9 | GET `/admin/stats/charts` | İki tanım aynı 6 aylık sorguları ve `revenue/growth/visitors` yanıtını kullanıyor. | Tekleştirme. |
| 10 | GET `/admin/stats/groups` | İki tanım aynı join/aggregation ve sıralamayı kullanıyor. | Tekleştirme; çoklu join tutar çarpması ayrı rapor doğruluğu riski. |
| 11 | GET `/admin/stats/geo` | İki tanım aynı şehir sayımı ve üst 10 yanıtını kullanıyor. | Tekleştirme. |
| 12 | POST `/admin/trigger-champions` | İlk router yalnız WEEK hesabı çağırıyor; gölgeli ana handler WEEK, önceki ay, bu ay, YEAR çalıştırıyor. | Dönem/tekrar kuralı P21/P34 ile belirlenmeden handler seçimi değiştirilmez. |

Ana dosyada kendi içinde beş çift daha var:

| # | Method / yol | İlk ve ikinci tanımın karşılaştırması | Karar yönü |
|---:|---|---|---|
| 13 | DELETE `/admin/members/:id` | İlk handler bağımlılık silmelerini SAVEPOINT ile ayrı ayrı dener, sonra kullanıcıyı siler; ikinci handler doğrudan/karışık silme yapar. | Veri saklama ve ilişkiler P10/P39'da netleşmeden yıkıcı yol tekleştirilmez. |
| 14 | GET `/events/:id/attendance` | İlk handler `user_name` alias'ı ve ad sıralaması ekler; ikinci bunları içermez. İzole yanıtta `user_name` görüldü. | İlk yanıt sözleşmesi korunarak gölgeli tanım P40'ta kaldırılabilir. |
| 15 | GET `/notifications` | İki tanım aynı kanonik `title/message/read` listesini döndürür. | P07 kanonik yanıtı korunarak tekleştirme. |
| 16 | PUT `/notifications/:id/read` | İlk handler `{success:true}` döndürür; ikinci `RETURNING` satırını döndürür. İzole yanıt yalnız başarı nesnesi. | Web/mobil beklentisi doğrulanıp tek yanıt kararlaştırılır; yanlış ID davranışı da tanımlanır. |
| 17 | GET `/user/groups` | İlk handler `?userId` ister, yoksa `[]`; ikinci JWT'deki kullanıcıyı kullanır. İzole testte parametresiz 200/0, başka sentetik üye ID'siyle 200/1. Web `PublicProfile` hem kendi hem hedef kullanıcının gruplarını istiyor. | “Benim gruplarım” ile profilin görünür grupları ayrı sözleşme olmalı. Yetki/görünürlük düzeltmesi ertelenen güvenlik kapsamıyla eşlenir. |

## Aktif rapor yolunda ayrıca gözlenen sorun

Web `api.getAdminStats()` `/reports/stats`, `getAdminCharts()` `/reports/charts` çağırıyor; yinelenen `/admin/stats/*` yollarını çağırmıyor. `/reports/stats` dönüşüm oranını sabit **20**, gelir alt kırılımını gerçek toplamın 70/30 çarpımı olarak veriyor; `revenue_entries` yoksa toplamı sessizce 0 bırakıyor. `/reports/charts` altı aylık sabit örnek sayılar döndürüyor. İzole veride ziyaretçi **0** iken stats 200 ve dönüşüm **20**, charts 200 ve altı gelir noktası verdi. `getAdminStats()` hata halinde sabit büyük örnek rakamlar döndürüyor. Bu, bağlantı hatasını gerçek işletme verisi gibi gösterebilir. Rapor doğruluğu P39/P41'de ele alınmalı.

Bu tablo çalışma sırası/yanıt kanıtıdır. SMTP, üye silme ve şampiyon hesaplama gibi yan etkili yollar üretimde çağrılmadı; farklı handler'ların etkisi kaynak karşılaştırmasına dayanır. Güvenlik düzeltmesi kullanıcı talebiyle ertelendi.

## P40 yerel uygulama — 1 Ekim 2026

`codex/e4n-sprint1-foundation` dalında gölgede kalan **12** ana dosya tanımı kaldırıldı: e-posta ayarlarının beş yolu, admin istatistiklerinin dört yolu, ikinci etkinlik katılım listesi, ikinci bildirim listesi ve üye taşıma. İlk yanıt veren handler'lar korundu. Kaynaktaki yinelenen method/yol çiftleri **17'den 5'e** indi. Kalanlar: admin üye listesi, şampiyon tetikleme, üye silme, tekli bildirim okundu ve kullanıcı grupları. Üye taşımanın ilk handler'ındaki `INACTIVE` kısıt hatası P20/P11 kapsamında hâlâ açık.

İzole PostgreSQL/API testi geçti: e-posta ayarları ve dört admin istatistik GET yolunda MEMBER 403 / ADMIN 200; katılım listesi `user_name` alanını, bildirim listesi kanonik alanlarını koruyor. SMTP gönderimi, silme ve yazan admin işlemleri üretimde çağrılmadı. Bu temizlik aktif `/reports/*` yolundaki sabit değerleri veya kalan farklı davranışları çözmez; P40 kısmi ilerlemedir.

**2 Ekim devamı:** İlk yanıt veren handler'lar izole testte doğrulanarak gölgede kalan `GET /admin/members` ve ikinci `PUT /notifications/:id/read` tanımları kaldırıldı. Admin üye listesi MEMBER 403 / ADMIN 200 ve yanıtta `company` yok; bildirim tekli okundu yalnız `{success:true}` yanıtını ve kullanıcıya ait satır etkisini korudu. Yinelenen çift sayısı **5'ten 3'e** indi: üye silme, şampiyon tetikleme, kullanıcı grupları. Bu üçünde farklı veri/yetki/iş kuralı etkisi olduğundan hedef karar olmadan handler seçimi değiştirilmedi.

Kod [94a1304](https://github.com/kaankarakas34/e4n/commit/94a1304) commit'iyle dala gönderildi; `npm run test:isolated` PostgreSQL 17.11 üzerinde geçti. Canlı dağıtım yapılmadı.

**2 Ekim ikinci devam:** İlk yanıt veren davranışlar izole API'de doğrulanıp gölgede kalan `DELETE /admin/members/:id`, `POST /admin/trigger-champions` ve `GET /user/groups` tanımları kaldırıldı. MEMBER/ADMIN yanıtları sırasıyla 403/200 olan silme ve şampiyon yolları, silinen sentetik üye satırı, şampiyon yanıt mesajı ve grup sorgusunun parametresiz/başka üyeyle sonuçları test edildi. Bağlı `admin.js` ve `index.js` üzerinde son statik sayım **133 tekil method/yol, 0 tekrar** verdi; başlangıçtaki 17 yinelenen çift temizlendi. Bu yalnız ulaşılmayan kodun kaldırılmasıdır: aktif üye silme, şampiyon dönemleri ve grup görünürlüğünün hedef iş kuralları hâlâ P10/P21/P39 ve ertelenen güvenlik kapsamında açık. Canlı dağıtım yapılmadı.
