import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get My Attendance
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.*, e.title as event_title, e.start_at 
       FROM attendance a JOIN events e ON a.event_id = e.id 
       WHERE a.user_id = $1 ORDER BY e.start_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get User Attendance (Admin or Profile Viewer perhaps?)
// originally: app.get('/api/users/:id/attendance', ...)
// I can put this here as `/:userId`?
// But `users.js` handles `/api/users/:id`.
// If I use `attendance.js` mounted at `/api/attendance`, I can't easily capture `/api/users/:id/attendance`.
// So that specific endpoint should go to `users.js` or `admin.js`?
// In `users.js` I didn't put it.
// Let's add it to `users.js` later or create `attendance.js` for `/api/items`.

// I will keep `attendance.js` only for `/api/attendance`.
// `/api/users/:id/attendance` should logically be in `users.js`.

export default router;
