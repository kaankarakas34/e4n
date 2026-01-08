import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
});

const groups = [
    { name: 'Liderler Global' },
    { name: 'Vizyonerler' },
    { name: 'Girişimciler' },
    { name: 'Anadolu Kaplanları' },
    { name: 'Avrasya' },
    { name: 'Boğaziçi' },
    { name: 'Marmara' },
    { name: 'Ege İncisi' },
    { name: 'Başkent' },
    { name: 'Akdeniz' },
];

const powerTeams = [
    { name: 'İnşaat Power Team' },
    { name: 'Sağlık Power Team' },
    { name: 'Bilişim Power Team' },
    { name: 'Hukuk Power Team' },
    { name: 'Finans Power Team' },
    { name: 'Eğitim Power Team' },
    { name: 'Gayrimenkul Power Team' },
    { name: 'Otomotiv Power Team' },
    { name: 'Tekstil Power Team' },
    { name: 'Turizm Power Team' },
    { name: 'Reklam & Medya Power Team' },
    { name: 'Lojistik Power Team' },
    { name: 'Enerji Power Team' },
    { name: 'Gıda Power Team' },
    { name: 'Kozmetik Power Team' },
    { name: 'Danışmanlık Power Team' },
    { name: 'Mobilya Power Team' },
    { name: 'Sigorta Power Team' },
    { name: 'Organizasyon Power Team' },
    { name: 'Sanayi Power Team' },
];

