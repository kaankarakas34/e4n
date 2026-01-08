
import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
});

async function addSubstitutes() {
    const client = await pool.connect();
    try {
        console.log('--- Adding Dummy Substitutes ---');

        // 1. Get Group & Members
        const groupRes = await client.query("SELECT id FROM groups WHERE name = 'Liderler Global'");
        if (groupRes.rows.length === 0) return console.log('Group not found');
        const groupId = groupRes.rows[0].id;

        const membersRes = await client.query("SELECT user_id FROM group_members WHERE group_id = $1 LIMIT 5", [groupId]);
        const members = membersRes.rows;

        // 2. Get/Create Future Meetings for this group
        // If not enough events, create them or use existing ID '000...'? No, need real events linked to group
        // Let's create a future meeting event if none
        let eventRes = await client.query("SELECT id FROM events WHERE group_id = $1 AND start_at > NOW() LIMIT 1", [groupId]);
        let eventId;

        if (eventRes.rows.length === 0) {
            const newEvent = await client.query(`
                INSERT INTO events (title, start_at, created_by, type, group_id)
                VALUES ('Haftalık Toplantı (Gelecek)', NOW() + INTERVAL '5 days', $1, 'meeting', $2)
                RETURNING id`, [members[0].user_id, groupId]);
            eventId = newEvent.rows[0].id;
        } else {
            eventId = eventRes.rows[0].id;
        }

        // 3. Insert Attendance with SUBSTITUTE status
        // We use ON CONFLICT DO NOTHING to avoid duplicates if run multiple times
        const substitutes = [
            { name: 'Av. Kemal Yılmaz', user_id: members[0]?.user_id },
            { name: 'Dr. Selin Demir', user_id: members[1]?.user_id },
            { name: 'Mimar Canan Erkin', user_id: members[2]?.user_id },
            { name: 'Müh. Ahmet Kural', user_id: members[3]?.user_id },
            { name: 'Dt. Ozan Güven', user_id: members[4]?.user_id }
        ];

        for (const sub of substitutes) {
            if (!sub.user_id) continue;
            await client.query(`
                INSERT INTO attendance (event_id, user_id, status, substitute_name)
                VALUES ($1, $2, 'SUBSTITUTE', $3)
                ON CONFLICT (event_id, user_id) 
                DO UPDATE SET status = 'SUBSTITUTE', substitute_name = $3
            `, [eventId, sub.user_id, sub.name]);
            console.log(`Added substitute ${sub.name} for user ${sub.user_id}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

addSubstitutes();
