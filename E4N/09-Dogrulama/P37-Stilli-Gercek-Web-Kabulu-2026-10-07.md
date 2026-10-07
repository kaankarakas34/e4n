# P37 — Stilli gerçek web kabulü, 7 Ekim 2026

React uygulaması → Express/JWT → izole PostgreSQL 17 zinciri taze 17 migration ile doğrulanır. Gerçek API yanıtları ve kalıcı son veri durumu kullanılır.

Tarayıcı fixture’ı npm --prefix server ile server klasöründen başladığında Tailwind config/content bulunmuyordu. Fixture çalışma dizini uygulama köküne alındı. Computed style kontrolü hidden/fixed/p-4 değerlerini ölçerek stil eksikliğinde kabulü durdurur. Fixture şema sürümü metadata’sı artık uygulanan migration sayısından gelir.

Mesaj gönderim kontrolü konuşmadaki paragraph ile sınırlıdır; önizleme aynı metni gösterebilir. Hesap geçişinde depolama React hydration öncesi tek sefer temizlenir, önceki yönetici oturumunun giriş sayfasından yönlendirme yarışı önlenir.

Önceki 12-14-27 koşusu 23 veri/DOM kontrolünü geçti, ancak stiller eksikti; görsel kabul sayılmaz. 16-18-35 stil koşusu 23 PASS/1 locator FAIL; 16-20-08 koşusu hesap geçişi hatasından sonra sonlandırıldı, tamamlanmış kabul değildir. Ara kanıtlar output/web-browser altında korunur.

Son taze koşu: output/web-browser/2026-10-07T16-23-16-419Z/browser-report.json, **24 PASS / 0 FAIL**. Stiller, gerçek admin/member login, katılımcı2/50+pencere2, kapasite409/REQUESTEDkoruma, PDF40byte, profil geçmişi, takvim, mesajtekrecord ve rol değişimi doğrulandı. Ekran görüntüleri gözle kontrol edildi. API/Vite/tarayıcı/container kapatıldı. Test edilen kaynak dfd9513 üzerine bu fixture düzeltmeleridir.

P37 In Progress; releaseReady=false. Ürün kararları, canlı geçiş, tüm kapsamın sürüm kabulü ve Sprint 6 güvenlik kapıları açık. Mobil/LMS en son. Canlı DB, gerçek ödeme/e-posta ve dağıtım yok.
