-- Enable Row Level Security (RLS) on Key Tables
-- This ensures that even if direct access is attempted, rules must be met.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_to_ones ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
-- Anyone can read basic user info (needed for member lists)
CREATE POLICY "Public profiles are viewable by everyone" 
ON users FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE USING (auth.uid() = id);

-- 2. GROUPS POLICIES
-- Active groups are viewable by everyone
CREATE POLICY "Active groups are public" 
ON groups FOR SELECT USING (status = 'ACTIVE');

-- 3. REFERRALS POLICIES
-- Users can see referrals they gave or received
CREATE POLICY "Users see own referrals" 
ON referrals FOR SELECT 
USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals" 
ON referrals FOR INSERT 
WITH CHECK (auth.uid() = giver_id);

-- 4. EVENTS POLICIES
-- Public events are viewable by everyone
CREATE POLICY "Public events are viewable" 
ON events FOR SELECT 
USING (is_public = true OR (auth.uid() IS NOT NULL));

-- 5. ATTENDANCE POLICIES
-- Users can see their own attendance
CREATE POLICY "Users see own attendance" 
ON attendance FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Since our Node.js backend connects using the SERVICE ROLE (postgres user),
-- it will bypass these RLS rules automatically. These rules are primarily for
-- direct frontend-to-supabase connections if you ever decide to use them.
