-- Consolidated from migrate_friends.js and create_blogs_table.js.
-- This file is used only by the isolated versioned schema rehearsal for now.

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  featured_image_alt VARCHAR(255),
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  tags TEXT[],
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  focus_keyword VARCHAR(255),
  secondary_keywords TEXT[],
  canonical_url VARCHAR(500),
  robots VARCHAR(100) DEFAULT 'index, follow',
  schema_type VARCHAR(100) DEFAULT 'BlogPosting',
  include_in_sitemap BOOLEAN DEFAULT TRUE,
  sitemap_priority DECIMAL(3,2) DEFAULT 0.7,
  change_frequency VARCHAR(50) DEFAULT 'monthly',
  og_title VARCHAR(255),
  og_description VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
