# Canlı Supabase RLS riski ve onarım taslağı

**Durum:** AUD-001, 1 Ekim 2026. Supabase `e4n` projesi, `public` şeması. `list_tables` 34 tabloda RLS kapalı raporladı. `has_table_privilege` ile `users`, `payment_transactions`, `public_visitors`, `email_configurations`, `group_members`, `groups`, `event_tickets`, `blogs` için `anon` SELECT/INSERT/UPDATE yetkileri doğrulandı. Anon HTTP çağrısı yapılmadı.

## Etki

Bu tablolarda kişisel bilgi, parola hash'i, ödeme/ziyaretçi kaydı ve SMTP yapılandırması bulunabilir. `src/api/supabase.ts` tarayıcıda Supabase istemcisi oluşturuyor ve blog ekranları Data API'ye doğrudan gidiyor. `public` şemasındaki tablo izinleri ve kapalı RLS birlikte kritik veri erişimi riski yaratıyor. Gizli değerler burada saklanmadı.

## Önerilen işlem sırası

1. Üretimde doğrudan Data API kullanan akışları ve gerekli `anon`/`authenticated` erişimini saptayın; blog ekranları buna dahil.
2. Özellikle `users`, `email_configurations`, `payment_transactions`, `public_visitors` için rol bazlı izin/politika taslağı hazırlayın. Mevcut `server/supabase_security.sql` yalnız bazı tabloları kapsıyor ve canlıda uygulanmış görünmüyor.
3. Test ortamında politikalarla giriş, blog, başvuru, ödeme, etkinlik ve API akışlarını doğrulayın.
4. Üretim değişikliğini geri dönüş ve izleme planıyla uygulayın. RLS açılması mevcut doğrudan istemci çağrılarını engelleyebilir.

## RLS etkinleştirme SQL taslağı — uygulanmadı

Aşağıdaki SQL Supabase denetiminin önerdiği 34 tabloyu kapsar. **Tek başına çalıştırılmamalı:** uygun politikalar eklenmeden Data API erişimini kesebilir. Kullanıcı, hangi politika ve uygulama zamanı ile yürütüleceğine karar verecek.

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_to_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders_sent ENABLE ROW LEVEL SECURITY;
```

Kaynaklar: canlı Supabase tablo/izin sorguları ve [Supabase RLS kılavuzu](https://supabase.com/docs/guides/database/postgres/row-level-security). Bu taslak henüz politika tanımları içermez.
