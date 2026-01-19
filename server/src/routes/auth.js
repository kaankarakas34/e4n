import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b';


router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, city, profession, kvkkConsent, marketingConsent, explicitConsent } = req.body;

        // Check existing
        const existing = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });

        // Handle Profession
        if (profession) {
            const profRes = await pool.query('SELECT id FROM professions WHERE LOWER(name) = LOWER($1)', [profession]);
            if (profRes.rows.length === 0) {
                await pool.query(
                    "INSERT INTO professions (name, category, status) VALUES ($1, 'Genel', 'PENDING') ON CONFLICT DO NOTHING",
                    [profession]
                );
            }
        }

        // Hash Password
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const { rows } = await pool.query(
            `INSERT INTO users (email, password_hash, name, profession, phone, company, kvkk_consent, marketing_consent, explicit_consent, consent_date, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'PENDING') RETURNING id, email, name, role`,
            [email, passwordHash, name, profession, phone, req.body.company || '', kvkkConsent || false, marketingConsent || false, explicitConsent || false]
        );
        res.status(201).json(rows[0]);
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: e.message });
    }
});

router.post('/create-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
            [token]
        );

        if (rows.length === 0) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş token.' });

        const user = rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, account_status = 'ACTIVE' WHERE id = $2",
            [hashedPassword, user.id]
        );

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        console.log('User found:', rows.length > 0 ? 'Yes' : 'No');
        if (rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        // Check for active group
        const { rows: groups } = await pool.query(
            `SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
            [user.id]
        );
        const chapterId = groups.length > 0 ? groups[0].group_id : null;

        // Check Subscription Status
        let accountStatus = user.account_status || 'ACTIVE';
        if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) {
            accountStatus = 'PASSIVE';
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, status: accountStatus }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, status: accountStatus }, chapterId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


export default router;
