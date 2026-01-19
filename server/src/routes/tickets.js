import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET all tickets
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = `
        SELECT t.*, u.name as user_name, u.email as user_email,
  (SELECT message FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE 1 = 1
  `;
        const params = [];

        if (req.user.role !== 'ADMIN') {
            query += ` AND t.user_id = $1`;
            params.push(req.user.id);
        }

        query += ` ORDER BY t.updated_at DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE ticket
router.post('/', authenticateToken, async (req, res) => {
    const { subject, message } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create Ticket
        const ticketRes = await client.query(
            `INSERT INTO tickets(user_id, subject, status) VALUES($1, $2, 'OPEN') RETURNING * `,
            [req.user.id, subject]
        );
        const ticketId = ticketRes.rows[0].id;

        // Create First Message
        await client.query(
            `INSERT INTO ticket_messages(ticket_id, sender_id, message) VALUES($1, $2, $3)`,
            [ticketId, req.user.id, message]
        );

        await client.query('COMMIT');
        res.status(201).json(ticketRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// GET ticket details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify access
        const ticketProp = await pool.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
        if (ticketProp.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        if (req.user.role !== 'ADMIN' && ticketProp.rows[0].user_id !== req.user.id) {
            return res.sendStatus(403);
        }

        const ticket = await pool.query(`
            SELECT t.*, u.name as user_name 
            FROM tickets t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.id = $1`,
            [id]
        );

        const messages = await pool.query(`
            SELECT tm.*, u.name as sender_name, u.role as sender_role
            FROM ticket_messages tm
            JOIN users u ON tm.sender_id = u.id
            WHERE tm.ticket_id = $1
            ORDER BY tm.created_at ASC`,
            [id]
        );

        res.json({ ticket: ticket.rows[0], messages: messages.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// REPLY to ticket
router.post('/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    try {
        // Verify access
        const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        if (req.user.role !== 'ADMIN' && ticketRes.rows[0].user_id !== req.user.id) {
            return res.sendStatus(403);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO ticket_messages(ticket_id, sender_id, message) VALUES($1, $2, $3)`,
                [id, req.user.id, message]
            );

            // Update status
            const newStatus = req.user.role === 'ADMIN' ? 'ANSWERED' : 'OPEN';
            await client.query(
                `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
                [newStatus, id]
            );

            await client.query('COMMIT');
            res.status(201).json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE ticket status
router.put('/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { status } = req.body;
    try {
        await pool.query('UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
