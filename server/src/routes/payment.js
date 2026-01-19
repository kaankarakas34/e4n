import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to calculate end date based on fixed 4-month periods
const calculateFixedTermEndDate = (startDate, monthsToAdd) => {
    const currentYear = startDate.getFullYear();

    // Find current period end
    let currentMonth = startDate.getMonth();
    let termEndYear = currentYear;
    let termEndMonth;

    if (currentMonth <= 3) { termEndMonth = 3; } // Ends April
    else if (currentMonth <= 7) { termEndMonth = 7; } // Ends August
    else { termEndMonth = 11; } // Ends December

    let targetDate = new Date(termEndYear, termEndMonth + 1, 0); // Last day of term month
    const extraTerms = Math.max(0, (monthsToAdd / 4) - 1);

    if (extraTerms > 0) {
        for (let i = 0; i < extraTerms; i++) {
            if (termEndMonth === 3) { termEndMonth = 7; }
            else if (termEndMonth === 7) { termEndMonth = 11; }
            else {
                termEndMonth = 3;
                termEndYear++;
            }
        }
        targetDate = new Date(termEndYear, termEndMonth + 1, 0);
    }

    // Set time to end of day
    targetDate.setHours(23, 59, 59, 999);
    return targetDate;
};


router.post('/get-token', authenticateToken, async (req, res) => {
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    // Ensure table exists
    await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions(
    merchant_oid VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    plan_id VARCHAR(50),
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
  )
  `);

    if (!merchant_id) {
        console.warn('PAYTR credentials missing, using mock token for frontend demo');
        return res.json({ token: 'mock_token_' + Date.now() });
    }

    const { amount = 1000, currency = 'TL', installment = '0', user_address, user_phone, user_name, billing_info, plan } = req.body;

    // Create unique Order ID
    const merchant_oid = "PO" + Date.now() + Math.random().toString(36).substring(7);

    // SAVE TRANSACTION INTENT
    try {
        await pool.query(
            `INSERT INTO payment_transactions(merchant_oid, user_id, plan_id, amount, status) VALUES($1, $2, $3, $4, 'PENDING')`,
            [merchant_oid, req.user.id, plan || '12_MONTHS', amount]
        );
    } catch (e) {
        console.error('Failed to save transaction', e);
        return res.status(500).json({ error: 'Database error initiating payment' });
    }

    // Create basket item name
    const basketItemName = billing_info ? `Üyelik - ${billing_info.type === 'CORPORATE' ? billing_info.companyName : 'Bireysel'} ` : 'Yıllık Üyelik';

    const user_basket = Buffer.from(JSON.stringify([[basketItemName, amount.toString(), 1]])).toString('base64');
    const user_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const payment_amount = amount * 100;
    const debug_on = 1;
    const test_mode = 1;
    const merchant_ok_url = 'http://localhost:5173/payment/success';
    const merchant_fail_url = 'http://localhost:5173/payment/fail';
    const timeout_limit = 30;

    const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${req.user.email}${payment_amount}${user_basket}${installment}${installment}${currency}${test_mode} `;
    const paytr_token = hashSTR + merchant_salt;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    const formData = new URLSearchParams();
    formData.append('merchant_id', merchant_id);
    formData.append('merchant_key', merchant_key);
    formData.append('merchant_salt', merchant_salt);
    formData.append('email', req.user.email);
    formData.append('payment_amount', payment_amount);
    formData.append('merchant_oid', merchant_oid);
    formData.append('user_name', user_name || req.user.name || 'Member');
    formData.append('user_address', user_address || 'Istanbul, Turkey');
    formData.append('user_phone', user_phone || '05555555555');
    formData.append('merchant_ok_url', merchant_ok_url);
    formData.append('merchant_fail_url', merchant_fail_url);
    formData.append('user_basket', user_basket);
    formData.append('user_ip', user_ip);
    formData.append('timeout_limit', timeout_limit);
    formData.append('debug_on', debug_on);
    formData.append('test_mode', test_mode);
    formData.append('lang', 'tr');
    formData.append('no_installment', installment);
    formData.append('max_installment', '0');
    formData.append('currency', currency);
    formData.append('paytr_token', token);

    try {
        const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            res.json({ token: data.token });
        } else {
            console.error('PayTR Error:', data);
            res.status(400).json({ error: data.reason });
        }
    } catch (e) {
        console.error('PayTR Request Error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/callback', async (req, res) => {
    const callback = req.body;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;

    if (!merchant_salt || !merchant_key) return res.status(500).send('Config Error');

    const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    if (token != callback.hash) {
        return res.status(400).send('PAYTR notification failed: bad hash');
    }

    if (callback.status == 'success') {
        console.log('Payment Successful for OID:', callback.merchant_oid);

        // 1. Get Transaction Details
        const transRes = await pool.query('SELECT * FROM payment_transactions WHERE merchant_oid = $1', [callback.merchant_oid]);

        if (transRes.rows.length === 0) {
            console.error('Transaction not found for OID:', callback.merchant_oid);
            return res.send('OK');
        }

        const transaction = transRes.rows[0];
        const userId = transaction.user_id;
        const planId = transaction.plan_id;

        // 2. Calculate New End Date
        let months = 12;
        if (planId === '4_MONTHS') months = 4;
        if (planId === '8_MONTHS') months = 8;

        const newEndDate = calculateFixedTermEndDate(new Date(), months);

        // 3. Update User
        await pool.query(`
        UPDATE users 
        SET subscription_end_date = $1,
  subscription_plan = $2,
  account_status = 'ACTIVE',
  last_reminder_trigger = NULL
        WHERE id = $3
  `, [newEndDate, planId, userId]);

        // 4. Update Transaction Status
        await pool.query('UPDATE payment_transactions SET status = $1 WHERE merchant_oid = $2', ['SUCCESS', callback.merchant_oid]);

        console.log(`Updated user ${userId} subscription to ${newEndDate} `);

    } else {
        console.log('Payment Failed for OID:', callback.merchant_oid);
        await pool.query('UPDATE payment_transactions SET status = $1 WHERE merchant_oid = $2', ['FAILED', callback.merchant_oid]);
    }

    res.send('OK');
});

export default router;
