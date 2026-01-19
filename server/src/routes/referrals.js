import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { calculateMemberScore } from '../utils/scoring.js';

const router = express.Router();

// Get My Referrals (Received or Given)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT r.*, u.name as receiver_name, u.profession 
       FROM referrals r JOIN users u ON r.receiver_id = u.id 
       WHERE r.giver_id = $1 OR r.receiver_id = $1 
       ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Referral
router.post('/', authenticateToken, async (req, res) => {
    const { receiverId, type, temperature, description, amount } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO referrals(giver_id, receiver_id, type, temperature, status, description, amount)
    VALUES($1, $2, $3, $4, 'PENDING', $5, $6) RETURNING * `,
            [req.user.id, receiverId, type, temperature, description, amount]
        );
        // Recalculate Score
        await calculateMemberScore(req.user.id);

        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Referral (Status/Amount/Notes)
router.put('/:id', authenticateToken, async (req, res) => {
    const { status, amount, notes } = req.body;
    const { id } = req.params;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check current referral
            const checkRes = await client.query('SELECT * FROM referrals WHERE id = $1', [id]);
            if (checkRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Referral not found' });
            }
            const referral = checkRes.rows[0];

            // 2. Validate Ciro Rule
            // "Elden ciro girilmediği sürece iş yönlendirmesi onaylanmamış olur"
            // If status is becoming 'SUCCESSFUL' (or checks related to approval), amount must be present.
            let newAmount = amount !== undefined ? amount : referral.amount;

            if (status === 'SUCCESSFUL') {
                if (!newAmount || parseFloat(newAmount) <= 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'İş yönlendirmesini onaylamak için ciro (tutar) girişi zorunludur.' });
                }
            }

            // 3. Update
            const { rows } = await client.query(`
        UPDATE referrals 
        SET status = COALESCE($1, status), 
            amount = COALESCE($2, amount),
            notes = COALESCE($3, notes),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [status, amount, notes, id]);

            await client.query('COMMIT');

            // 4. Recalculate Scores
            // Score affects the GIVER (who gave the referral)
            if (rows[0].giver_id) {
                await calculateMemberScore(rows[0].giver_id);
            }

            res.json(rows[0]);
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

export default router;
