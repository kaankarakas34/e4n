import 'dotenv/config';
import nodemailer from 'nodemailer';

const user = process.env.SMTP_USER || 'info@event4network.com';
const pass = process.env.SMTP_PASS || 'your_smtp_password_here';
const host = process.env.SMTP_HOST || 'mail.kurumsaleposta.com';
const to = process.env.TEST_EMAIL_TO || 'test@example.com';

async function testConfig(port, secure) {
    console.log(`\nTesting ${host}:${port} (Secure: ${secure})...`);
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for 587
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        console.log(`✅ CONNECTION SUCCESS: Port ${port} is working!`);

        try {
            const info = await transporter.sendMail({
                from: `"Event 4 Network Test" <${user}>`,
                to,
                subject: `SMTP Test Port ${port}`,
                text: 'Working!'
            });
            console.log(`📧 Mail Sent! MessageID: ${info.messageId}`);
            return true;
        } catch (sendErr) {
            console.error(`❌ Connection Good, SEND Failed:`, sendErr.message);
            return false;
        }

    } catch (err) {
        console.error(`❌ CONNECTION FAILED: Port ${port} - ${err.message}`);
        return false;
    }
}

async function run() {
    console.log("--- Starting SMTP Diagnostic ---");

    // Test 1: Port 587 (Standard Submission)
    const res587 = await testConfig(587, false);

    // Test 2: Port 465 (SMTPS)
    const res465 = await testConfig(465, true);

    // Test 3: Port 587 (Force Secure - Unusual but possible)
    // await testConfig(587, true);
}

run();
