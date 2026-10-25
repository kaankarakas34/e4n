const DIAMOND_GROUP_ID = '97ebe739-9246-4ffb-b270-54577d092fab';
const DIAMOND_DATES = ['2026-10-30', '2026-11-12', '2026-11-26', '2026-12-10', '2026-12-24'];
const DIAMOND_ZOOM_LINK = 'https://us06web.zoom.us/j/88417472636';

const DIAMOND_MEETINGS = [
  {
    title: 'Diamond Grubu Toplantısı',
    description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
    start_at: '2026-10-30 19:30:00+03',
    end_at: '2026-10-30 21:00:00+03',
    date_key: '2026-10-30',
  },
  {
    title: 'Diamond Grubu Toplantısı',
    description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
    start_at: '2026-11-12 19:30:00+03',
    end_at: '2026-11-12 21:00:00+03',
    date_key: '2026-11-12',
  },
  {
    title: 'Diamond Grubu Toplantısı',
    description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
    start_at: '2026-11-26 19:30:00+03',
    end_at: '2026-11-26 21:00:00+03',
    date_key: '2026-11-26',
  },
  {
    title: 'Diamond Grubu Toplantısı',
    description: 'Diamond iş geliştirme ve networking grubu planlı oturumu.',
    start_at: '2026-12-10 19:30:00+03',
    end_at: '2026-12-10 21:00:00+03',
    date_key: '2026-12-10',
  },
  {
    title: 'Diamond Grubu Yıl Sonu Toplantısı',
    description: 'Diamond iş geliştirme ve networking grubu 2026 yıl sonu değerlendirme ve networking toplantısı.',
    start_at: '2026-12-24 19:30:00+03',
    end_at: '2026-12-24 21:30:00+03',
    date_key: '2026-12-24',
  },
];

let syncPromise = null;

export function ensureDiamondScheduleSynced(pool) {
  if (!pool || typeof pool.query !== 'function') return Promise.resolve();
  if (process.env.NODE_ENV === 'test') return Promise.resolve();
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production' && !process.env.FORCE_DIAMOND_SYNC) {
    return Promise.resolve();
  }
  if (!syncPromise) {
    syncPromise = (async () => {
      try {
        await pool.query(
          `UPDATE public.groups
           SET meeting_dates = (
             SELECT COALESCE(jsonb_agg(val ORDER BY val), '[]'::jsonb)
             FROM (
               SELECT DISTINCT jsonb_array_elements_text(
                 COALESCE(
                   CASE WHEN jsonb_typeof(meeting_dates) = 'array' THEN meeting_dates ELSE '[]'::jsonb END,
                   '[]'::jsonb
                 ) || $2::jsonb
               ) AS val
             ) sub
           ),
           meeting_day = COALESCE(NULLIF(meeting_day, ''), 'Perşembe'),
           meeting_time = COALESCE(NULLIF(meeting_time, ''), '19:30'),
           meeting_link = COALESCE(NULLIF(meeting_link, ''), $3),
           updated_at = NOW()
           WHERE id = $1::uuid OR LOWER(name) LIKE '%diamond%'`,
          [DIAMOND_GROUP_ID, JSON.stringify(DIAMOND_DATES), DIAMOND_ZOOM_LINK],
        );

        for (const m of DIAMOND_MEETINGS) {
          await pool.query(
            `UPDATE public.events
             SET title = $2,
                 description = $3,
                 start_at = $4::timestamptz,
                 end_at = $5::timestamptz,
                 is_public = TRUE,
                 is_online = TRUE,
                 status = 'PUBLISHED',
                 type = 'meeting',
                 city = COALESCE(NULLIF(city, ''), 'İstanbul'),
                 location = COALESCE(NULLIF(location, ''), 'Online (Zoom) • İstanbul'),
                 online_link = COALESCE(NULLIF(online_link, ''), $6)
             WHERE group_id = $1::uuid
               AND (start_at AT TIME ZONE 'Europe/Istanbul')::date = $7::date`,
            [DIAMOND_GROUP_ID, m.title, m.description, m.start_at, m.end_at, DIAMOND_ZOOM_LINK, m.date_key],
          );

          await pool.query(
            `INSERT INTO public.events (
               title, description, start_at, end_at, location, city, is_online, online_link,
               group_id, is_public, status, type
             )
             SELECT
               $2, $3, $4::timestamptz, $5::timestamptz,
               'Online (Zoom) • İstanbul', 'İstanbul', TRUE, $6,
               g.id, TRUE, 'PUBLISHED', 'meeting'
             FROM public.groups g
             WHERE g.id = $1::uuid
               AND NOT EXISTS (
                 SELECT 1 FROM public.events e
                 WHERE e.group_id = g.id
                   AND (e.start_at AT TIME ZONE 'Europe/Istanbul')::date = $7::date
               )`,
            [DIAMOND_GROUP_ID, m.title, m.description, m.start_at, m.end_at, DIAMOND_ZOOM_LINK, m.date_key],
          );
        }
      } catch (err) {
        console.error('Diamond schedule auto-sync warning:', err?.message || err);
        syncPromise = null;
      }
    })();
  }
  return syncPromise;
}
