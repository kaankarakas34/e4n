/* --- SUPPORT TICKETS ENDPOINTS --- */

app.get('/api/tickets', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT t.*, 
                   (SELECT message FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM tickets t 
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role !== 'ADMIN') {
            query += ` AND user_id = $1`;
            params.push(req.user.id);
        }

        query += ` ORDER BY updated_at DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error('Error fetching tickets:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
    const { subject, message } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create Ticket
        const ticketRes = await client.query(
            `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'OPEN') RETURNING id`,
            [req.user.id, subject]
        );
        const ticketId = ticketRes.rows[0].id;

        // 2. Add Initial Message
        await client.query(
            `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)`,
            [ticketId, req.user.id, message]
        );

        await client.query('COMMIT');
        res.status(201).json({ id: ticketId, subject, status: 'OPEN' });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error creating ticket:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Check access
        const ticketRes = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
        if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        const ticket = ticketRes.rows[0];
        if (req.user.role !== 'ADMIN' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get details with messages
        const messagesRes = await pool.query(`
            SELECT tm.*, u.name as sender_name, u.role as sender_role
            FROM ticket_messages tm
            JOIN users u ON tm.sender_id = u.id
            WHERE tm.ticket_id = $1
            ORDER BY tm.created_at ASC
        `, [id]);

        res.json({
            ticket: ticket,
            messages: messagesRes.rows
        });
    } catch (e) {
        console.error('Error fetching ticket details:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    try {
        // Check ticket existence and access
        const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        const ticket = ticketRes.rows[0];
        if (req.user.role !== 'ADMIN' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Insert message
        const result = await pool.query(
            `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *`,
            [id, req.user.id, message]
        );

        // Update ticket status/updated_at
        let newStatus = ticket.status;
        if (req.user.role === 'ADMIN') {
            newStatus = 'ANSWERED';
        } else if (ticket.status === 'ANSWERED') {
            newStatus = 'OPEN'; // Re-open if user replies
        }

        await pool.query(
            `UPDATE tickets SET updated_at = NOW(), status = $1 WHERE id = $2`,
            [newStatus, id]
        );

        res.status(201).json(result.rows[0]);
    } catch (e) {
        console.error('Error sending message:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
    // Only Admin or Ticket Owner can close? Usually Admin. Let's allow owner to close too.
    const { id } = req.params;
    const { status } = req.body; // 'CLOSED' or 'OPEN'

    try {
        const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        const ticket = ticketRes.rows[0];
        if (req.user.role !== 'ADMIN' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query('UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error updating status:', e);
        res.status(500).json({ error: e.message });
    }
});
