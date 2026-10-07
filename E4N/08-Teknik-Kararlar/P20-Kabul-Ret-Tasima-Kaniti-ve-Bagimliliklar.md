# P20 — Kabul, ret ve taşıma kanıt zinciri

**2 Ekim 2026.** Mevcut etkin API'nin izole PostgreSQL 17.11 baz çizgisi:

| Akış | Bugünkü sonuç | Kanıt |
|---|---|---|
| Grup ret `REJECTED` | HTTP 500; önceki durum korundu | [[E4N/09-Dogrulama/P11-HTTP-Durum-Yazma-Provasi|P11]] |
| Admin taşıma `INACTIVE` | HTTP 500; kaynak ACTIVE, hedefte 0 satır | [[E4N/09-Dogrulama/P11-HTTP-Durum-Yazma-Provasi|P11]] |
| Aynı meslekli kabul | Başvuru INSERT engellenebilir; iki REQUESTED kabulü iki ACTIVE üretir | [[E4N/09-Dogrulama/P16-Meslek-Tetikleyici-Provasi|P16]] |
| Son koltuk | 34 ACTIVE üzerine iki onay 200/200, sonuç 36 ACTIVE | [[E4N/09-Dogrulama/P17-Son-Koltuk-Kapasite-Provasi|P17]] |
| Görüşme/karar yetkisi | MEMBER JWT ile başka grubun başvurusu ACTIVE yapılabildi | [[E4N/09-Dogrulama/P18-Gorusmesiz-Yetkisiz-Onay-Baz-Cizgisi|P18]] |
| Çıkarma/geçmiş | DELETE ilişkiyi kaldırıyor; olay tablosu yok | [[E4N/09-Dogrulama/P19-Grup-Gecmisi-Provasi|P19]] |

P20 yalnız `REJECTED`/`INACTIVE` değerlerini CHECK'e ekleme işi değildir. P10 başvuru/yerleşim/olay anahtarları, P11 durum geçişleri, D05 hizmet eşleşmesi, D08 karar yetkisi, D09 kapasite ve D02–D04 çıkarma anlamı birlikte kesinleşmeli. Sonra bütün aktif yazma yolları aynı atomik doğrulamaya bağlanıp hata kodu/UI sonucu ve rollback sınanmalı. Şimdilik canlı şema veya ürün kuralı değiştirilmedi; P20 kabul koşulu açık.
