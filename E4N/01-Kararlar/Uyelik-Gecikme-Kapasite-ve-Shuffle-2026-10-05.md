# 5 Ekim 2026 — Üyelik, kapasite ve shuffle kararları

## 8 Ekim — Büyük üyelik paketinin uygulama kapısı

Linear E4N-75/74/73 ve son kabul kayıtları yeniden okundu. İlk büyük teslim üyelik/ödeme/haklar paketidir; sırf ilerleme sayısını artırmak için yeni küçük teslim açılmaz. Mevcut teknik prova 34 API/veri ve 61 tarayıcı senaryosunda başarılıdır; hedef iş kuralları için onay yerine geçmez.

Kullanıcıya üç karar sorusu iletildi; yanıt henüz alınmadı:

1. Ücret, para birimi ve ödeme dönemi.
2. **Öneri:** vade anından başlayan beş günlük süre, günlük tek hatırlatma; sonunda grup başvurusu ve yeni etkinlik/bilet işlemleri kısıtlı, giriş/profil/ödeme/geçmiş açık; doğrulanmış ödeme sonrası otomatik açılma.
3. **Seçenek:** shuffle saatinden tam 24 saat önce veya önceki takvim günü 23:59, İstanbul saati. Önerilen etkileşim: gecikme süresi shuffle uygunluğunu uzatmaz; geç ödeme kesinleşmiş dağıtımı değiştirmez, sonraki dönem veya hizmet koltuğu açık grup başvurusunu açar.

İkinci ve üçüncü maddeler **onaylanmış kural değildir**. Süre geçmesi, zamanlama turu veya “devam” yanıtı bu seçeneklerden birini otomatik seçmez. Aynı sorular yeni yanıt gelmeden tekrar gönderilmez.

### Yanıt sonrası birleşik uygulama ve kabul

| Adım | Birlikte teslim edilecek kapsam | Kabul örnekleri |
|---|---|---|
| 1 | Onaylı ücret/dönem ve tek üyelik; ödeme kaydı, callback, hak kararı | Yinelenen callback tek ödeme sonucu; belirsiz ödeme hesabı açmaz |
| 2 | Gecikme başlangıcı, günlük bildirim kaydı, kısıtlama ve yeniden açılma | Aynı gün tekrar çalışma tek bildirim; ödeme/kısıtlama yarışı; beşinci gün sınırı |
| 3 | Shuffle ödeme kesimi ve geç ödeme başvuru yolu | Kesim öncesi/eşit/sonrası; gecikme süresinde olup kesimi kaçıran; geç ödeme dağıtımı değiştirmez |
| 4 | Üye ve yönetici ekranları, hata/yenileme, bütün izole kabul | Aynı hak kararı API ve webde; hesap değişiminde eski veri gizlenir; gerçek ödeme/e-posta gönderilmez |

Bu adımlar aynı üyelik tesliminde yürütülür. Şirket kapsamı/kanıtı D10, bilet hakları ve grup kabul/hizmet kararları gereken alt akışlarda ayrı açık kalır. Üç sorunun yanıtı bütün D01–D10 kararlarını kapatmaz. P03/P12–P14/P25/P30 sırf bu kayıtla Done yapılmaz.

Kaynak gözlemi: eski POST /api/events/attendance hâlâ toplantı oluşturma, toplu yoklama ve asenkron eski puan hesaplama koludur; yeni yönetici yoklama geçmişinin kabulü bu kolun kabulü değildir. P26/P39 kalan kapsamına dahildir; başkan yetkisi ve D01 puan kararı seçilmeden yeni politikaya dönüştürülmedi.

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
