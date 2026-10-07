# PAR-02 — Ortak etkinlik kayıt yolu

**2 Ekim 2026.** Web `src/api/api.ts` ve mobil `mobile/constants/api.ts` aynı POST `/events/:id/register` yoluna gidiyor. İzole PostgreSQL 17.11/API testinde sentetik MEMBER kullanıcı zaten kayıtlı etkinlikte tekrar istekte bulundu: HTTP 200 / `Already registered`, `attendance` satır sayısı 1→1. Olmayan etkinlik 404, JWT'siz istek 401 döndü. Bu yolun erişim ve tekrar davranışı her iki istemci için ortak API kanıtıdır; Expo ve tarayıcı ekranı ayrı doğrulanır.

Yeni kayıt adımı burada çağrılmadı: aktif handler commit sonrası e-posta gönderme ve puan hesaplama da başlatıyor. İlk kayıt, bilet/ödeme ve e-posta sonucu P26/PAR-05'te izole yan etki sınırlarıyla uçtan uca doğrulanmalı. Kaynakta yeni kayıt `attendance.status='PRESENT'` yazar; gerçekleşmiş katılım ve ön kayıt ayrımı H17 olarak açık. Mobil ekran tekrar 200'ü genel “kaydınız yapıldı” uyarısı olarak gösterir; hedef metin/iş durumu ayrıca kararlaştırılır. Canlı Supabase'e yazılmadı.
