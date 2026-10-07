# WEB-03 — Profil ve bağlantı API/web paketi

**Teslim:** 4 Ekim 2026. **Linear:** E4N-136 Done; P39/E4N-111 ana görev açık. **Commit:** [1962cf3](https://github.com/kaankarakas34/e4n/commit/1962cf3), `codex/e4n-sprint1-foundation` dalına gönderildi.

## Tamamlanan akış

Profil artık tek, oturum sahibine bağlı API snapshot kullanıyor. Eksik bağlantı kontrolü eklendi. Bağlantı kurma, kabul ve ret düğmeleri gerçek işlem makbuzu ve işlem sonrası okuma ile çalışıyor. İstek kutusu API'nin gerçek gönderici adı/mesleğini gösteriyor; hata, yüklenme ve gerçekten boş liste ayrılıyor. İki ekran oturum/hedef değişiminde eski veriyi temizliyor, geç yanıtları atıyor ve eşzamanlı düğme işlemlerini kilitliyor.

İstek yazmaları aynı kullanıcı çiftinin iki yönünde ortak transaction kilidi ve satır kilidi kullanıyor. Karşılıklı eşzamanlı istek tek kayıt; kabul/ret yarışında tek sonuç; aynı sonuç tekrarında yeni yazma yok. Kabul edilmiş bağlantı ret ile bozulmuyor. Olmayan istek başarı sayılmıyor. Eski bir çift için iki çelişkili kayıt varsa 409 ile yönetim incelemesi gerekiyor. Reddedilmiş isteğe yeniden başvuru ve otomatik karşılıklı kabul gibi yeni ürün kuralları eklenmedi.

Yeni profil DTO'su alanları açıkça seçiyor. İletişim yalnız kendisi, kabul edilmiş bağlantı veya güncel DB ADMIN için; fatura yalnız kendisi veya güncel DB ADMIN için dönüyor. Ortak gruplar iki ACTIVE üyeliğin ACTIVE grup kesişimi. Eski online göstergesi, örnek istatistik/rozetler, varsayılan İstanbul ve herkese vergi bilgisi kaldırıldı.

## Kanıt ve doğrulama sınırı

| Kontrol | Sonuç |
| --- | --- |
| `node server/test/connections-contract.mjs` | Gerçek web bearer → aktif Express → izole PostgreSQL 17: sahip/veri/rol sınırları, iki yönlü create yarışı, karşıt karar yarışı, tekrar/çatışma, UUID, eski tutarsız çift, INSERT sonrası rollback/yeniden deneme, GET yazmaması geçti |
| `node test/connections.mjs` | Gerçek TSX/typed servis, kontrollü hook'lar: aksiyonlar, adlar, çift tıklama, committed refresh, hata/retry, owner/token/route/unmount geç yanıtlar, boş/hatalı liste, malformed/foreign/leaked/ACK yanıtları geçti |
| `npm run check` / `npm run build` | İkisi de exit 0; mevcut bundle/browsers veri uyarıları build hatası değil |
| Playwright CLI | Gerçek PublicProfile ve FriendRequestsWidget, gerçek auth/router/transport ile yerel Vite bileşen harness'inde; izole HTTP/PG yanıt fixture'larıyla ilk okuma hatası/retry, pending, kabul sonrası iletişim, fatura gizliliği, tekrar kabul ve yenilenen boş liste doğrulandı |
| Git | Yerel HEAD ve origin dalı `1962cf33389bc97b4d530a7f8579046fc6b58631`; tracked kaynak temiz, yalnız untracked output kanıtları |

Tarayıcı görseli yönetilen worktree altında `output/playwright/connections-accepted.png`; screenshot incelendi. Tarayıcı kontrolü üretim E2E değildir. Kendi Vite, tarayıcı ve izole konteyner kapatıldı. Canlı Supabase yazması, üretim deploy, SMTP/ödeme testi yok. Şema 10 sürüm/37 tablo; yeni migration/runtime DDL yok.

## Açık kapsam

Mobil ekranlara dokunulmadı; `/user/friends` aynı grup/lonca keşif anlamını koruyor. Eski `/users/:id` ve discovery uçlarının daha geniş veri görünürlüğü bu teslimle çözülmüş sayılmaz; Sprint 6 güvenlik kapsamı açık. Mevcut kendini düzenleme ve toplantı bileşeni korundu; eski bio/website kalıcılığı eklenmedi. Mesaj Gönder linkinin sunucu akışı hâlâ eksik. P39 ve genel uçtan uca kabul kapanmadı.

## Sonraki web paketi

**Öncelikli aday: birebir mesaj yaşam döngüsü.** Bağlantı paketi temelini artık kullanabilir; mevcut web UI kabul edilmiş bağlantıya Mesaj Gönder gösteriyor. Önce P08/P32 kapsamını ve mevcut MessagesPage/üç API çağrısını karşılaştır; mevcut accepted bağlantı sınırını temel al. Şemada mesaj tablosu bulunmadı: kalıcı veri, sürümlü izole kurulum, JWT sahibi konuşma/mesaj listesi, doğrulanan tek gönderim, profil → doğru alıcı navigasyonu, boş/hata/retry ve eski oturum yanıtı sınırları birlikte tek paket olmalı. Okundu bilgisi, push/SMTP, dosya eki veya yeni üyelik hakkı uydurulmaz. Canlı şema geçişi ve tüm D kararları ayrı açık kalır.

Belge paketi rol/saklama ve gerçek dosya hedefi gerektiriyor; sınav paketi mevcut `exams.course_id NOT NULL` ile course seçmeyen web formunu uzlaştırmalı, sorular ve geçmiş attempt ilişkilerini korumalı. Bu bağımlılıklar çözülmeden yalnız bir POST ekleyip Done denmeyecek. Üye oluşturma/şirket/üyelik ve shuffle D bağımlılıkları korunur. Yapılabilir web işi varken MOB-01 başlamaz.
