# Kritik akış komponent kartları

1 Ekim 2026 statik kaynak incelemesi; üretim web commit'i `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab`. Kullanım/route doğrulaması [[E4N/03-Komponentler/Kullanim-Haritasi|39 dosyalık kullanım haritası]] ve [[E4N/02-Mevcut-Sistem/Web-Route-Envanteri|web route listesi]] üzerinden yapılmıştır. Bu kartlar çalışma zamanı testi değildir.

## `PaymentModal` — `src/components/PaymentModal.tsx`

- **İş:** Üyelik, etkinlik ve ziyaretçi ödeme formunu ortak bir pencerede sunar. `Membership`, `EventDetail`, `VisitorPaymentPage` içinden kullanılır.
- **Girdi/çıktı:** `amount`, `planTitle`, `action`, `initialBillingData`, `onSuccess`, `onClose`. Şirket ve vergi numarası formda zorunlu denetlenir (`:126–128`); API'ye ödeme ve eylem verisi gönderilir (`:162`).
- **Veri:** Fatura alanları `api.updateMe` ile `users` satırına, ödeme denemesi `/payment/pay` ile `payment_transactions` tablosuna, callback ise eyleme göre üyelik/etkinlik/ziyaretçi kayıtlarına gider.
- **Görünüm:** İki adımlı form, işleme durumu, hata metni ve sağlayıcıdan dönen ödeme akışı var. Hak/indirim hesabı bu komponentte görünmüyor.
- **Değişiklik etkisi:** Üç farklı ödeme akışı ve callback sözleşmesi aynı komponenti kullanır; ücret/hak farkı tek yerde değil, ilgili ekran ve sunucuda da incelenmelidir.

## `VisitorForm` — `src/components/VisitorForm.tsx`

- **İş:** Genel ziyaretçi başvurusu ve davet eden üye aramasını sağlar; `VisitorApplication` içinde kullanılır.
- **Girdi/çıktı:** `source`, `className`, `onSuccess`; form şemasında şirket adı en az iki karakter (`:14`). Başarı durumunu ve olası engel mesajını gösterir.
- **Veri:** `api.searchPublicMembers`, `api.getPublicMember` ve `api.submitPublicVisitorApplication` kullanır (`:45–85`); sonuç `public_visitors` satırıdır.
- **Değişiklik etkisi:** Şirket şartının hangi kullanıcı aşamasında zorunlu olduğu D10'a bağlıdır; bu formdaki alan zorunluluğu tüm üyelik akışını kapsamaz.

## `ScoreCard` ve `GroupMembersWidget` — `src/shared/`

- **İş:** `ScoreCard` dashboard'da performans puanı/rengini gösterir; `GroupMembersWidget` kullanıcının grubu ve üyelerini listeler. Her ikisi `Dashboard` tarafından kullanılır.
- **Girdi/çıktı:** `ScoreCard` `performance`, `isLoading`, `userName`, `onRefresh` alır (`ScoreCard.tsx:7–14`). `GroupMembersWidget` kullanıcı bağlamından `api.getUserGroups` ve `api.getGroupMembers` çağırır (`:20–24`).
- **Veri:** Puan `users.performance_score/color`; grup üyeleri `group_members` ve `users`. Aylık kesinleşmiş puan kaydı mevcut canlı şemada yok.
- **Değişiklik etkisi:** Aylık tablo eklenirse toplam puan kartı ile dönem puanları ayrı gösterilmelidir; grup üyeliği geçmişi aynı widget'ın aktif liste sorgusuyla eşdeğer değildir.

## `AdminShuffle` — `src/pages/AdminShuffle.tsx` + `src/utils/shuffleAlgorithm.ts`

- **İş:** Yöneticiye mevcut dağılım, kilitleme, çatışma sayısı, aday shuffle ve kaydetme arayüzü sunar (`/admin/shuffle`).
- **Girdi/çıktı:** Grupları ve üyeleri API'den yükler; istemci algoritmasına `items`, `lockedMembers`, `respectLocks`, `minimizeOverlap`, `maxAttempts` gönderir. Sonuç `groupId → userId[]` haritasıdır.
- **Veri:** İlk dağılım ve `previous_group_id` kodda demo/indeks tabanlı üretilir (`AdminShuffle.tsx:68–102`). Kayıt `/shuffle/save`, ardından `/shuffle/notify` çağrısıdır (`:171–177`); ikinci yol bağlı API'de yok.
- **Görünüm:** Önizleme ve çatışma göstergeleri var. `canShuffle` demo olarak daima açılır (`:65`); yalnız tam meslek eşitliği kontrol edilir, 35 sınırı yok. Kaydetme canlı DB status kısıtıyla çelişir.
- **Değişiklik etkisi:** Dört aylık dönem, kapasite, hizmet çakışması, geçmiş ve tekrar güvenliği istemci önizlemesi ile sunucu kaydı arasında tutarlı olmalıdır.

## `GroupManagerDashboard` — `src/pages/GroupManagerDashboard.tsx`

- **İş:** Grubun üye, yoklama, başvuru, lonca ve faaliyet sekmelerini sunar.
- **Veri:** `getUserGroups`, `getGroupMembers`, `getGroupMeetings`, `getGroupVisitors`, `getGroupActivities`, `getPowerTeamMembers` ve diğer API metodlarını kullanır (`:64–110`). Başvuruda `updateGroupMemberStatus` / `updatePowerTeamMemberStatus` ile ACTIVE veya REJECTED yolları (`:128–143`, `:706–755`).
- **Sınır:** Canlı kısıtlar REJECTED kabul etmiyor. Başkan araması ve görüşme sonucu için ayrı kayıt alanı gözlenmedi. Bazı sekmelerin API yolu mevcut istemci/route eşleşmesinde eksik.
- **Değişiklik etkisi:** Görüşme ve karar kaydı, kapasite/hizmet kontrolü, başkanın yalnız kendi grubunu yönetmesi aynı akışta değerlendirilmelidir.

## `EventDetail` — `src/pages/EventDetail.tsx`

- **İş:** Etkinlik ayrıntısı, ücretsiz kayıt ve ücretli ödeme başlatma. `PaymentModal` kullanır (`:319–333`).
- **Veri:** `api.getEvent`, `api.registerForEvent`; ücretli işlemde `action.type=event_registration` callback üzerinden `payment_transactions` ve `attendance`/`event_tickets` kayıtlarına gider.
- **Görünüm:** Yükleniyor, etkinlik bulunamadı, kayıtlı/kayıtsız ve ödeme sonrası hata durumları var (`:14–18`, `:53–92`). Ücret `event.price` üzerinden alınır; üyeliğe dayalı indirim hesabı bulunmadı.
- **Değişiklik etkisi:** Dış etkinlik hakkı ve bilet indirimi üyelik durumuna bağlanacaksa bu ekran, ödeme tutarı ve callback aynı politikayı kullanmalıdır.

Diğer komponentlerin tam import envanteri [[E4N/03-Komponentler/Kullanim-Haritasi|ayrı notta]] korunur. Statik import bulunmayan beş kaynak silinecek olarak işaretlenmedi.
