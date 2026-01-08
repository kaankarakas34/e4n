
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

async function updateMockScores() {
    const client = await pool.connect();
    try {
        console.log('--- Updating Mock Scores for Color Variety ---');

        // 1. Get Liderler Global group members
        const groupRes = await client.query("SELECT id FROM groups WHERE name = 'Liderler Global'");
        if (groupRes.rows.length === 0) return console.log('Group not found');
        const groupId = groupRes.rows[0].id;

        const membersRes = await client.query("SELECT user_id FROM group_members WHERE group_id = $1", [groupId]);
        const memberIds = membersRes.rows.map(r => r.user_id);

        // 2. Distribute scores randomly for demo
        for (const userId of memberIds) {
            const randomScore = Math.floor(Math.random() * 100);
            let color = 'GREY';
            if (randomScore >= 70) color = 'GREEN';
            else if (randomScore >= 50) color = 'YELLOW';
            else if (randomScore >= 30) color = 'RED';

            await client.query(
                "UPDATE users SET performance_score = $1, performance_color = $2 WHERE id = $3",
                [randomScore, color, userId]
            );
            console.log(`User ${userId.slice(0, 5)}... updated to ${randomScore} (${color})`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

updateMockScores();
