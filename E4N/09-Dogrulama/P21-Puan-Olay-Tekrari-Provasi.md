# P21 — Puan olay tekrarı ve geçmiş provası

**2 Ekim 2026.** Etkin ziyaretçi API'si ve atılabilir PostgreSQL 17.11 üzerinde `npm run test:isolated` başarılı. Canlı Supabase'e yazma yapılmadı.

Yeni kullanıcı için aynı ad/e-posta/tarih/statü gövdesiyle `POST /api/visitors` iki kez çağrıldı. İki yanıt da **201**; aynı e-postalı **2 ziyaretçi satırı** oluştu. `users.performance_score` ilk çağrıdan sonra **10**, ikinciden sonra **20** oldu. `user_score_history` tablosu yok. `calculateMemberScore` önce kullanıcı toplamını güncelliyor, sonra olmayan geçmiş tablosuna INSERT deniyor; hata yakalanıyor ve ziyaretçi API'si başarılı dönüyor.

Bu, kaynak olayın tekil kimliği ve tekrar anahtarı olmadan aynı faaliyet iki kez sayılabildiğini; toplam puan ile olay geçmişinin atomik olmadığını gösterir. D01 puan ağırlıkları, hangi olayın/ayın sayılacağı ve düzeltme kuralını belirlemeli. P10/P21 defteri kaynak türü+kimliği, dönem, kural sürümü ve düzeltme bağlantısını tutmalı; eski toplamdan geçmiş olay uydurulmamalı. Bu test yeni puan kuralı uygulamaz.
