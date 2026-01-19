import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get Memberships (Plans)
router.get('/', authenticateToken, async (req, res) => {
    // This looks like static data or plans?
    // Based on user logic, membership usually refers to plans or user's status.
    // Let's assume plans.
    const plans = [
        { id: '4_MONTHS', name: '4 Aylık Üyelik', price: 9500, duration_months: 4 },
        { id: '8_MONTHS', name: '8 Aylık Üyelik', price: 19000, duration_months: 8 },
        { id: '12_MONTHS', name: '12 Aylık Üyelik', price: 28500, duration_months: 12 }
    ];
    res.json(plans);
});

export default router;
