import pool from '../config/db.js';

/* --- HELPER: SCORING ENGINE --- */
export const calculateMemberScore = async (userId) => {
    // Scoring Weights
    const SCORES = {
        ATTENDANCE: 10,
        ABSENT: -10,
        LATE: 5,
        SUBSTITUTE: 10,
        REFERRAL_INTERNAL: 10,
        REFERRAL_EXTERNAL: 5,
        VISITOR: 10,
        ONE_TO_ONE: 10,
        EDUCATION_UNIT: 0,
        SUCCESSFUL_BUSINESS: 5 // Ciro girişi
    };

    const client = await pool.connect();
    try {
        // 1. Attendance Score - Last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [attRes, refRes, visRes, otoRes, eduRes] = await Promise.all([
            client.query(`
            SELECT status, count(*) as count 
            FROM attendance 
            WHERE user_id = $1 AND created_at > $2
            GROUP BY status
        `, [userId, sixMonthsAgo]),
            client.query(`
            SELECT type, status, count(*) as count 
            FROM referrals 
            WHERE giver_id = $1 AND created_at > $2
            GROUP BY type, status
        `, [userId, sixMonthsAgo]),
            client.query(`
            SELECT count(*) as count 
            FROM visitors 
            WHERE inviter_id = $1 AND visited_at > $2 AND status IN ('ATTENDED', 'JOINED')
        `, [userId, sixMonthsAgo]),
            client.query(`
            SELECT count(*) as count 
            FROM one_to_ones 
            WHERE requester_id = $1 AND meeting_date > $2
        `, [userId, sixMonthsAgo]),
            client.query(`
            SELECT sum(hours) as total_hours 
            FROM education 
            WHERE user_id = $1 AND completed_date > $2
        `, [userId, sixMonthsAgo])
        ]);

        let score = 0;

        // 1. Attendance Processing
        attRes.rows.forEach(r => {
            if (r.status === 'PRESENT') score += (r.count * SCORES.ATTENDANCE);
            else if (r.status === 'ABSENT') score += (r.count * SCORES.ABSENT);
            else if (r.status === 'LATE') score += (r.count * SCORES.LATE);
            else if (r.status === 'SUBSTITUTE') score += (r.count * SCORES.SUBSTITUTE);
        });

        // 2. Referrals Processing
        refRes.rows.forEach(r => {
            // Base points for referral type
            if (r.type === 'INTERNAL') score += (r.count * SCORES.REFERRAL_INTERNAL);
            else if (r.type === 'EXTERNAL') score += (r.count * SCORES.REFERRAL_EXTERNAL);

            // Extra points for Successful Business (Ciro)
            if (r.status === 'SUCCESSFUL') {
                score += (r.count * SCORES.SUCCESSFUL_BUSINESS);
            }
        });

        // 3. Visitors Processing
        score += (parseInt(visRes.rows[0].count) * SCORES.VISITOR);

        // 4. One-to-Ones Processing
        score += (parseInt(otoRes.rows[0].count) * SCORES.ONE_TO_ONE);

        // 5. Education Processing
        score += (Math.floor(parseFloat(eduRes.rows[0].total_hours || 0)) * SCORES.EDUCATION_UNIT);

        // Normalize Score (0-100)
        const finalScore = Math.min(Math.max(score, 0), 100);

        // Determine Color
        let color = 'GREY';
        if (finalScore >= 70) color = 'GREEN';
        else if (finalScore >= 50) color = 'YELLOW';
        else if (finalScore >= 30) color = 'RED';
        else color = 'GREY';

        // Update User
        await client.query(`
            UPDATE users 
            SET performance_score = $1, performance_color = $2, updated_at = NOW() 
            WHERE id = $3
        `, [finalScore, color, userId]);

        // Record History
        await client.query(`
            INSERT INTO user_score_history (user_id, score, color) VALUES ($1, $2, $3)
        `, [userId, finalScore, color]);

        return { score: finalScore, color };

    } catch (e) {
        console.error('Scoring error:', e);
    } finally {
        client.release();
    }
};

export const calculateChampions = async (periodType, startDate, endDate) => {
    const client = await pool.connect();
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Most Referrals
        const refRes = await client.query(`
      SELECT giver_id as user_id, COUNT(*) as value
      FROM referrals
      WHERE created_at BETWEEN $1 AND $2 AND status = 'SUCCESSFUL'
      GROUP BY giver_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

        if (refRes.rows.length > 0) {
            await client.query(
                "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'REFERRAL_COUNT', $3, $4)",
                [periodType, today, refRes.rows[0].user_id, refRes.rows[0].value]
            );
        }

        // 2. Most Visitors
        const visRes = await client.query(`
      SELECT inviter_id as user_id, COUNT(*) as value
      FROM visitors
      WHERE visited_at BETWEEN $1 AND $2
      GROUP BY inviter_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

        if (visRes.rows.length > 0) {
            await client.query(
                "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'VISITOR_COUNT', $3, $4)",
                [periodType, today, visRes.rows[0].user_id, visRes.rows[0].value]
            );
        }

        // 3. Highest Revenue
        const revRes = await client.query(`
      SELECT giver_id as user_id, SUM(amount) as value
      FROM referrals
      WHERE created_at BETWEEN $1 AND $2 AND status = 'SUCCESSFUL'
      GROUP BY giver_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

        if (revRes.rows.length > 0) {
            await client.query(
                "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'REVENUE', $3, $4)",
                [periodType, today, revRes.rows[0].user_id, revRes.rows[0].value]
            );
        }

        console.log(`✅ Champions calculated for ${periodType}`);
    } catch (e) {
        console.error(`Error calculating champions for ${periodType}:`, e);
    } finally {
        client.release();
    }
};
