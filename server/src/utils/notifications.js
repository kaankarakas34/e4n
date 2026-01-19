import pool from '../config/db.js';
import { sendEmail } from './email.js';

// Helper: Send Notification (DB + Email)
export const sendNotification = async (userId, title, message) => {
    console.log(`[NOTIFICATION] To: ${userId} | Subject: ${title} `);
    try {
        // 1. Insert In-App Notification
        await pool.query(
            `INSERT INTO notifications(user_id, type, content, is_read) VALUES($1, 'SYSTEM', $2, false)`,
            [userId, `${title}: ${message} `]
        );

        // 2. Fetch User Email & Send
        const res = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (res.rows.length > 0 && res.rows[0].email) {
            await sendEmail(res.rows[0].email, title, `<p>${message}</p>`);
        }

    } catch (err) {
        console.error('Notification/Email failed', err);
    }
};
