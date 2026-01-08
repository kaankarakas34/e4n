import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Load mail config
const getConfig = () => {
    try {
        const configPath = path.join(__dirname, '../email-config.json');
        const raw = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Config loading failed:', e);
        return null;
    }
};

app.post('/send-email', async (req, res) => {
    const config = getConfig();
    if (!config) {
        return res.status(500).json({ error: 'Email configuration not found or invalid' });
    }

    const { to, subject, html, text } = req.body;

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure, // true for 465, false for other ports
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: config.from || config.user,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Email server running on http://localhost:${PORT}`);
});
