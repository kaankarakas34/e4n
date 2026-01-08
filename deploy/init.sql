-- Initial schema for Event4Network (Docker Postgres)
-- Enable pgcrypto for UUID generation and password hashing if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '$2b$10$abcdefghijklmnopqrstuvwxyz123456', -- Placeholder default
  name VARCHAR(100) NOT NULL,
  profession VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  phone VARCHAR(20),
  performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  performance_color VARCHAR(10) DEFAULT 'GREY' CHECK (performance_color IN ('GREEN','YELLOW','RED','GREY')),
  role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('MEMBER','PRESIDENT','VICE_PRESIDENT','SECRETARY_TREASURER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUPS & CHAPTERS
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(10) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE')),
  cycle_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cycle_months INTEGER DEFAULT 6 CHECK (cycle_months > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REQUESTED')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- POWER TEAMS
CREATE TABLE IF NOT EXISTS power_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(10) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  power_team_id UUID NOT NULL REFERENCES power_teams(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REQUESTED')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, power_team_id)
);

-- REFERRALS (İş Yönlendirmeleri)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(10) CHECK (type IN ('INTERNAL','EXTERNAL')),
  status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESSFUL','UNSUCCESSFUL')),
  temperature VARCHAR(10) CHECK (temperature IN ('HOT','WARM','COLD')),
  description TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTS (Toplantılar ve Etkinlikler)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  has_equal_opportunity_badge BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  type VARCHAR(20) CHECK (type IN ('education','meeting','one_to_one','visitor','social')),
  group_id UUID REFERENCES groups(id),
  member_id UUID REFERENCES users(id), -- For personal events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ATTENDANCE (Yoklama)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'SUBSTITUTE', 'MEDICAL')),
  substitute_name VARCHAR(100), -- Eger substitute ise gelen kisinin ismi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ONE-TO-ONES (Birebir Görüşmeler)
CREATE TABLE IF NOT EXISTS one_to_ones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  partner_id UUID NOT NULL REFERENCES users(id),
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (requester_id <> partner_id)
);