const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Zeynep', 'Ali', 'Emre', 'Can', 'Burak', 'Elif', 'Selin', 'Cem', 'Deniz', 'Hakan', 'Serkan', 'Gökhan', 'Esra', 'Gamze', 'Derya', 'Okan', 'Pelin', 'Sinem', 'Kaan', 'Mert'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öz', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Erdoğan', 'Yıldız', 'Aydın', 'Bulut', 'Keskin', 'Yanal', 'Ekinci'];
const professions = [
    'Mimar', 'İnşaat Mühendisi', 'Makine Mühendisi', 'Elektrik Mühendisi', 'Yazılım Mühendisi',
    'Doktor', 'Diş Hekimi', 'Diyetisyen', 'Psikolog', 'Fizyoterapist',
    'Avukat', 'Arabulucu', 'Mali Müşavir', 'Bağımsız Denetçi', 'Sigorta Acentesi',
    'Gayrimenkul Danışmanı', 'Şehir Plancısı', 'İç Mimar', 'Peyzaj Mimarı',
    'Grafik Tasarımcı', 'Web Tasarımcı', 'UX/UI Tasarımcı', 'Sosyal Medya Uzmanı', 'Dijital Pazarlamacı',
    'Reklamcı', 'Halkla İlişkiler Uzmanı', 'Etkinlik Organizatörü', 'Fotoğrafçı', 'Video Editörü',
    'Yönetmen', 'Senarist', 'Yazar', 'Çevirmen', 'Yayıncı',
    'Lojistik Uzmanı', 'Gümrük Müşaviri', 'Dış Ticaret Uzmanı', 'Satın Alma Müdürü',
    'İnsan Kaynakları Uzmanı', 'Eğitim Koçu', 'Yönetim Danışmanı', 'Kariyer Danışmanı',
    'Veteriner Hekim', 'Ziraat Mühendisi', 'Gıda Mühendisi', 'Kimyager',
    'Otel İşletmecisi', 'Seyahat Acentesi', 'Restoran İşletmecisi', 'Şef',
    'Bankacı', 'Yatırım Danışmanı', 'Finansal Analist', 'Vergi Uzmanı',
    'Otomotiv Bayisi', 'Tekstil Üreticisi', 'Mobilya Üreticisi', 'Matbaacı', 'Ambalaj Üreticisi'
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Starting seed...');

        // Clear existing data
        await client.query('TRUNCATE users, groups, group_members, power_teams, power_team_members, referrals, attendance, visitors, one_to_ones CASCADE');
        console.log('Cleared existing tables.');

        // 1. Insert Groups
        const groupMap = {};
        for (const g of groups) {
            const res = await client.query('INSERT INTO groups (name, status) VALUES ($1, $2) RETURNING id', [g.name, 'ACTIVE']);
            groupMap[g.name] = res.rows[0].id;
        }
        console.log(`Inserted ${groups.length} groups.`);

        // 2. Insert Power Teams
        const ptMap = {};
        for (const pt of powerTeams) {
            const res = await client.query('INSERT INTO power_teams (name) VALUES ($1) RETURNING id', [pt.name]);
            ptMap[pt.name] = res.rows[0].id;
        }
        console.log(`Inserted ${powerTeams.length} power teams.`);

        // 3. Generate Members (30-40 per group, unique professions)
        const userIds = [];
        const passwordHash = await bcrypt.hash('password123', 10);

        // --- Create Demo Users ---
        // 1. Admin
        const adminRes = await client.query(`
            INSERT INTO users (email, password_hash, name, profession, city, role, performance_score, performance_color, created_at)
            VALUES ($1, $2, 'Admin Demo', 'Yönetici', 'İstanbul', 'ADMIN', 100, 'GREEN', NOW()) RETURNING id
        `, ['admin@demo.com', passwordHash]);
        userIds.push(adminRes.rows[0].id);

        // 2. Member
        const memRes = await client.query(`
            INSERT INTO users (email, password_hash, name, profession, city, role, performance_score, performance_color, created_at)
            VALUES ($1, $2, 'Üye Demo', 'Yazılımcı', 'İstanbul', 'MEMBER', 85, 'GREEN', NOW()) RETURNING id
        `, ['member@demo.com', passwordHash]);
        userIds.push(memRes.rows[0].id);

        // 3. President
        const presRes = await client.query(`
            INSERT INTO users (email, password_hash, name, profession, city, role, performance_score, performance_color, created_at)
            VALUES ($1, $2, 'Başkan Demo', 'Mimar', 'İstanbul', 'PRESIDENT', 95, 'GREEN', NOW()) RETURNING id
        `, ['president@demo.com', passwordHash]);
        userIds.push(presRes.rows[0].id);

        const groupKeys = Object.keys(groupMap);
        const ptKeys = Object.keys(ptMap);
        const firstGroupId = groupMap[groupKeys[0]];

        // Assign Admin (Optional, usually Admin is global, but add to group for visibility)
        await client.query("INSERT INTO group_members (group_id, user_id, status, joined_at) VALUES ($1, $2, 'ACTIVE', NOW())", [firstGroupId, adminRes.rows[0].id]);

        // Assign Member
        await client.query("INSERT INTO group_members (group_id, user_id, status, joined_at) VALUES ($1, $2, 'ACTIVE', NOW())", [firstGroupId, memRes.rows[0].id]);

        // Assign President (Role in User table is PRESIDENT, maybe also need to be reflected logic-wise, but group_members is enough for query)
        await client.query("INSERT INTO group_members (group_id, user_id, status, joined_at) VALUES ($1, $2, 'ACTIVE', NOW())", [firstGroupId, presRes.rows[0].id]);

        let memberCount = 0;

        for (const groupName of groupKeys) {
            const groupId = groupMap[groupName];

            // Randomly decide target member count for this group (30 to 40)
            const targetCount = Math.floor(Math.random() * 11) + 30; // 30 to 40

            // Shuffle professions and pick targetCount items
            const groupProfessions = [...professions].sort(() => 0.5 - Math.random()).slice(0, targetCount);

            for (const profession of groupProfessions) {
                memberCount++;
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const email = `member${memberCount}@example.com`;

                // Insert User
                const userRes = await client.query(`
                INSERT INTO users (email, password_hash, name, profession, city, performance_score, performance_color, created_at)
                VALUES ($1, $2, $3, $4, 'İstanbul', $5, $6, NOW()) RETURNING id
            `, [email, passwordHash, `${firstName} ${lastName}`, profession, Math.floor(Math.random() * 100), 'GREY']);

                const userId = userRes.rows[0].id;
                userIds.push(userId);

                // Add to Group
                await client.query(`
                INSERT INTO group_members (group_id, user_id, status, joined_at)
                VALUES ($1, $2, 'ACTIVE', NOW())
            `, [groupId, userId]);

                // Assign Roles (First person is President, second VP, etc.)
                // We can just randomize or pick specifically, but let's leave default MEMBER for now except maybe updates

                // 20% Chance for Power Team
                if (Math.random() < 0.2) {
                    const randomPT = ptKeys[Math.floor(Math.random() * ptKeys.length)];
                    await client.query(`
                    INSERT INTO power_team_members (power_team_id, user_id, status, joined_at)
                    VALUES ($1, $2, 'ACTIVE', NOW())
                `, [ptMap[randomPT], userId]);
                }
            }
        }
        console.log(`Inserted ${memberCount} members and assigned to groups.`);

        // 4. Create Referrals (Random)
        // Create 300 random referrals
        for (let i = 0; i < 300; i++) {
            const giver = userIds[Math.floor(Math.random() * userIds.length)];
            let receiver = userIds[Math.floor(Math.random() * userIds.length)];
            while (receiver === giver) receiver = userIds[Math.floor(Math.random() * userIds.length)];

            const status = Math.random() > 0.3 ? 'SUCCESSFUL' : 'PENDING';
            const amount = status === 'SUCCESSFUL' ? Math.floor(Math.random() * 50000) + 1000 : 0;

            await client.query(`
            INSERT INTO referrals (giver_id, receiver_id, type, temperature, status, amount, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'İş yönlendirmesi açıklaması', NOW() - (random() * interval '90 days'))
        `, [giver, receiver, Math.random() > 0.5 ? 'INTERNAL' : 'EXTERNAL', Math.random() > 0.5 ? 'HOT' : 'WARM', status, amount]);
        }
        console.log('Inserted 300 referrals.');

        // 5. Create Attendance (Random for last 4 meetings of each group)
        // Assume we have meetings? No, let's create meetings first.
        // Insert Events (Meetings)
        for (const groupName of groupKeys) {
            const groupId = groupMap[groupName];
            // Create 4 past weekly meetings
            for (let i = 1; i <= 4; i++) {
                const meetingDate = new Date();
                meetingDate.setDate(meetingDate.getDate() - (i * 7));

                // Create Event
                const eventRes = await client.query(`
                INSERT INTO events (title, description, start_at, end_at, location, type, group_id, created_by)
                VALUES ($1, 'Haftalık olağan toplantı', $2, $3, 'Online', 'meeting', $4, $5) RETURNING id
             `, [`${groupName} ${i}. Toplantı`, meetingDate, meetingDate, groupId, userIds[0]]);

                const eventId = eventRes.rows[0].id;

                // Get Group Members
                const membersRes = await client.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId]);

                // 90% Attendance
                for (const m of membersRes.rows) {
                    const status = Math.random() > 0.1 ? 'PRESENT' : (Math.random() > 0.5 ? 'ABSENT' : 'LATE');
                    await client.query(`
                    INSERT INTO attendance (event_id, user_id, status, created_at)
                    VALUES ($1, $2, $3, $4)
                 `, [eventId, m.user_id, status, meetingDate]);
                }
            }
        }
        console.log('Inserted meetings and attendance records.');

        console.log('Seed completed successfully!');
    } catch (e) {
        console.error('Seed failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
