
-- Find the user ID for member@demo.com
DO $$
DECLARE
    target_user_id UUID;
    pt1_id UUID;
    pt2_id UUID;
    pt3_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM users WHERE email = 'member@demo.com';

    -- If user doesn't exist, we can't proceed, but assuming it exists from previous steps
    IF target_user_id IS NOT NULL THEN
        -- Get IDs for 3 specific power teams
        SELECT id INTO pt1_id FROM power_teams WHERE name = 'İnşaat ve Gayrimenkul' LIMIT 1;
        SELECT id INTO pt2_id FROM power_teams WHERE name = 'Dijital ve Teknoloji' LIMIT 1;
        SELECT id INTO pt3_id FROM power_teams WHERE name = 'Finans ve Hukuk' LIMIT 1;

        -- Insert memberships
        INSERT INTO power_team_members (user_id, power_team_id, status)
        VALUES (target_user_id, pt1_id, 'ACTIVE')
        ON CONFLICT DO NOTHING;

        INSERT INTO power_team_members (user_id, power_team_id, status)
        VALUES (target_user_id, pt2_id, 'ACTIVE')
        ON CONFLICT DO NOTHING;

        INSERT INTO power_team_members (user_id, power_team_id, status)
        VALUES (target_user_id, pt3_id, 'ACTIVE')
        ON CONFLICT DO NOTHING;

        -- Also ensure there are some OTHER members in these power teams so the list isn't empty
        -- Let's add 'ali.can@example.com' to pt1
        INSERT INTO power_team_members (user_id, power_team_id, status)
        SELECT id, pt1_id, 'ACTIVE' FROM users WHERE email = 'ali.can@example.com'
        ON CONFLICT DO NOTHING;
        
        -- Add 'ayse.kaya@example.com' to pt2
        INSERT INTO power_team_members (user_id, power_team_id, status)
        SELECT id, pt2_id, 'ACTIVE' FROM users WHERE email = 'ayse.kaya@example.com'
        ON CONFLICT DO NOTHING;

         -- Add 'mehmet.oz@example.com' to pt3
        INSERT INTO power_team_members (user_id, power_team_id, status)
        SELECT id, pt3_id, 'ACTIVE' FROM users WHERE email = 'mehmet.oz@example.com'
        ON CONFLICT DO NOTHING;

    END IF;
END $$;
