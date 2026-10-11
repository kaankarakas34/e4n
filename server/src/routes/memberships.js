import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { membershipPrices, membershipNetPrices } from '../../../shared/membership-pricing.js';

const router = express.Router();

// Get Memberships (Plans)
router.get('/', authenticateToken, async (req, res) => {
    const plans = [
        { id: '1_MONTH', name: 'Aylık Üyelik', price: membershipPrices['1_MONTH'], net_price: membershipNetPrices['1_MONTH'], duration_months: 1 },
        { id: '6_MONTHS', name: '6 Aylık Üyelik', price: membershipPrices['6_MONTHS'], net_price: membershipNetPrices['6_MONTHS'], duration_months: 6 },
        { id: '12_MONTHS', name: '12 Aylık Üyelik', price: membershipPrices['12_MONTHS'], net_price: membershipNetPrices['12_MONTHS'], duration_months: 12 }
    ];
    res.json(plans);
});

export default router;
