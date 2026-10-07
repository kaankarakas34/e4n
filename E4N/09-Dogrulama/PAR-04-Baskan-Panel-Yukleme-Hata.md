# PAR-04 — Başkan paneli ilk yükleme hata sözleşmesi

3 Ekim 2026. `cd5d214` yönetilen dala gönderildi.

## Teslim

GroupManagerDashboard önce API hatasında console yazıp grup yok/kısmi cache/metrik, referrals hatasında [] gösteriyordu. Artık bütün kaynaklar array/object satır biçiminde doğrulanır ve grup id'si gerçek detay kaydıyla eşleşir; detay bulunmazsa eski getUserGroups satırı detay yerine kullanılmaz. Grup alt okumaları ve lonca alt okumaları bağımsız olduğu yerde paraleldir. Bütün sonuçlar başarılı olmadan panel kabul edilmez; görünür alert/Tekrar dene vardır.

User id/rol değişince eski panel gizlenir, effect temizliği eski sonucu kabul etmez. Gerçek boş gruplar bütün grup state'lerini temizler; varsa mevcut lonca okuması korunur. Grup/lonca seçim kuralı değiştirilmedi (ilk kayıt). Mevcut oturumlu kullanıcı/rol davranışı korunur; no-user okuma yapmaz, sunucu sahiplik/rol sınırı tamamlanmış değildir.

Shared getGroupActivities artık HTTP/ağ hatasını [] saymaz. Aktif server/src/index.js activities/substitutes/synergy GET yolları kaynakta mevcut; bu tur yeni HTTP/DB testi yapılmadı. Referrals hata/null→[] kaldırıldı. Yoklama submit eski callback/fresh read kontrolüyle taze kullanıcı okuması tamamlanmadan çağrı yapmaz.

## Kanıt

- `node test/manager-attendance.mjs`: gerçek TSX kontrollü hooks/API. getUserGroups/getGroups/members/meetings/visitors/activities/substitutes/referrals/userPowerTeams/teamMembers/teamSynergy her biri reject/null→alert; kısmi panel/yanlış grup yokluğu görünmez; tekrar→başarılı panel. Gerçek boş liste, user değişince eski panel gizleme, eski gecikmiş boş yanıtın atılması ve logout sıfır çağrı başarılı. Önceki yoklama ACK/pending/payload/refresh-error/user-role/unmount/oran testleri de geçer.
- `node test/meeting-read-api.mjs`: gerçek api.ts kontrollü fetch activities GET/path/JWT, HTTP/ağ reject ve gerçek[]; önceki meeting sayı/list/hata regresyonu başarılı.
- `npm run check` exit0, diff kontrolü başarılı, commit/push/temiz dal.

Kontrollü testler gerçek ağ veya tarayıcı/cihaz kabulü değildir. API/server rol veya DB yazma politikası değişmedi. Canlı Supabase/ödeme/mail/dağıtım yok. D01–D10, güvenlik ve ana PAR02/PAR04 kabulü açık. Panelin ciro null→0, kayıtların fiziksel katılım anlamı, onay yazma/rol/kapasite ve görünür ilk grup/lonca seçimi ayrı açık konulardır.

## Sonraki bağımsız iş

Toplantı detayında getMeetingAttendance halen hata→[]; modal loading/hata/retry/yanlış eski toplantı veya oturum yanıtı sınırı yok. Kaynak ve bütün tüketiciler incelenip API error→empty kaldırılacak, panel modalı doğrulanmış okuma/hata/gerçek boş halinde çalışacak. Ayrı ürün puan/yetki kuralı seçilmeyecek.
