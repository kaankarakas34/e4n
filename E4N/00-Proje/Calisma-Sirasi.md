# Çalışma sırası — 1 Ekim 2026

Kullanıcının yönlendirmesi: kritik güvenlik düzeltmesi şimdilik bekleyecek. Sıra **mevcut sistemi tam haritalama → hedeflerle fark analizi → geliştirme planı**. Bu aşamada ürün kodu veya canlı veri değiştirilmez.

## 1. Mevcut sistemi haritalama (belgesel baz çizgisi tamamlandı)

Şimdiye kadar: web route'ları (77), bağlı API tanımları (151), komponent kaynakları (39), mobil TSX dosyaları (33), canlı Supabase `public` tabloları (34) ve yabancı anahtarları (43), temel veri yazma yolları, yerel/Vercel/Docker bağlantıları ve ana iş akışları kaydedildi.

1 Ekim 2026'da [[E4N/02-Mevcut-Sistem/Tam-Sistem-Haritasi|tam harita]] ve [[E4N/02-Mevcut-Sistem/Istemci-API-Eslesmesi|istemci/API eşleşmesi]] yayımlandı. Vercel üretim commit'i doğrulandı. Mutasyon gerektiren çalışma zamanı testleri yapılmadı; mobil yayın sürümü ve alternatif VPS gibi dış belirsizlikler haritada açık bırakıldı. Bu belirsizlikler belgeyi mevcut sistemin kanıtlı baz çizgisi olarak kullanmaya engel değildir; çalışıyor iddiasına dönüştürülmez.

Haritalamada denetlenen başlıklar ve kalan doğrulama sınırları:

- Kritik web/mobil akışlarında ekran → API → sorgu → tablo/Storage/dosya/yerel saklama zinciri notlarda gösterildi; çalışma zamanı doğrulaması olmayan adımlar ayrıca işaretlendi.
- Canlı şema ve kurulum/migration kaynakları tablo düzeyinde, önemli kolon/kısıtlarda ve 307 kolonluk katalogla karşılaştırıldı. Eski migration tarihi kanıtlanamadı; [E4N-62](https://linear.app/e4n/issue/E4N-62/aud-04-canli-supabase-semasini-uygulama-ihtiyaclarina-gore-denetle) tamamlandı.
- Tekrarlanan route'lar, bağlantısız modüller ve mock özellikler ayrıldı; üyelik, grup, puan, shuffle, ödeme ve etkinlik akışları kaynak/şema kanıtıyla açıklandı.
- Vercel web üretim sürümü doğrulandı. Mobilin kodlu API adresi 404 veriyor; mağaza yayını ve alternatif VPS dağıtımı belirsiz kaldı.

## 2. Hedef farkları (tamamlandı)

Master plandaki R01–R15 kararları mevcut davranışın kanıtlarıyla karşılaştırıldı; D01–D10 açık bırakıldı. Ayrıntılı kabul ölçütü, veri taşıma ve öncelik uygulama planı aşamasında yazılacak.

R01–R15 karşılığı ve hedef dışı teknik farklar [[E4N/06-Gap-Analizi/Gap-Matrisi|kanıtlı fark matrisine]] işlendi. Açık D kararları karar gibi doldurulmadı. Uygulama ayrıntısı, veri taşıma ve kabul senaryoları geliştirme planı aşamasında görev bazında yazılacak.

## 3. Geliştirme planı (hazır; uygulama henüz başlamadı)

Bağımlılıklara göre sprint 0–6, sekiz epic ve P01–P41 işleri [[E4N/07-Sprintler/Gelistirme-Yol-Haritasi|yol haritasında]] tanımlandı ve E4N Linear projesine yazıldı. [[E4N/06-Gap-Analizi/Koru-Degistir-Ekle-Kaldirmayi-Degerlendir|Değişiklik matrisi]] koru/değiştir/ekle/kaldır adaylarını açıklar. Sprint 0 tamamlanan denetimi taşır; yeni uygulama işleri Backlog'dadır. Tarih/süre tahmini yapılmadı. Önce plan kullanıcıyla gözden geçirilir; ardından seçilen işe yavaş yavaş başlanır. Canlı ortam değişikliği ayrı karar gerektirir.

## Beklemede

Bilinen güvenlik bulguları kayda alınmıştır. Linear E4N-58 ve E4N-59 Backlog durumundadır; kullanıcı yeniden gündeme getirene kadar bu başlıklarda uygulama yapılmayacak.
