# P28 — Shuffle algoritması sert koşul provası

**2 Ekim 2026.** `src/utils/shuffleAlgorithm.ts` mevcut fonksiyonu `node test/shuffle-baseline.mjs` ile sentetik veride çalıştırıldı. API, canlı Supabase veya gerçek üye verisi kullanılmadı.

| Girdi | Algoritma sonucu | Hedef farkı |
|---|---|---|
| Tek grup, farklı meslekli 36 üye | 36 kişi aynı gruba, yerleşemeyen 0 | 35 tavan kararı verilirse kapasite sert koşulu yok. |
| Aynı meslekli iki kişi aynı grupta kilitli | İkisi de o grupta kaldı | Kilitler hizmet çakışmasını doğrulamadan kopyalanıyor. |

Algoritmanın serbest üyeler dalı yalnız `profession` metninin birebir eşitliğini engelliyor; yakın/çoklu hizmet D05 matrisi yok. `AdminShuffle` önceki grup kimliğini mock atıyor ve dönem uygunluğunu demo `true` yapıyor ([[E4N/08-Teknik-Kararlar/P27-Dort-Aylik-Donem-Uygunluk-Baz-Cizgisi|P27]]). Kaydetme yolu da [[P11-HTTP-Durum-Yazma-Provasi|P11]] durum kısıtına takılıyor. D05/D09/D06 kararları ve P19 geçmiş modeli olmadan hedef algoritma uygulanmadı.
