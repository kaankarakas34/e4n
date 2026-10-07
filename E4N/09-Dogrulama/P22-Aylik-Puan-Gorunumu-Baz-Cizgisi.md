# P22 — Aylık puan görünümü baz çizgisi

**2 Ekim 2026.** Etkin `GET /api/reports/traffic-lights` ve atılabilir PostgreSQL 17.11. `npm run test:isolated` başarılı; canlı Supabase'e yazma yapılmadı.

[[P21-Puan-Olay-Tekrari-Provasi|P21 provasındaki]] iki ziyaretçi sonrası kullanıcı toplamı 20 idi. Üye JWT ile rapor yolu 200 döndü ve kullanıcı satırında `score=20` verdi. Yanıtta ay/dönem, kaynak faaliyet veya kural sürümü alanı yok. Kaynak sorgu yalnız `users.performance_score` ve renk alanını sıralıyor. Puan hesaplayıcısı son altı ayı tek toplamda topluyor; `user_score_history` tablosu yok. Bu yanıt aylık kesinleşmiş puan tablosu değildir.

D01 puan ağırlıkları/ay kapanışı ve P21 olay defteri kesinleştikten sonra dönem toplamı, kaynak/gerekçe, sürüm ve düzeltme aynı API sözleşmesinde sunulmalı. Eski tek toplamdan geriye dönük aylar uydurulmamalı. Bu not P22 uygulamasını tamamlamaz.
