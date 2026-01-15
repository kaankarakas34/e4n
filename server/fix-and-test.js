import 'dotenv/config';
import pkg from 'pg';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const { Pool } = pkg;

// Taken from vercel.json
const connectionString = "postgres://postgres.kaoagsuxccwgrdydxros:vy%2F22xUZF3%2Fn8S8@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("--- Fixing SMTP Configuration ---");
        // 1. Force update the configuration to Port 587
        // We purposefully overwrite existing config to ensure it works
        await pool.query(`
            UPDATE email_configurations 
            SET smtp_port = 587, 
                smtp_host = 'mail.kurumsaleposta.com',
                smtp_user = 'info@event4network.com',
                smtp_pass = '4hr:b-eSM8_1:R5B',
                is_active = TRUE
        `);
        console.log("✅ Database Email Configuration updated to Port 587.");

        // 2. Setup Transporter
        const transporter = nodemailer.createTransport({
            host: 'mail.kurumsaleposta.com',
            port: 587,
            secure: false,
            auth: {
                user: 'info@event4network.com',
                pass: '4hr:b-eSM8_1:R5B'
            },
            tls: { rejectUnauthorized: false }
        });

        // 3. Send "First Test"
        console.log("\n--- Sending General Test Email ---");
        try {
            await transporter.sendMail({
                from: '"Event 4 Network" <info@event4network.com>',
                to: 'kaankarakas93@gmail.com',
                subject: 'SMTP Bağlantı Testi (Admin Panel Düzeltildi)',
                text: 'Bu mail, sistem ayarları port 587 olarak güncellendikten sonra gönderilmiştir.'
            });
            console.log("✅ General Test Email Sent!");
        } catch (e) { console.error("General Mail Failed:", e.message); }

        // 4. Send "Welcome Email" Simulation
        console.log("\n--- Sending Simulation Welcome Email ---");
        const token = crypto.randomBytes(32).toString('hex');
        const resetLink = `http://localhost:5173/create-password?token=${token}`;

        await transporter.sendMail({
            from: '"Event 4 Network" <info@event4network.com>',
            to: 'kaankarakas93@gmail.com',
            subject: 'Üyeliğiniz Onaylandı - Şifrenizi Oluşturun (TEST)',
            html: `
              <h2>Aramıza Hoş Geldiniz!</h2>
              <p>Sayın Kaan Karakaş,</p>
              <p>Event 4 Network ailesine katılımınız onaylanmıştır.</p>
              <p>Hesabınıza erişmek ve şifrenizi oluşturmak için lütfen aşağıdaki bağlantıya tıklayın:</p>
              <a href="${resetLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Şifremi Oluştur</a>
              <p>Bu bağlantı 24 saat geçerlidir.</p>
              <br>
              <p>Saygılarımızla,<br>Event 4 Network Ekibi</p>
            `
        });
        console.log("✅ Welcome Email Simulation Sent!");

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        pool.end();
    }
}

run();
