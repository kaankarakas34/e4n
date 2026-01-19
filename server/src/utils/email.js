import nodemailer from 'nodemailer';
import pool from '../config/db.js';

export const sendEmail = async (to, subject, html) => {
    let transporter;
    let sender;

    try {
        const { rows } = await pool.query("SELECT * FROM email_configurations WHERE is_active = TRUE LIMIT 1");

        if (rows.length > 0) {
            const config = rows[0];
            console.log(`[Email] Using DB Config: Host=${config.smtp_host} Port=${config.smtp_port} User=${config.smtp_user}`);
            transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: config.smtp_port,
                secure: config.smtp_port === 465,
                auth: {
                    user: config.smtp_user,
                    pass: config.smtp_pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            sender = `"${config.sender_name || 'Event4Network'}" <${config.sender_email}>`;
        } else {
            // Fallback to Env Vars
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            sender = `"Event4Network System" <${process.env.SMTP_USER || 'no-reply@event4network.com'}>`;
        }

        await transporter.sendMail({
            from: sender,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent to ${to}`);
        return { success: true };
    } catch (e) {
        console.error('Email Send Error:', e);
        return { success: false, error: e.message || e };
    }
};
