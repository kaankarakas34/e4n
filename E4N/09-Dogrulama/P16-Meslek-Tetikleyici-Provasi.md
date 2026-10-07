# P16 — Mevcut meslek tetikleyicisi provası

**2 Ekim 2026.** `server/init.sql` tetikleyicisi, etkin HTTP API ve atılabilir PostgreSQL 17.11 üzerinde test edildi. `npm run test:isolated` geçti; canlı Supabase'de yazma yapılmadı.

| Deneme | Sonuç | Neden |
|---|---|---|
| Aynı `users.profession` metninden aktif üye bulunan gruba `REQUESTED` INSERT | SQLSTATE `P0001` | INSERT tetikleyicisi `NEW.status` değerine bakmadan mevcut ACTIVE üyenin mesleğini karşılaştırıyor. |
| Boş gruba aynı meslekten iki `REQUESTED` INSERT, sonra etkin `PUT /api/groups/:id/members/:userId` ile ikisini `ACTIVE` yapma | İki HTTP 200; aynı grupta iki ACTIVE satır | Tetikleyici `status` UPDATE'inde çalışmıyor; yalnız INSERT veya `user_id/group_id` UPDATE'inde bağlı. |
| Aynı gruba üçüncü doğrudan `ACTIVE` INSERT | SQLSTATE `P0001` | Yeni INSERT mevcut ACTIVE eşleşmesini görüyor. |

Bugünkü kural aynı metinli hizmeti başvuru aşamasında erken reddederken asıl kabul güncellemesini kaçırıyor. Yakın veya çoklu hizmet ilişkisinin semantiği mevcut metin eşitliğinden çıkarılamaz. D05 örnek hizmet çiftleri ve P10 hedef alanları kararlaştırıldıktan sonra başvuru, kabul, admin atama ve shuffle aynı son yazma kontrolünü kullanmalı; eşzamanlı kabul de sınanmalı. Mevcut tetikleyici canlıda değiştirilmedi.
