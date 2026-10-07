# Shuffle — gerçek dağılım ve taslak kayıt paketi

## Değişen davranış

- Yönetici ekranı artık tek salt okunur API yanıtından gerçek grup, hesap ve ACTIVE grup üyeliklerini okur. İlk dağılım round-robin üretilmez.
- Önceki dönem grubu uydurulmaz. Atama geçmişi yoksa açıkça belirtilir; eski arkadaşlık puanı hesaplanmaz.
- Mevcut ACTIVE hesap / ADMIN hariç filtresi korunur. Bu filtre ödeme uygunluğu veya D06/D07 onayı sayılmaz.
- Birden fazla aktif grubu bulunan hesapların tüm mevcut bağlantıları korunur ve taslak hazırlama durur. Meslek kaydı eksikse sınıflandırma uydurulmaz.
- Önizlemede 35 koltuk sınırı uygulanır. Yerleşemeyen üyeler ayrı gösterilir ve taslak kaydedilemez. Eski kaydetme yolu liderlik rollerini sıfırladığı için önizlemedeki her kişi üye koltuğu sayılır.
- Ekran takvim seçerek uygulamada bulunmayan bir dönem kontrolü varmış gibi göstermez.
- Web kaydı, okunan verinin SHA256 sürümünü gönderir. Mevcut grup mutasyon kilidi içinde satırlar kilitlenip sürüm karşılaştırılır; değişmiş taslak 409 ile hiçbir üyelik/rol değiştirmeden reddedilir. joined_at sürüme dahil olduğundan aynı yerleşimin eski sürümle tekrarı da reddedilir.
- Kaydetme yanıtı doğrulanır. HTTP sonucu belirsizse otomatik tekrar yapılmaz; önce güncel dağılım okunur. Hesap/oturum değişiminde eski veri ve taslak gösterilmez.
- Kayıttan sonra bulunmayan shuffle/notify yolu çağrılmaz; e-posta gönderildiği iddia edilmez. Kayıt sonucu ekranda ayrı ve doğru gösterilir.

## Sınırlar

Bu paket hedef P27/P28/P29'un tamamı değildir. Dönem, ödeme kesim saati, hizmet sınıflandırması, başkanın shuffle davranışı ve kabul yetkileri açık kalır. Kalıcı dönem/atama geçmişi ve bildirim teslimatı kurulmadı. Eski API çağrılarında expectedRevision isteğe bağlı korunur; yeni web ekranı zorunlu gönderir. Mevcut global rol sıfırlama/ACTIVE üyelikleri arşivleme semantiği değiştirilmedi. Canlı Supabase'e yazılmadı, üretim dağıtımı ve gerçek e-posta/ödeme yapılmadı. Mobil ve LMS ertelenmiş durumda.

## Doğrulama

- Disposable PostgreSQL17, 17 migration / tekrar 0.
- Gerçek Express/JWT: admin, sahte ADMIN iddiasıyla üye, silinmiş hesap, rol düşürme, private/no-store, query reddi.
- Gerçek ACTIVE bağlantıları, REQUESTED satırın aktif gösterilmemesi, çoklu grup ve grubusuz hesap, hassas alanların DTO'da bulunmaması.
- Eski grup/hesap sürümüyle 409 ve birebir değişmeyen üyelik satırları; güncel kayıt200; aynı sürümle iki eşzamanlı kayıttan yalnız biri200; aynı yerleşim tekrarında409.
- 71 benzersiz kişi / iki grup: 35+35+1 atanamayan; kilitli yerleşim korunur.
- Eşzamanlı değişimde tutarlı salt okunur snapshot; SQL failure500 ve sonrasında kurtarma.
- Tarayıcı ve bütün regresyon sonucu tamamlanınca aşağıya kaydedilir.

## Kaynak

server/src/shuffle-workspace.js, src/api/shuffleWorkspace.ts, src/pages/AdminShuffle.tsx, server/test/shuffle-workspace-contract.mjs.
PostgreSQL snapshot davranışı: https://www.postgresql.org/docs/17/transaction-iso.html.

## Son kabul — 7 Ekim 2026

Bütün web API/veri regresyonu: **30 PASS / 0 FAIL**, output/web-acceptance/2026-10-07T16-38-58-920Z/report.json. Son yarış/replay testleri ayrıca output/shuffle-workspace-contract-final.log içinde PASS.

Taze gerçek App/Vite → Express/JWT → PostgreSQL17 tarayıcı: **27 PASS / 0 FAIL**, output/web-browser/2026-10-07T16-43-51-855Z/browser-report.json. Gerçek36 mevcut/0boşgrup/1grubusuz, kilitli taslakta37tekilkişi, gerçek409stale red/yenidenyükleme, eski akışlar ve son DB36ACTIVE+REQUESTEDkorunması geçti. Screenshotlar incelendi. Native confirm fixture'da deterministik; dış ağ kapalı, gerçek mail/ödeme yok.

İlk 16-37-17 browser koşusu, paralel disposable Docker ortamları ağ arayüzlerini değiştirirken Chromium ERR_NETWORK_CHANGED verdiği için durduruldu; eksik koşu kabul kanıtı değildir. Tam API regresyonundan sonra tek taze browser ortamında final27/27 geçti. Build ve check PASS; şema değişmedi (17migration/43manifest). Route sahipliği 164route/19provider, legacy17korunur. Owned tarayıcı/Vite/API/container kapatıldı. releaseReady=false; P28/P29/P39/P37 hedef kapıları açık.
