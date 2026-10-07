# 5 Ekim 2026 — Üyelik, kapasite ve shuffle kararları

## Kullanıcının kesinleştirdiği kurallar

- D09: Kapalı grupta başkan hariç 35 üye.
- D07: Ödeme gecikmesinde 5 gün boyunca her gün e-posta; beş günlük sürenin sonunda hesap kısıtlanır.
- Shuffle: Ödeme shuffle'dan bir gün önceye kadar yapılmış olmalıdır. Yetişmeyen kişi sonraki shuffle dönemine veya kendi koltuğu açık olan başka bir gruba başvurabilir.

Kullanıcı shuffle ile gecikme süresinin etkileşimini birlikte konuşmayı istedi. Aşağıdaki tasarım öneridir; kesin ürün kuralı olarak uygulanmaz.

## Önerilen tasarım

Hesap durumu ile shuffle uygunluğu ayrı değerlendirilir. Beş günlük hatırlatma süresi devam etse bile shuffle ödeme son anını kaçıran kişi o dönemin dağıtımına alınmaz. Dağıtım aday listesi kesim anında ödeme kanıtlarıyla sabitlenir; geç ödeme kesinleşmiş dağıtımı tekrar çalıştırmaz.

Ödeme sonrası yeniden uygun hale gelen kişi sonraki dönem veya hizmetine uygun boş koltuk başvurusu yolunu kullanır. Boş koltuk başvurusu mevcut kabul ve hizmet çakışması kurallarına tabidir; başvuru otomatik yerleştirme değildir.

Tekrar çalışan günlük iş aynı gün ikinci e-posta üretmemeli; ödeme kesinleştiğinde bekleyen hatırlatma/kısıtlama yeniden kontrol edilmelidir. Gönderim belirsizliği, aynı anda ödeme ve kısıtlama, ödeme ve shuffle kesim anı testleri bütün paket kapsamında yapılır.

## Uygulamadan önce açık ayrıntılar

- Bir gün önce: Tam 24 saat önce mi, önceki takvim gününün sonu mu? Saat dilimi ve kesim anı netleştirilecek.
- Beş günlük sürenin başlangıcı ve e-posta gönderim zamanı.
- Hesap kısıtlamasının kapatacağı haklar ve ödeme sonrası açılma davranışı.
- Geç ödeme sonrası aynı dönem boş koltuk başvurusunun açılacağı an.
- Üyelik ücreti/ödeme dönemi ve D10 şirket doğrulama kapsamı hâlâ açık.
- D05 hizmet sınıflandırması ve D08 kabul yetkisi bu yanıtla kesinleşmedi.

## Büyük web paketlerinin sırası

1. Üyelik, ödeme, haklar ve gecikme — XL.
2. Grup başvurusu, kabul, 35 üye kapasitesi ve transfer — XL.
3. Aylık puan, çıkarılma ve başvuru engeli — XL; D01–D04 beklenir.
4. Shuffle önizleme, uygunluk ve atomik dağıtım geçmişi — XL; açık D06 ayrıntıları beklenir.
5. Eğitim dışı web bütün kabul ve sürüm doğrulaması. Karar beklerken bağımsız kabul çalışması yapılabilir.

API/veri/ekran/test/commit birlikte teslim edilir. Mobil Sprint 7 ve kurs/eğitim/sınav Sprint 8 en son. Bu not uygulama teslimi veya DONE kanıtı değildir; canlı veriye yazma, gerçek e-posta/ödeme ve dağıtım yapılmadı.
