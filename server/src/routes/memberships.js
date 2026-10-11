import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { membershipPrices, membershipNetPrices } from '../../../shared/membership-pricing.js';

const router = express.Router();

// Get Memberships (Plans)
router.get('/', authenticateToken, async (req, res) => {
    const plans = [
        { id: '4_MONTHS', name: '4 Aylık Üyelik (1 Shuffle Dönemi)', price: membershipPrices['4_MONTHS'], net_price: membershipNetPrices['4_MONTHS'], duration_months: 4 },
        { id: '8_MONTHS', name: '8 Aylık Üyelik (2 Shuffle Dönemi)', price: membershipPrices['8_MONTHS'], net_price: membershipNetPrices['8_MONTHS'], duration_months: 8 },
        { id: '12_MONTHS', name: '12 Aylık Üyelik (3 Shuffle Dönemi)', price: membershipPrices['12_MONTHS'], net_price: membershipNetPrices['12_MONTHS'], duration_months: 12 }
    ];
    res.json(plans);
});

export default router;
