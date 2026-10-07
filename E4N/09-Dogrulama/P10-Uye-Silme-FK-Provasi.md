# P10 — Üye silme ve `public_visitors` FK provası

**2 Ekim 2026.** Aktif `DELETE /api/admin/members/:id` yolu, atılabilir PostgreSQL 17.11/34 tablo/5 migration kurulumunda sentetik ADMIN JWT'siyle sınandı. İki ayrı sentetik kullanıcı kullanıldı; canlı Supabase'e yazılmadı.

| Senaryo | HTTP | DB sonucu |
|---|---:|---|
| Bağımlı satırı olmayan kullanıcı | 200 | Kullanıcı satırı 1→0 |
| `public_visitors.inviter_id` ile bağlanan kullanıcı | 500; PostgreSQL FK engeli | Kullanıcı 1→1 ve ziyaretçi 1→1; transaction rollback |

Aktif handler `visitors` tablosunu temizliyor fakat `public_visitors.inviter_id` ilişkisini işlemiyor. P09 `0005_public_visitor_inviter` sonrası izole şemadaki FK `NO ACTION`; 1 Ekim salt okunur canlı FK kataloğunda da bu ilişki `NO ACTION`. Bu, canlıdaki bir kullanıcı için aynı sonucu kanıtlamaz; üretim verisinde silme çağrılmadı. H26'daki başka gözlem de sürüyor: `safeDelete` eksik tablolar dahil SQL hatalarını uyarı olarak geçiyor; bağımlı satır yoksa yine 200 dönebiliyor.

Canlı FK kataloğunda `users.id` hedefine 25 ilişki var: 12 CASCADE, 1 SET NULL, 12 NO ACTION. Bu sayı satırların dolu olduğu anlamına gelmez. Aktif silme yolunun açıkça temizlediği ilişkiler, FK'nin otomatik sileceği ilişkiler ve geçmiş veri olarak korunması gereken ilişkiler P10/P39 veri saklama kararıyla ayrılmalı. `events.member_id` ve `payment_transactions.user_id` de NO ACTION olup aktif handler bunları işlemiyor; burada etkileri çalışma zamanında denenmedi. `ticket_messages.ticket_id` NO ACTION olduğu için başka göndericilerin mesajlarını taşıyan bir biletin silinmesi ayrıca incelenmeli.

Hedef tasarım kapısı: hesabı kapatma ile kişisel veriyi silme, finansal/işlemsel kayıt saklama ve davet ilişkisinin anonimleştirilmesi açık ayrı işlemler olarak tanımlanır. Karar çıkmadan canlı FK'yi CASCADE'e çevirmek veya ziyaretçi satırlarını silmek geçmiş veriyi kaybettirebilir. P09 gerçek yedek/geri yükleme ve P10 saklama kararı sonrası izole geçiş provası yapılır.
