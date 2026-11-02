# Ana sayfa E4N tanıtım videosu — 2 Kasım 2026

- İstek: Hero'nun hemen altında ikinci bölüm; solda kısa E4N anlatımı, sağda kullanıcının verdiği YouTube videosu.
- Linear: [E4N-299](https://linear.app/e4n/issue/E4N-299). İlgili kabul: ürün dili, mobil görünüm, iç bağlantı ve teknik doğrulama. Epic'in BRAND-01/CNT-11 kapsamının tamamı bu küçük ekle kapanmaz; mevcut durum korunur.
- Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`, dal `codex/e4n-sprint1-foundation`.
- Kod: `src/pages/LandingPage.tsx`. Mevcut hero ve diğer bölümler korunarak ikinci sıraya etiketli bir section eklendi. Masaüstünde eşit iki sütun, 1024px altında metin üstte/video altta. Mevcut kırmızı/lacivert renkler, kısa tanım, `/e4n-nedir` bağlantısı, koyu video çerçevesi ve YouTube'da aç bağlantısı.
- Video: `https://www.youtube.com/embed/YxytUnNFJJE?si=xI7Ry51AajJOkLwo`; 16:9, lazy loading, açıklayıcı title, fullscreen ve verilen referrer policy. Otomatik oynatma başlatılmaz. Mevcut CSP YouTube iframe kaynağını zaten kabul ediyor; güvenlik başlığı değişmedi. Yeni bağımlılık yok.

## Doğrulama

- `npm run build`: başarılı; TypeScript, 244 rota/34 provider sözleşmesi, istemci/SSR/31 sayfa prerender dahil.
- `npx eslint src/pages/LandingPage.tsx`: başarılı, çıktı/hata yok.
- `npm run seo:check`: başarılı, 31 statik sayfa sözleşmesi; tek H1/canonical/description korunur.
- `git diff --check`: başarılı. Başka işlere ait mevcut dosyalarda yalnız Git CRLF uyarıları.
- Salt okunur üretim önizleme HTTP 200, statik HTML'de video var; CSP YouTube'a izin veriyor. Önizleme `scripts/seo-preview.mjs` ile 127.0.0.1:4178; DB/API proxy yok.
- Gerçek IAB browser: 375/768/1024/1440px genişliklerde yatay taşma yok. 375 ve 768 alt alta; 1024 ve 1440 yan yana. Video oranı 1.778 (16:9). DOM'da bölüm sıra indeksi 1, yani hero sonrası ikinci bölüm.
- YouTube küçük resmi ve oynatıcı kontrolleri yüklendi; oynat düğmesine basıldı, media currentTime=19.190784/readyState=4 okundu. E4N'yi keşfedin bağlantısı `/e4n-nedir` sayfasına ulaştı ve hedef H1 görüldü. Browser error logu boş.
- Erişilebilirlik/motion incelemesi: section/h2 ilişkisi, iframe title, dekoratif ikon gizleme, linklerde görünür klavye odağı ve 44px yükseklik; yeni kendiliğinden animasyon yok, renk geçişleri motion-safe.
- Loglar ve görsel: yönetilen `output/e4n-home-video-20261102/` (build.log, lint.log, seo.log, desktop.jpg).

## Teslim sınırı

Yerel uygulama ve önizleme hazır. Kullanıcı 2 Kasım'da “git push yap” talimatıyla bu paketin commit/push teslimini yetkilendirdi; hedef mevcut `codex/e4n-sprint1-foundation` dalıdır. Canlı üretim yayını ayrıca doğrulanmalıdır. E4N-299'un diğer marka/ürün/uzman kabul kapsamı açıktır. İlgisiz hardening/mobile/silme değişiklikleri korunur.
