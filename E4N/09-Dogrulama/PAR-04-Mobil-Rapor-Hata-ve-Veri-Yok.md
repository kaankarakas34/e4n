# Mobil rapor hata ve bilinmeyen veri — 2 Ekim 2026

`dc0820e` yerel mobile/app/admin/reports.tsx'e uygulandı. API hatası veya bozuk kök yanıt kalıcı alert/retry gösterir; önceki veya sahte sıfır metrikler görünmez. Gerçek sıfır 0/₺0 korunur; eksik/null/sayısal olmayan metrik Veri yok gösterir. Sayım alanları negatif/kesirli değerleri kabul etmez; gelir alanı sonlu sayısal değeri biçimlendirir, finansal formül değiştirilmez.

API totalMembers tüm users, totalEvents tüm events, totalOneToOnes tüm one_to_ones satırlarını sayar; etiketler Kullanıcı Kaydı/Etkinlik Kaydı/Birebir Kaydı oldu. Aktif/ücretli üye veya tamamlanan görüşme anlamı üretilmedi. Mevcut /reports/stats rol politikası ve AuthProvider yönlendirmesi değiştirilmedi; MEMBER API erişimi hâlâ ayrı açık kayıt.

## Kanıt ve teslim sınırı

Mobil TypeScript önce/sonra exit0. `node test/mobile-admin-reports.mjs <reports.tsx>` gerçek bileşen kontrollü hook/API testinde ilk hata, tekrar, gerçek sıfır, gelir null, geçersiz sayım/gelir, gerçek125, sonradan403 ve bozuk kök yanıtları doğruladı. Reverse-check geçti. Yalnız bizim patch/test yönetilen dala push edildi; ağaç temiz. Mobil kaynak ayrı dirty/no-remote; gerçek yayın deposu entegrasyonu ve cihaz testi açık. Bu turda backend değişmedi ve canlı istekte bulunulmadı.

Grafikler ve ayrıntılı raporlar mobilde eksik; masaüstüne yönlendiren metin hâlâ var. Ana PAR04/P32 tamamlanmadı. Ürün kararları D01–D10 ve kapsamlı güvenlik ertelemesi korunuyor.

## Sonraki bağımsız denetim

Mobil abonelik ekranı GET /payments/history bekliyor; ilk yükleme hatası yanlış ödeme kaydı yok mesajına düşüyor. Yanıt için member.full_name ve SUCCESS bekleniyor. Mevcut gerçek ödeme liste yolu, kimlik sahipliği ve durum alanları izole olarak eşlenmeli; eski ödemelere sahiplik/üyelik hakkı atfedilmemeli, üretim ödeme testi yapılmamalı.
