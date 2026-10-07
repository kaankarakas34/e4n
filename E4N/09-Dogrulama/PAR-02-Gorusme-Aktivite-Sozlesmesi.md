# PAR-02 — Mobil aktivite ve bire bir görüşme sözleşmesi

## Paket2 devam değerlendirmesi

Mobil tarih göndermeden TAMAMLANDI yazıyor ve listede her satırı “görüştünüz” diye gösteriyor; API ise tarihli görüşme isteği/status modeli kullanıyor. Bu nedenle `/activities` ailesini yalnız URL aliasıyla bağlamak planlı isteği tamamlanmış görüşme gibi gösterir veya tarih/puan kuralı uydurur. Bu işte alias/durum eşleme yapılmadı. Mobilin kayıt mı planlama mı sunduğu, görüşme tarihi, iki tarafın onayı ve puan etkisi D01/ilgili ürün kararlarıyla netleşmeli. Bağımsız admin başvuru farkları `c407834` ile ilerletildi; görüşme akışı açık.

**2 Ekim 2026.** Mobil `features/activities.tsx` `/activities` GET/POST çağırıyor ve `user_id_2`, `status='TAMAMLANDI'`, `notes` gönderiyor. Bağlı Express API'de `/activities` yok; web tarafı `/one-to-ones` ailesini kullanıyor. Deney aynı sentetik MEMBER JWT'si ve atılabilir PostgreSQL 17.11 ile yürütüldü; canlı Supabase'e yazılmadı.

| İstek | HTTP | `one_to_ones` değişimi |
|---|---:|---:|
| Mobil GET `/api/activities` | 404 | — |
| Mobil POST `/api/activities` | 404 | 0 |
| Web biçimli POST `/api/one-to-ones` (`partnerId`, `meetingDate`, `notes`) | 201 | +1 |
| Web GET `/api/one-to-ones` | 200 | Oluşturulan ID listede |

Salt URL değiştirmek yeterli değil: mobil gövdedeki alıcı ve durum alanları API'nin `partnerId`/`meetingDate` sözleşmesiyle farklı; `meeting_date` veritabanında zorunlu. Mobil liste `created_at/status/partner_name` bekliyor, bağlı GET `meeting_date/status/partner_name` döndürüyor; anlam ve alanların ekran üstünde doğrulanması gerekir. Başarılı POST'tan sonra puan geçmişi tablo yokluğu loglandı ama kayıt/201 kaldı (H08). Yayın mobil derlemesi ve Expo ekran sonucu açık.

P32/PAR-03 hedefi: görüşmenin başlatılması/tamamlanması, iki kişinin onayı, tarih ve puan etkisi ürün kararlarıyla tek veri modeline bağlanır; hata/boş ve tekrar sonucu iki platformda eşlenir. Mevcut mobil ekranın `TAMAMLANDI` seçimi hedef iş kuralı olarak kabul edilmez.
