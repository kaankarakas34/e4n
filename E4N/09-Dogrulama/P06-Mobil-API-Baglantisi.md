# P06 — Mobil API bağlantısı

**1 Ekim 2026. Linear:** [E4N-78](https://linear.app/e4n/issue/E4N-78/p06-mobil-api-adresini-ve-temel-baglantiyi-dogrula). Mobil uygulama, üst repodaki `mobile/` adlı ayrı Git deposunun mevcut çalışma ağacında incelendi. Bu depoda önceden çok sayıda commit edilmemiş dosya var; P06 kapsamında `constants/api.ts`, `hooks/use-auth.tsx` ve `app/(tabs)/events.tsx` hedefli düzenlendi. P07 bildirimi için ayrıca `app/(tabs)/index.tsx` alanları güncellendi.

## Kaynak değişikliği

- Üretim varsayılanı, örnek GET'lerde 404 dönen `e4n-backend.vercel.app/api` yerine bağlı E4N alan adı `https://event4network.com/api` oldu.
- Geliştirme varsayılanı Android emülatöründe `10.0.2.2:4000/api`, iOS/web'de `localhost:4000/api`. Fiziksel cihaz veya test API'si için `EXPO_PUBLIC_API_URL` verilebilir; son `/` temizlenir.
- Giriş sonrası yönlendirme Expo Router'ın ürettiği tiplerle uyumlu `/admin` veya `/` yoluna düzeltildi.
- Etkinlik kartındaki eksik konumun `null, null` görünmesi ve yılın `202` diye kesilmesi düzeltildi.

## Doğrulama

| Deneme | Sonuç |
|---|---|
| `npx expo export --platform android` | Değişikliklerden sonra başarılı; 1 Android Hermes JS paketi üretildi. APK/IPA değildir. |
| `npx tsc --noEmit` | Güncel Expo Router tiplerine göre `/admin` yolu kullanıldı; ardından başarılı. |
| İzole API health, giriş ve etkinlik listesi | Sentetik PostgreSQL ortamında sırasıyla 200, 200 ve 200. Veriler üretime yazılmadı. |
| Android emülatöründe Expo Go | SDK 54 / Android API 36 üzerinde uygulama açıldı. `fixture@example.invalid` ile giriş yapıldı; ana sayfa istatistikleri ve bildirimler geldi; Etkinlikler sekmesi sentetik gelecek etkinliği gösterdi. Konum ve tarih düzeltmesi Metro yenilemesinden sonra ekranda doğrulandı. |

Son ekran kanıtı: ![[P06-Android-etkinlik-ekrani.png]]

Bu sonuçlar yerel Expo Go geliştirme çalıştırmasına aittir; mağaza/üretim APK'sı ve canlı API dağıtımı test edilmedi. Mobil yayın sürümünün hangi kaynak commit'inden üretildiği bilinmiyor. Mevcut `mobile/` çalışma ağacı önceden commit edilmemiş uygulama dosyaları içerdiği için bu dosyalar ayrı bir commit'e alınmadı. Sürüm eşleştirmesi ve dağıtılmış uygulama doğrulaması P32/P38 kapsamındaki yayın hazırlığında ayrıca yapılmalıdır. Canlı `GET /api/events`, P05 dağıtılmadığı için tekrar çağrılmadı.
