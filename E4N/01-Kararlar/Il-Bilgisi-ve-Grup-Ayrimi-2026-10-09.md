# İl bilgisi ve gelecekte grup ayrımı

## Kullanıcı kararı — 9 Ekim 2026
- Kayıtta il zorunlu. Şirket adı, vergi numarası, vergi dairesi ve fatura adresi zorunluluğu devam eder.
- İstanbul, Ankara ve İzmir için gelecekte il bazlı grup listeleme/ayrım olacak.
- İlk aşamada bu ayrım etkinleştirilmeyecek. Üç ilin **her birinde en az 70 kişi** olmadan açılamaz; toplam 210 kişi tek başına yeterli değildir.
- Eşik sağlanması otomatik açılma kararı değildir. Sayıma hangi üyelik durumlarının katılacağı, diğer illerin davranışı ve açılış yöntemi henüz kararlaştırılmadı.

## Uygulama
- Mevcut serbest metin alanı 81 Türkiye ilinden zorunlu seçimle değiştirildi. Kullanıcı yalnız üç ile sınırlandırılmadı.
- Form ve kayıt API'si aynı il listesini kullanır. API boş/geçersiz il bilgisini reddeder; yaygın harf/büyük-küçük farklarını standart il adına dönüştürür.
- Veri mevcut `users.city` alanına kaydedilir; şema değişikliği veya eski üye verilerinde toplu dönüşüm yok.
- Grup listeleme, başvuru uygunluğu ve shuffle davranışı değiştirilmedi. Gelecekteki ayrım BAŞ-04/E4N-164 kapsamındadır; bu görev tamamlanmış sayılmaz.

## Doğrulama
- Odaklı normal kayıt API/veri/browser sözleşmesi ve production build çalıştırılır; sonuç Devam-Notu ve Linear yorumunda kaydedilir.
- Gerçek üretim hesabı, ödeme veya e-posta testi yapılmaz.
