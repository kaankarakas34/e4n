import cron from 'node-cron';
import pool from '../config/db.js';
import { calculateChampions } from '../utils/scoring.js';
import { sendNotification } from '../utils/notifications.js';

export const initCronJobs = () => {
    // Weekly: Sunday 23:59
    cron.schedule('59 23 * * 0', async () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        await calculateChampions('WEEK', start.toISOString(), end.toISOString());
    });

    // Monthly: Last day of month 23:59
    cron.schedule('59 23 28-31 * *', async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Determine if tomorrow is 1st of next month
        if (tomorrow.getDate() === 1) {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            await calculateChampions('MONTH', start.toISOString(), today.toISOString());
        }
    });

    // Term: End of April, August, December
    cron.schedule('59 23 30 4,8 *', async () => { // Apr 30, Aug 30 (Use 30 for safety)
        const today = new Date();
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        await calculateChampions('TERM', start.toISOString(), today.toISOString());
    });
    cron.schedule('59 23 31 8,12 *', async () => {
        const today = new Date();
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        await calculateChampions('TERM', start.toISOString(), today.toISOString());
    });
    // Yearly: Dec 31
    cron.schedule('59 23 31 12 *', async () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        await calculateChampions('YEAR', start.toISOString(), today.toISOString());
    });

    // Daily Cron: Subscription Reminders (Every day at 09:00)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily subscription check...');
        try {
            const { rows } = await pool.query(`
              SELECT id, name, email, subscription_end_date, last_reminder_trigger 
              FROM users 
              WHERE account_status = 'ACTIVE' AND subscription_end_date IS NOT NULL
          `);

            const now = new Date();
            const triggers = [3, 1, -1, -3, -5];

            for (const user of rows) {
                const endDate = new Date(user.subscription_end_date);
                const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const daysLeft = Math.round((endMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

                if (triggers.includes(daysLeft) && user.last_reminder_trigger !== daysLeft) {
                    let title = '';
                    let message = '';
                    
                    if (daysLeft > 0) {
                        title = 'Üyelik Ödeme Hatırlatması';
                        message = `Sayın ${user.name}, üyeliğinizin bitmesine ${daysLeft} gün kaldı. Hesabınızın kısıtlanmaması için lütfen en kısa sürede dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi gerçekleştiriniz.`;
                    } else {
                        const overdue = Math.abs(daysLeft);
                        title = 'Gecikmiş Üyelik Ödemesi Uyarısı';
                        message = `Sayın ${user.name}, üyeliğinizin süresi dolalı ${overdue} gün olmuştur. Hizmetlerinizin kesilmemesi için lütfen acilen dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi tamamlayınız.`;
                    }

                    await sendNotification(user.id, title, message);
                    await pool.query('UPDATE users SET last_reminder_trigger = $1 WHERE id = $2', [daysLeft, user.id]);
                }
            }
        } catch (e) {
            console.error('Daily check error:', e);
        }
    });

    console.log('✅ Cron Jobs Initialized');
};
