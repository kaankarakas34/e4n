# P17 — Son koltuk kapasite provası

**2 Ekim 2026.** Etkin `PUT /api/groups/:id/members/:userId` ve atılabilir PostgreSQL 17.11 üzerinde; canlı Supabase'e yazma yapılmadı. `npm run test:isolated` geçti.

Bir kapalı gruba meslekleri farklı 34 `ACTIVE` üye, sonra iki `REQUESTED` başvuran eklendi. İki onay isteği aynı anda başlatıldı. İkisi de HTTP 200 döndü; `ACTIVE` sayısı **34 → 36** oldu. Bu, mevcut kabul yolunda 35 sınırının uygulanmadığını gösterir. İsteklerin veritabanı transaction'ları içinde gerçekten çakıştığı ölçülmedi; eşzamanlı son koltuk korumasının varlığı da gözlenmedi.

D09'da 35'in tavan/hedef oluşu ve başkanın sayılıp sayılmadığı yazılı karara bağlanmalı. Sonra kabul, admin atama, taşıma ve shuffle aynı kapasite kontrolünü tek transaction içinde kullanmalı; iki eşzamanlı son koltuk isteğinden yalnız biri başarılı olmalı. Lonca kapasitesi P15'in ayrı yaşam döngüsüdür. Canlı kurala müdahale edilmedi.
