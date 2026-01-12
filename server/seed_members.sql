-- Seed script to add member@demo.com and 30 professionals to 'Liderler Global'
-- Default password for all users: '123456'

DO $$
DECLARE
    grp_id UUID;
    main_user_id UUID;
    p_hash VARCHAR;
BEGIN
    -- Ensure pgcrypto extension is available for hashing
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    
    -- Generate BCrypt hash for password '123456'
    p_hash := crypt('123456', gen_salt('bf'));

    -- 1. Ensure 'Liderler Global' Group exists
    SELECT id INTO grp_id FROM groups WHERE name = 'Liderler Global';
    
    IF grp_id IS NULL THEN
        INSERT INTO groups (name, status, cycle_started_at) 
        VALUES ('Liderler Global', 'ACTIVE', NOW()) 
        RETURNING id INTO grp_id;
        RAISE NOTICE 'Group Liderler Global created.';
    ELSE
        RAISE NOTICE 'Group Liderler Global found.';
    END IF;

    -- 2. Create member@demo.com (Main User)
    -- Profession: 'Ağ Lideri'
    INSERT INTO users (email, name, profession, city, phone, password_hash, role)
    VALUES ('member@demo.com', 'Ana Üye', 'Grup Başkanı', 'İstanbul', '5559998877', p_hash, 'PRESIDENT')
    ON CONFLICT (email) DO UPDATE SET 
        role = 'PRESIDENT', 
        password_hash = p_hash,
        profession = 'Grup Başkanı'
    RETURNING id INTO main_user_id;

    -- Add main user to group
    -- Main user to group
    INSERT INTO group_members (user_id, group_id, status)
    SELECT main_user_id, grp_id, 'ACTIVE'
    WHERE NOT EXISTS (
        SELECT 1 FROM group_members gm_check 
        JOIN users u_check ON gm_check.user_id = u_check.id 
        WHERE gm_check.group_id = grp_id 
        AND gm_check.status = 'ACTIVE' 
        AND u_check.profession = (SELECT profession FROM users WHERE id = main_user_id)
    );

    -- 3. Create 30 Professionals with diverse professions
    CREATE TEMP TABLE IF NOT EXISTS temp_new_users (name text, profession text);
    TRUNCATE temp_new_users;
    
    INSERT INTO temp_new_users (name, profession) VALUES 
    ('Ahmet Yılmaz', 'Avukat'), 
    ('Mehmet Demir', 'Mimar'), 
    ('Ayşe Çelik', 'Diş Hekimi'), 
    ('Fatma Kara', 'Sigortacı'),
    ('Ali Vural', 'Emlak Danışmanı'), 
    ('Zeynep Sönmez', 'Diyetisyen'), 
    ('Mustafa Koç', 'Yazılım Uzmanı'), 
    ('Emine Yıldız', 'Grafik Tasarımcı'),
    ('Hüseyin Arslan', 'Mali Müşavir'), 
    ('Hatice Aydın', 'Organizasyon'), 
    ('İbrahim Can', 'Elektrik Mühendisi'), 
    ('Elif Polat', 'Güzellik Uzmanı'),
    ('Osman Turan', 'Oto Galeri'), 
    ('Özlem Şahin', 'Turizm Acentesi'), 
    ('Hakan Yavuz', 'Fotoğrafçı'), 
    ('Sibel Erdoğan', 'İç Mimar'),
    ('Burak Özdemir', 'Reklamcı'), 
    ('Esra Tekin', 'Psikolog'), 
    ('Cemil Aksoy', 'Matbaacı'), 
    ('Derya Kurt', 'Kuyumcu'),
    ('Metin Aslan', 'Güvenlik Sistemleri'), 
    ('Sevim Ünal', 'Catering'), 
    ('Volkan Çetin', 'Web Tasarımcı'), 
    ('Nurten İpek', 'Mobilyacı'),
    ('Serkan Taş', 'Veteriner'), 
    ('Berna Güler', 'Eczacı'), 
    ('Yusuf Acar', 'Gümrük Müşaviri'), 
    ('Aslı Öztürk', 'Çevirmen'),
    ('Gökhan Baş', 'Klima Servisi'), 
    ('Pınar Doğan', 'Yoga Eğitmeni');

    -- Insert 30 members
    -- Emails will be generated based on profession (e.g. avukat@demo.com)
    INSERT INTO users (email, name, profession, city, phone, password_hash, role)
    SELECT 
        lower(replace(translate(profession, 'ğüşıöçĞÜŞİÖÇ', 'gusiocGUSIOC'), ' ', '')) || '@demo.com',
        name,
        profession,
        'İstanbul',
        '555' || floor(random() * 8999999 + 1000000)::text,
        p_hash,
        'MEMBER'
    FROM temp_new_users
    ON CONFLICT (email) DO NOTHING;

    -- Add 30 members to the group
    INSERT INTO group_members (user_id, group_id, status)
    SELECT u.id, grp_id, 'ACTIVE'
    FROM users u
    JOIN temp_new_users t ON u.profession = t.profession
    WHERE u.email LIKE '%@demo.com' AND u.email <> 'member@demo.com'
    AND NOT EXISTS (
        SELECT 1 FROM group_members gm_check 
        JOIN users u_check ON gm_check.user_id = u_check.id 
        WHERE gm_check.group_id = grp_id 
        AND gm_check.status = 'ACTIVE' 
        AND u_check.profession = u.profession
    )
    ON CONFLICT (user_id, group_id) DO NOTHING;

    -- Cleanup
    DROP TABLE temp_new_users;
    
    RAISE NOTICE 'Seed completed: member@demo.com + 30 professionals added to Liderler Global.';
END $$;