-- VISITORS (Ziyaretçiler)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  profession VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'ATTENDED' CHECK (status IN ('INVITED', 'ATTENDED', 'JOINED', 'NO_SHOW')),
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EDUCATION / CEU (Eğitimler)
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  hours DECIMAL(4,1) NOT NULL DEFAULT 1.0,
  completed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('BOOK','PODCAST','WEBINAR','WORKSHOP','ADVANCED_TRAINING')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LMS Schema
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(10) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE')),
  created_by UUID,
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('doc','video')),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  pass_score INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('single','multi')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answers JSONB NOT NULL,
  score INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT FALSE,
  answers JSONB
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Award',
  criteria_type VARCHAR(50) CHECK (criteria_type IN ('EXAM_PASS','COURSE_COMPLETE','REFERRAL_MILESTONE')),
  criteria_value VARCHAR(255), 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  -- Allow ad-hoc achievements not in master table?
  -- Or strictly enforce FK.
  -- The frontend code generated one on the fly.
  -- Let's support ad-hoc by making achievement_id optional OR
  -- better: Create an achievement row dynamically if needed, or stick to strict schema.
  -- Strict Schema approach:
  -- When Exam Created -> Create Achievement Row.
  -- When Exam Passed -> Insert user_achievements (user_id, achievement_id).
  
  -- But to support existing exams without migration logic complexity:
  -- I'll define achievements dynamically in frontend and backend just stores the "fact" of achievement.
  -- Maybe just store the data directly in user_achievements?
  -- No, let's keep it clean. 
  title VARCHAR(255), -- If achievement_id is null, use this
  description TEXT,
  icon VARCHAR(50),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title) -- Prevent duplicate same title
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_giver ON referrals(giver_id);
CREATE INDEX IF NOT EXISTS idx_referrals_receiver ON referrals(receiver_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_one_to_ones_requester ON one_to_ones(requester_id);
CREATE INDEX IF NOT EXISTS idx_visitors_inviter ON visitors(inviter_id);

-- Enforce unique profession logic (Functions)
CREATE OR REPLACE FUNCTION fn_check_group_profession_unique()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = NEW.group_id
      AND gm.status = 'ACTIVE'
      AND u.profession = (SELECT profession FROM users WHERE id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'Aynı iş kolundan bir üye zaten bu grupta aktif';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_group_members_unique_profession ON group_members;
CREATE TRIGGER trg_group_members_unique_profession
BEFORE INSERT OR UPDATE OF user_id, group_id ON group_members
FOR EACH ROW EXECUTE FUNCTION fn_check_group_profession_unique();

-- SEED DATA (Örnek Veriler)

-- Users (Password defaults to '123456' hashed via bcrypt for demo purposes if we used it, here just placebo hash)
INSERT INTO users (email, name, profession, city, phone, password_hash)
VALUES
  ('admin@demo.com', 'Admin Demo', 'Yönetim', 'İstanbul', '5550000000', '$2b$10$abcdef'),
  ('ali.can@example.com','Ali Can','Web Tasarımcı','İstanbul','+90 555 000 0001', '$2b$10$abcdef'),
  ('ayse.kaya@example.com','Ayşe Kaya','Grafik Tasarımcı','İstanbul','+90 555 000 0002', '$2b$10$abcdef'),
  ('mehmet.oz@example.com','Mehmet Öz','İnşaat Mühendisi','İstanbul','+90 555 000 0003', '$2b$10$abcdef')
ON CONFLICT (email) DO NOTHING;

INSERT INTO groups (name, status)
VALUES ('İstanbul Genel Grup','ACTIVE'), ('Ankara Genel Grup','DRAFT')
ON CONFLICT DO NOTHING;

INSERT INTO group_members (user_id, group_id, status)
SELECT u.id, g.id, 'ACTIVE' FROM users u, groups g 
WHERE u.email IN ('ali.can@example.com','ayse.kaya@example.com','mehmet.oz@example.com') 
AND g.name='İstanbul Genel Grup'
AND NOT EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = u.id AND gm.group_id = g.id)
ON CONFLICT DO NOTHING;

-- Sample One-to-Ones
INSERT INTO one_to_ones (requester_id, partner_id, meeting_date, notes)
SELECT u1.id, u2.id, NOW() - INTERVAL '2 days', 'Projeler hakkında'
FROM users u1, users u2
WHERE u1.email='ali.can@example.com' AND u2.email='ayse.kaya@example.com';

-- Sample Education
INSERT INTO education (user_id, title, hours, completed_date, type)
SELECT id, 'BNI Podcast Bölüm 25', 1.0, NOW() - INTERVAL '1 day', 'PODCAST'
FROM users WHERE email='ali.can@example.com';

-- NEW SEED DATA ADDED ON REQUEST
-- 6 Groups
INSERT INTO groups (name, status, cycle_started_at) VALUES 
('Liderler Global', 'ACTIVE', NOW()),
('Ankara Vizyon', 'ACTIVE', NOW()),
('Ege Profesyonelleri', 'ACTIVE', NOW()),
('Bursa İnovasyon', 'ACTIVE', NOW()),
('Antalya Turizm Ağı', 'ACTIVE', NOW()),
('Tech Girişimcileri', 'ACTIVE', NOW())
ON CONFLICT DO NOTHING;

-- 6 Power Teams
INSERT INTO power_teams (name, description, status) VALUES
('İnşaat ve Gayrimenkul', 'Mimarlar, Müteaahhitler, Emlakçılar', 'ACTIVE'),
('Sağlık ve İyi Yaşam', 'Doktorlar, Diyetisyenler, Spor Eğitmenleri', 'ACTIVE'),
('Dijital ve Teknoloji', 'Yazılımcılar, Dijital Pazarlama, SEO', 'ACTIVE'),
('Finans ve Hukuk', 'Avukatlar, Mali Müşavirler, Sigortacılar', 'ACTIVE'),
('Etkinlik ve Turizm', 'Organizasyon, Otelcilik, Seyahat Acenteleri', 'ACTIVE'),
('Üretim ve İhracat', 'Fabrika Sahipleri, Lojistik, Gümrük', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 6 Events
INSERT INTO events (title, description, location, start_at, end_at, created_by, type, is_public) 
SELECT 'Haftalık Toplantı - Liderler', 'Genel haftalık toplantı ve iş yönlendirmeleri.', 'Zoom Online', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', id, 'meeting', TRUE FROM users WHERE email='admin@demo.com' UNION ALL
SELECT 'Sabah Networking Kahvaltısı', 'Yüz yüze tanışma ve kahvaltı etkinliği.', 'Divan Otel', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', id, 'meeting', TRUE FROM users WHERE email='admin@demo.com' UNION ALL
SELECT 'Dijital Pazarlama Trendleri', '2025 Dijital Pazarlama Stratejileri eğitimi.', 'Google Meet', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 1.5 hours', id, 'education', TRUE FROM users WHERE email='admin@demo.com' UNION ALL
SELECT 'İnşaat Power Team Öğle Yemeği', 'Sektörel gelişmelerin değerlendirilmesi.', 'Nusret Steakhouse', NOW() + INTERVAL '1 week', NOW() + INTERVAL '1 week 1.5 hours', id, 'meeting', FALSE FROM users WHERE email='admin@demo.com' UNION ALL
SELECT 'Yeni Üye Oryantasyonu', 'Sisteme yeni katılanlar için bilgilendirme.', 'Ofis Toplantı Odası', NOW() + INTERVAL '2 weeks', NOW() + INTERVAL '2 weeks 2 hours', id, 'education', FALSE FROM users WHERE email='admin@demo.com' UNION ALL
SELECT 'Yılın En İyileri Gala Gecesi', 'Yıl sonu başarı ödülleri ve kutlama.', 'Çırağan Sarayı', NOW() + INTERVAL '1 month', NOW() + INTERVAL '1 month 4 hours', id, 'social', TRUE FROM users WHERE email='admin@demo.com';
