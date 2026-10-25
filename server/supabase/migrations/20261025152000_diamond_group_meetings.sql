-- Schedule upcoming meetings for Diamond group (97ebe739-9246-4ffb-b270-54577d092fab)
-- 30 Ekim 2026: Diamond Grubu Toplantısı
-- 12 Kasım 2026: Diamond Grubu Toplantısı
-- 26 Kasım 2026: Diamond Grubu Toplantısı
-- 10 Aralık 2026: Diamond Grubu Toplantısı
-- 24 Aralık 2026: Diamond Grubu Yıl Sonu Toplantısı

UPDATE public.groups
SET
  meeting_dates = (
    SELECT COALESCE(jsonb_agg(val ORDER BY val), '[]'::jsonb)
    FROM (
      SELECT DISTINCT jsonb_array_elements_text(
        COALESCE(
          CASE WHEN jsonb_typeof(meeting_dates) = 'array' THEN meeting_dates ELSE '[]'::jsonb END,
          '[]'::jsonb
        ) || '["2026-10-30", "2026-11-12", "2026-11-26", "2026-12-10", "2026-12-24"]'::jsonb
      ) AS val
    ) sub
  ),
  meeting_day = COALESCE(NULLIF(meeting_day, ''), 'Perşembe'),
  meeting_time = COALESCE(NULLIF(meeting_time, ''), '19:30'),
  meeting_link = COALESCE(NULLIF(meeting_link, ''), 'https://us06web.zoom.us/j/88417472636'),
  updated_at = NOW()
WHERE id = '97ebe739-9246-4ffb-b270-54577d092fab'
   OR LOWER(name) LIKE '%diamond%';

-- Ensure existing events on those dates are public and published
UPDATE public.events
SET
  is_public = TRUE,
  is_online = TRUE,
  status = 'PUBLISHED',
  type = 'meeting',
  city = COALESCE(NULLIF(city, ''), 'İstanbul'),
  location = COALESCE(NULLIF(location, ''), 'Online (Zoom) • İstanbul'),
  online_link = COALESCE(NULLIF(online_link, ''), 'https://us06web.zoom.us/j/88417472636')
WHERE group_id = '97ebe739-9246-4ffb-b270-54577d092fab'
  AND (start_at AT TIME ZONE 'Europe/Istanbul')::date IN (
    DATE '2026-10-30',
    DATE '2026-11-12',
    DATE '2026-11-26',
    DATE '2026-12-10',
    DATE '2026-12-24'
  );

-- Insert the 5 meetings into public.events idempotently
WITH target_group AS (
  SELECT id
  FROM public.groups
  WHERE id = '97ebe739-9246-4ffb-b270-54577d092fab'
  LIMIT 1
),
scheduled_meetings(title, description, start_at, end_at, date_key) AS (
  VALUES
    (
      'Diamond Grubu Toplantısı',
      'Diamond iş geliştirme ve networking grubu planlı oturumu.',
      TIMESTAMPTZ '2026-10-30 19:30:00+03',
      TIMESTAMPTZ '2026-10-30 21:00:00+03',
      DATE '2026-10-30'
    ),
    (
      'Diamond Grubu Toplantısı',
      'Diamond iş geliştirme ve networking grubu planlı oturumu.',
      TIMESTAMPTZ '2026-11-12 19:30:00+03',
      TIMESTAMPTZ '2026-11-12 21:00:00+03',
      DATE '2026-11-12'
    ),
    (
      'Diamond Grubu Toplantısı',
      'Diamond iş geliştirme ve networking grubu planlı oturumu.',
      TIMESTAMPTZ '2026-11-26 19:30:00+03',
      TIMESTAMPTZ '2026-11-26 21:00:00+03',
      DATE '2026-11-26'
    ),
    (
      'Diamond Grubu Toplantısı',
      'Diamond iş geliştirme ve networking grubu planlı oturumu.',
      TIMESTAMPTZ '2026-12-10 19:30:00+03',
      TIMESTAMPTZ '2026-12-10 21:00:00+03',
      DATE '2026-12-10'
    ),
    (
      'Diamond Grubu Yıl Sonu Toplantısı',
      'Diamond iş geliştirme ve networking grubu 2026 yıl sonu değerlendirme ve networking toplantısı.',
      TIMESTAMPTZ '2026-12-24 19:30:00+03',
      TIMESTAMPTZ '2026-12-24 21:30:00+03',
      DATE '2026-12-24'
    )
)
INSERT INTO public.events (
  title,
  description,
  start_at,
  end_at,
  location,
  city,
  is_online,
  online_link,
  group_id,
  is_public,
  status,
  type
)
SELECT
  sm.title,
  sm.description,
  sm.start_at,
  sm.end_at,
  'Online (Zoom) • İstanbul',
  'İstanbul',
  TRUE,
  'https://us06web.zoom.us/j/88417472636',
  tg.id,
  TRUE,
  'PUBLISHED',
  'meeting'
FROM target_group tg
CROSS JOIN scheduled_meetings sm
WHERE NOT EXISTS (
  SELECT 1
  FROM public.events e
  WHERE e.group_id = tg.id
    AND (e.start_at AT TIME ZONE 'Europe/Istanbul')::date = sm.date_key
);
