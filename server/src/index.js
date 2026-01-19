import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import { initCronJobs } from './cron/jobs.js';

// Route Imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import usersCollectionRoutes from './routes/user.js'; // This has /api/user/groups etc. (Singular user)
import groupRoutes from './routes/groups.js';
import powerTeamRoutes from './routes/powerteams.js';
import eventRoutes from './routes/events.js';
import referralRoutes from './routes/referrals.js';
import requestRoutes from './routes/onetoones.js'; // One to Ones
import educationRoutes from './routes/education.js';
import attendanceRoutes from './routes/attendance.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import ticketRoutes from './routes/tickets.js';
import paymentRoutes from './routes/payment.js';
import commonRoutes from './routes/common.js'; // Professions, LMS, Public Visitors
import visitorRoutes from './routes/visitors.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use('/api', commonRoutes); // Professions, etc. which might be /api/professions
// Let's manually mount to match exact paths
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', usersCollectionRoutes); // /api/user/groups, /api/user/friends
app.use('/api/groups', groupRoutes);
app.use('/api/power-teams', powerTeamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/one-to-ones', requestRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes); // /api/reports/stats -> in routes need to check paths
// Wait, my reports.js has /stats, /charts. Original was /api/admin/stats...
// I have to realign paths.

app.use('/api/tickets', ticketRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', commonRoutes); // /api/professions, /api/lms/courses
app.use('/api/visitors', visitorRoutes);

// Health Check
app.get('/api/health-check', async (req, res) => {
  const result = {
    status: 'checking',
    env: { NODE_ENV: process.env.NODE_ENV }
  };
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      result.status = 'ok';
      result.dbAttempt = 'success';
    } finally { client.release(); }
  } catch (e) {
    result.status = 'error';
    result.error = e.message;
  }
  res.status(200).json(result);
});

// Initialize Cron Jobs
initCronJobs();

// Global Error Handler
process.on('uncaughtException', (err) => { console.error('CRITICAL PROCESS CRASH:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection at:', promise, 'reason:', reason); });

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
