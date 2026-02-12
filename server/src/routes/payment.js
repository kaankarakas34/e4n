import express from 'express';
import crypto from 'crypto';
import microtime from 'microtime';
import nodeBase64 from 'nodejs-base64-converter';
import fetch from 'node-fetch';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// PayTR Credentials - These should be in your .env file
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || '547057';
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || 'x3wnj45GMRGWMPCF';
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || 'tiuh7TNBHXref2sH';

// Endpoint to get PayTR iframe token
router.post('/get-token', authenticateToken, async (req, res) => {
    try {
        if (!MERCHANT_KEY || !MERCHANT_SALT) {
            return res.status(500).json({ error: 'PayTR Merchant Key or Salt is missing in server configuration.' });
        }

        let { user_basket, payment_amount, amount, user_ip, user_name, user_address, user_phone, user_email, debug_on, test_mode, plan } = req.body;

        // 1. IP Address handling
        if (!user_ip) {
            user_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            // Handle ::1 or similar local IPs if needed, but PayTR requires IPv4 usually.
            if (user_ip === '::1') user_ip = '127.0.0.1';
            // If x-forwarded-for has multiple, take the first one
            if (user_ip && user_ip.indexOf(',') > -1) {
                user_ip = user_ip.split(',')[0].trim();
            }
        }

        // 2. Email handling
        if (!user_email && req.user) {
            user_email = req.user.email;
        }

        // 3. Amount handling
        // Frontend sends 'amount' in TL (e.g., 12000). PayTR expects cents (1200000).
        let finalAmount = payment_amount || amount;
        if (!finalAmount) return res.status(400).json({ error: 'Amount is required' });
        // Ensure it's integer
        finalAmount = Math.round(parseFloat(finalAmount) * 100);

        // 4. Basket handling
        if (!user_basket && plan) {
            // Construct basket based on plan
            // We can look up standard plans or just use the plan ID as name
            // user_basket format: [['Product Name', 'Price', Quantity], ...]
            // Price here should be unitary price? Guide example: "18.00".
            // It seems PayTR basket price is string '18.00'.
            // Let's use the amount directly.
            // Note: The basket total must match payment_amount? 
            // Guide says: "Sepet içeriği...". Usually sum of basket should match total.
            // Let's use the finalAmount / 100 as price.
            const priceStr = (finalAmount / 100).toFixed(2);
            user_basket = [[`Uyelik Paketi - ${plan}`, priceStr, 1]];
        }

        if (!user_basket) {
            // Fallback
            const priceStr = (finalAmount / 100).toFixed(2);
            user_basket = [['Genel Odenen Tutar', priceStr, 1]];
        }

        // 5. User Info Fallback
        if (!user_name && req.user) user_name = req.user.name;
        if (!user_phone && req.user) user_phone = req.user.phone;
        if (!user_address) user_address = 'Adres bilgisi girilmemis';

        const merchant_oid = "IN" + microtime.now(); // Unique Order ID
        const max_installment = '0'; // Installment limit (0 = max allowed)
        const no_installment = '0'; // 0 = Installment allowed, 1 = No installment
        const currency = 'TL';
        const lang = 'tr';

        // URLs - Adjust these based on your frontend deployment
        // In development: http://localhost:5173/payment/success
        // In production: https://yourdomain.com/payment/success
        const merchant_ok_url = process.env.PAYTR_SUCCESS_URL || 'http://localhost:5173/payment/success';
        const merchant_fail_url = process.env.PAYTR_FAIL_URL || 'http://localhost:5173/payment/fail';

        // Timeout (min)
        const timeout_limit = 30;

        // Encode basket
        // expected format for user_basket: [['Product Name', 'Price', Quantity], ...]
        // The API expects JSON stringified then Base64 encoded
        const basketStr = JSON.stringify(user_basket);
        const user_basket_encoded = nodeBase64.encode(basketStr);

        // Generate Hash
        // Formula: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
        const hashSTR = `${MERCHANT_ID}${user_ip}${merchant_oid}${user_email}${finalAmount}${user_basket_encoded}${no_installment}${max_installment}${currency}${test_mode || 0}`;
        const paytr_token = hashSTR + MERCHANT_SALT;
        const token = crypto.createHmac('sha256', MERCHANT_KEY).update(paytr_token).digest('base64');

        // Request options
        const formData = new URLSearchParams();
        formData.append('merchant_id', MERCHANT_ID);
        formData.append('user_ip', user_ip);
        formData.append('merchant_oid', merchant_oid);
        formData.append('email', user_email);
        formData.append('payment_amount', finalAmount); // Int
        formData.append('paytr_token', token);
        formData.append('user_basket', user_basket_encoded);
        formData.append('debug_on', debug_on || 1);
        formData.append('no_installment', no_installment);
        formData.append('max_installment', max_installment);
        formData.append('user_name', user_name);
        formData.append('user_address', user_address);
        formData.append('user_phone', user_phone);
        formData.append('merchant_ok_url', merchant_ok_url);
        formData.append('merchant_fail_url', merchant_fail_url);
        formData.append('timeout_limit', timeout_limit);
        formData.append('currency', currency);
        formData.append('test_mode', test_mode || 0);
        formData.append('lang', lang);

        const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Save initial transaction to DB
            try {
                // Ensure plan is stored
                const planId = plan || 'UNKNOWN';
                await pool.query(
                    `INSERT INTO payment_transactions (merchant_oid, user_id, amount, status, plan_id) VALUES ($1, $2, $3, 'PENDING', $4)`,
                    [merchant_oid, req.user.id, finalAmount / 100, planId]
                );
            } catch (dbError) {
                console.error('Failed to save transaction:', dbError);
                // We don't block the payment flow if DB fails, but it's risky. 
                // Alternatively, we can return error.
            }

            res.json({ status: 'success', token: data.token, merchant_oid });
        } else {
            console.error('PayTR Error:', data.reason);
            res.status(400).json({ status: 'failed', reason: data.reason });
        }

    } catch (error) {
        console.error('Payment Token Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PayTR Callback (Notification URL)
router.post('/callback', async (req, res) => {
    // This endpoint is called by PayTR
    try {
        const { merchant_oid, status, total_amount, hash } = req.body;

        if (!hash) {
            return res.status(400).send('No hash provided');
        }

        // Validate Hash
        // Formula: merchant_oid + merchant_salt + status + total_amount
        const generatedTokenStr = `${merchant_oid}${MERCHANT_SALT}${status}${total_amount}`;
        const generatedToken = crypto.createHmac('sha256', MERCHANT_KEY).update(generatedTokenStr).digest('base64');

        if (generatedToken !== hash) {
            console.error('PayTR Callback Hash Mismatch');
            return res.status(400).send('PAYTR notification failed: bad hash');
        }

        if (status === 'success') {
            // Check if already processed
            const existing = await pool.query('SELECT status, user_id, plan_id FROM payment_transactions WHERE merchant_oid = $1', [merchant_oid]);

            if (existing.rows.length === 0) {
                console.error('Transaction not found for OID:', merchant_oid);
                return res.send('OK'); // Still return OK to stop PayTR form retrying
            }

            const transaction = existing.rows[0];

            if (transaction.status === 'COMPLETED') {
                console.log('Transaction already completed:', merchant_oid);
                return res.send('OK');
            }

            // Payment Successful
            await pool.query(
                `UPDATE payment_transactions SET status = 'COMPLETED', updated_at = NOW() WHERE merchant_oid = $1`,
                [merchant_oid]
            );

            // Update user subscription
            const userId = transaction.user_id;
            const planId = transaction.plan_id;
            let monthsToAdd = 0;
            if (planId === '4_MONTHS') monthsToAdd = 4;
            else if (planId === '8_MONTHS') monthsToAdd = 8;
            else if (planId === '12_MONTHS') monthsToAdd = 12;

            if (monthsToAdd > 0) {
                // Get current end date
                const userRes = await pool.query('SELECT subscription_end_date FROM users WHERE id = $1', [userId]);
                const currentUser = userRes.rows[0];
                let newEndDate = new Date();

                if (currentUser && currentUser.subscription_end_date && new Date(currentUser.subscription_end_date) > new Date()) {
                    newEndDate = new Date(currentUser.subscription_end_date);
                }

                newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

                await pool.query(
                    "UPDATE users SET account_status = 'ACTIVE', subscription_plan = $1, subscription_end_date = $2 WHERE id = $3",
                    [planId, newEndDate, userId]
                );
                console.log(`User ${userId} subscription extended by ${monthsToAdd} months to ${newEndDate}`);
            } else {
                console.warn(`Unknown plan_id ${planId} for transaction ${merchant_oid}, defaulting to ACTIVE without extension logic.`);
                await pool.query("UPDATE users SET account_status = 'ACTIVE' WHERE id = $1", [userId]);
            }

        } else {
            // Payment Failed
            await pool.query(
                `UPDATE payment_transactions SET status = 'FAILED', updated_at = NOW() WHERE merchant_oid = $1`,
                [merchant_oid]
            );
        }

        // Must return 'OK'
        res.send('OK');

    } catch (error) {
        console.error('PayTR Callback Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
