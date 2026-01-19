import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { calculateMemberScore } from '../utils/scoring.js';

const router = express.Router();

// Get Events
router.get('/', async (req, res) => {
    const { type, group_id, limit, mode } = req.query;
    try {
        let query = `
        SELECT e.*, g.name as group_name 
        FROM events e 
        LEFT JOIN groups g ON e.group_id = g.id 
        WHERE 1=1 
      `;
        const params = [];
        let paramCount = 1;

        if (type) {
            query += ` AND e.type = $${paramCount} `;
            params.push(type);
            paramCount++;
        }
        if (group_id) {
            query += ` AND e.group_id = $${paramCount} `;
            params.push(group_id);
            paramCount++;
        }

        if (mode === 'admin') {
            // see all
            query += ' ORDER BY e.start_at DESC';
        } else {
            // Public/User View: Future events + Recent past?
            // Default: Start date > 2 weeks ago
            query += " AND start_at > NOW() - INTERVAL '14 days'";
            query += ' ORDER BY pinned DESC NULLS LAST, start_at ASC';
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message || String(e) });
    }
});

// Create Event
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, location, start_at, end_at, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status, pinned } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO events(title, description, location, start_at, end_at, created_by, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status, pinned)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING * `,
            [title, description, location, start_at, end_at, req.user.id, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status || 'DRAFT', pinned || false]
        );
        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit Attendance (Batch) -> This creates an event AND attendance
router.post('/attendance', authenticateToken, async (req, res) => {
    const { group_id, meeting_date, topic, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Event
        const eventRes = await client.query(`
      INSERT INTO events (group_id, title, start_at, type, status, description, created_by)
      VALUES ($1, $2, $3, 'meeting', 'PUBLISHED', 'Haftalık Toplantı', $4)
      RETURNING id
    `, [group_id, topic || 'Haftalık Toplantı', meeting_date, req.user.id]);
        const eventId = eventRes.rows[0].id;

        // 2. Insert Attendance
        if (items && Array.isArray(items)) {
            for (const item of items) {
                // item: { user_id, status }
                await client.query(`
          INSERT INTO attendance (event_id, user_id, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3
        `, [eventId, item.user_id, item.status]);
            }
        }

        await client.query('COMMIT');

        // 3. Recalculate Scores (Async)
        if (items && Array.isArray(items)) {
            Promise.all(items.map(i => calculateMemberScore(i.user_id))).catch(console.error);
        }

        res.json({ success: true, eventId });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Submit Attendance Error:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Update Event
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, location, start_at, end_at, is_public, type, group_id, has_equal_opportunity_badge, status, city, is_online, pinned } = req.body;

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (title !== undefined) { fields.push(`title = $${idx++} `); values.push(title); }
        if (description !== undefined) { fields.push(`description = $${idx++} `); values.push(description); }
        if (location !== undefined) { fields.push(`location = $${idx++} `); values.push(location); }
        if (start_at !== undefined) { fields.push(`start_at = $${idx++} `); values.push(start_at); }
        if (end_at !== undefined) { fields.push(`end_at = $${idx++} `); values.push(end_at); }
        if (is_public !== undefined) { fields.push(`is_public = $${idx++} `); values.push(is_public); }
        if (type !== undefined) { fields.push(`type = $${idx++} `); values.push(type); }
        if (group_id !== undefined) { fields.push(`group_id = $${idx++} `); values.push(group_id || null); }
        if (has_equal_opportunity_badge !== undefined) { fields.push(`has_equal_opportunity_badge = $${idx++} `); values.push(has_equal_opportunity_badge); }
        if (city !== undefined) { fields.push(`city = $${idx++} `); values.push(city); }
        if (is_online !== undefined) { fields.push(`is_online = $${idx++} `); values.push(is_online); }
        if (status !== undefined) { fields.push(`status = $${idx++} `); values.push(status); }
        if (pinned !== undefined) { fields.push(`pinned = $${idx++} `); values.push(pinned); }

        if (fields.length === 0) return res.json({ message: 'No changes' });

        values.push(id);
        const { rows } = await pool.query(
            `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING * `,
            values
        );
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Event
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Register / Join Event
router.post('/:id/register', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get Event Details
            const eventRes = await client.query('SELECT * FROM events WHERE id = $1', [eventId]);
            if (eventRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Event not found' });
            }
            const event = eventRes.rows[0];

            // 2. Check if already registered
            const attCheck = await client.query('SELECT * FROM attendance WHERE event_id = $1 AND user_id = $2', [eventId, req.user.id]);
            if (attCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Already registered' });
            }

            // 3. Equal Opportunity Check
            if (event.has_equal_opportunity_badge) {
                // Get user's profession
                const userRes = await client.query('SELECT profession FROM users WHERE id = $1', [req.user.id]);
                const userProfession = userRes.rows[0].profession;

                if (userProfession) {
                    // Check if any other attendee has the same profession
                    const conflictCheck = await client.query(`
                    SELECT 1 
                    FROM attendance a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.event_id = $1 AND u.profession = $2
      `, [eventId, userProfession]);

                    if (conflictCheck.rows.length > 0) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({
                            error: 'Equal Opportunity Restriction: Another member with your profession is already registered for this event.',
                            code: 'FE_RESTRICTION'
                        });
                    }
                }
            }

            // 4. Register (Insert Attendance)
            await client.query(`
            INSERT INTO attendance(event_id, user_id, status)
            VALUES($1, $2, 'PRESENT')-- 'PRESENT' as placeholder for registered / will attend
      `, [eventId, req.user.id]);

            await client.query('COMMIT');

            // Recalculate Score
            calculateMemberScore(req.user.id).catch(console.error);

            res.json({ success: true, message: 'Successfully registered' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// List Attendance (for Event)
router.get('/:id/attendance', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.*, u.name as member_name 
       FROM attendance a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.event_id = $1`,
            [req.params.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
