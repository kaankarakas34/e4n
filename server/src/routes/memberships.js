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
        { id: '1_MONTH', name: 'Aylık Üyelik', price: 7200, net_price: 6000, duration_months: 1 },
        { id: '6_MONTHS', name: '6 Aylık Üyelik', price: 39000, net_price: 32500, duration_months: 6 },
        { id: '12_MONTHS', name: '12 Aylık Üyelik', price: 69000, net_price: 57500, duration_months: 12 }
    ];
    res.json(plans);
});

export default router;
