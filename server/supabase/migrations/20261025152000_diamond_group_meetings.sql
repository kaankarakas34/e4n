-- Diamond Grubu Toplantı Tarihleri ve Etkinlikleri
-- 30 Ekim 2026, 12 Kasım 2026, 26 Kasım 2026, 10 Aralık 2026, 24 Aralık 2026 (Yıl Sonu)

DO $$
DECLARE
  v_group_id uuid;
  v_admin_id uuid;
BEGIN
  -- Diamond grubunu bul
  SELECT id INTO v_group_id FROM public.groups WHERE name ILIKE '%Diamond%' LIMIT 1;
  IF v_group_id IS NULL THEN
    v_group_id := '97ebe739-9246-4ffb-b270-54577d092fab'::uuid;
  END IF;

  -- Admin kullanıcısını bul (created_by için)
  SELECT id INTO v_admin_id FROM public.users WHERE role = 'ADMIN' LIMIT 1;

  -- 1. Diamond Grubu planlanmış toplantı tarihlerini güncelle
  UPDATE public.groups
  SET 
    meeting_dates = '["2026-10-30", "2026-11-12", "2026-11-26", "2026-12-10", "2026-12-24"]'::jsonb,
    meeting_day = 'Thursday',
    meeting_time = '19:30:00',
    meeting_link = 'https://us06web.zoom.us/j/88417472636'
  WHERE id = v_group_id OR name ILIKE '%Diamond%';

  -- 2. Etkinlikleri ekle (mevcutsa mükerrer oluşturma)
  -- 30 Ekim 2026 Toplantısı
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE group_id = v_group_id AND start_at >= '2026-10-30 00:00:00+03' AND start_at < '2026-10-31 00:00:00+03') THEN
    INSERT INTO public.events (id, group_id, title, description, location, is_online, is_public, start_at, end_at, type, status, created_by)
    VALUES (
      gen_random_uuid(),
      v_group_id,
      'Diamond Grubu Toplantısı',
      'Olağan iş geliştirme, 1-on-1 ve networking toplantısı.',
      'https://us06web.zoom.us/j/88417472636',
      true,
      false,
      '2026-10-30 19:30:00+03',
      '2026-10-30 21:00:00+03',
      'meeting',
      'PUBLISHED',
      v_admin_id
    );
  END IF;

  -- 12 Kasım 2026 Toplantısı
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE group_id = v_group_id AND start_at >= '2026-11-12 00:00:00+03' AND start_at < '2026-11-13 00:00:00+03') THEN
    INSERT INTO public.events (id, group_id, title, description, location, is_online, is_public, start_at, end_at, type, status, created_by)
    VALUES (
      gen_random_uuid(),
      v_group_id,
      'Diamond Grubu Toplantısı',
      'Olağan iş geliştirme, 1-on-1 ve networking toplantısı.',
      'https://us06web.zoom.us/j/88417472636',
      true,
      false,
      '2026-11-12 19:30:00+03',
      '2026-11-12 21:00:00+03',
      'meeting',
      'PUBLISHED',
      v_admin_id
    );
  END IF;

  -- 26 Kasım 2026 Toplantısı
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE group_id = v_group_id AND start_at >= '2026-11-26 00:00:00+03' AND start_at < '2026-11-27 00:00:00+03') THEN
    INSERT INTO public.events (id, group_id, title, description, location, is_online, is_public, start_at, end_at, type, status, created_by)
    VALUES (
      gen_random_uuid(),
      v_group_id,
      'Diamond Grubu Toplantısı',
      'Olağan iş geliştirme, 1-on-1 ve networking toplantısı.',
      'https://us06web.zoom.us/j/88417472636',
      true,
      false,
      '2026-11-26 19:30:00+03',
      '2026-11-26 21:00:00+03',
      'meeting',
      'PUBLISHED',
      v_admin_id
    );
  END IF;

  -- 10 Aralık 2026 Toplantısı
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE group_id = v_group_id AND start_at >= '2026-12-10 00:00:00+03' AND start_at < '2026-12-11 00:00:00+03') THEN
    INSERT INTO public.events (id, group_id, title, description, location, is_online, is_public, start_at, end_at, type, status, created_by)
    VALUES (
      gen_random_uuid(),
      v_group_id,
      'Diamond Grubu Toplantısı',
      'Olağan iş geliştirme, 1-on-1 ve networking toplantısı.',
      'https://us06web.zoom.us/j/88417472636',
      true,
      false,
      '2026-12-10 19:30:00+03',
      '2026-12-10 21:00:00+03',
      'meeting',
      'PUBLISHED',
      v_admin_id
    );
  END IF;

  -- 24 Aralık 2026 Yıl Sonu Toplantısı
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE group_id = v_group_id AND start_at >= '2026-12-24 00:00:00+03' AND start_at < '2026-12-25 00:00:00+03') THEN
    INSERT INTO public.events (id, group_id, title, description, location, is_online, is_public, start_at, end_at, type, status, created_by)
    VALUES (
      gen_random_uuid(),
      v_group_id,
      'Diamond Grubu Yıl Sonu Toplantısı',
      'Yıl sonu hedefleri, kapanış değerlendirmesi ve kutlama toplantısı.',
      'https://us06web.zoom.us/j/88417472636',
      true,
      false,
      '2026-12-24 19:30:00+03',
      '2026-12-24 21:00:00+03',
      'meeting',
      'PUBLISHED',
      v_admin_id
    );
  END IF;

END $$;
