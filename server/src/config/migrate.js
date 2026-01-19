import pool from './db.js';

export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Checking Database Schema...');

    // User Table Extensions
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE'");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_trigger INTEGER");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE");
    await client.query("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS performance_color VARCHAR(10) DEFAULT 'GREY'");

    // Company & Billing
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address TEXT");

    // Events
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS city VARCHAR(100)");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PUBLISHED'");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS has_equal_opportunity_badge BOOLEAN DEFAULT FALSE");

    // Professions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS professions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Champions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS champions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_type VARCHAR(20) NOT NULL,
        period_date DATE NOT NULL,
        metric_type VARCHAR(20) NOT NULL,
        user_id UUID REFERENCES users(id),
        value NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Email Config
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_pass VARCHAR(255) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Ticket System
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Payment Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions(
         merchant_oid VARCHAR(255) PRIMARY KEY,
         user_id UUID REFERENCES users(id),
         plan_id VARCHAR(50),
         amount DECIMAL(10, 2),
         status VARCHAR(50) DEFAULT 'PENDING',
         created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         user_id UUID REFERENCES users(id),
         type VARCHAR(50), 
         content TEXT,
         is_read BOOLEAN DEFAULT FALSE,
         created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Public Visitors Table
    await client.query(`
       CREATE TABLE IF NOT EXISTS public_visitors (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         name VARCHAR(255) NOT NULL,
         email VARCHAR(255),
         phone VARCHAR(50),
         company VARCHAR(255),
         profession VARCHAR(255),
         source VARCHAR(50),
         kvkk_accepted BOOLEAN DEFAULT FALSE,
         status VARCHAR(50) DEFAULT 'PENDING',
         created_at TIMESTAMP DEFAULT NOW()
       )
    `);

    console.log('✅ Database Schema Synced');
  } catch (e) {
    console.error('❌ Migration Error:', e);
  } finally {
    client.release();
  }
};
