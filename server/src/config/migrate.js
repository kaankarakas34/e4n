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
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT");

    // Core Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        meeting_day VARCHAR(20),
        meeting_time TIME,
        meeting_link VARCHAR(255),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        visitor_email_subject TEXT,
        visitor_email_template TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("ALTER TABLE groups ALTER COLUMN meeting_day TYPE VARCHAR(255) USING meeting_day::varchar");
    await client.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS visitor_email_subject TEXT");
    await client.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS visitor_email_template TEXT");

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'MEMBER',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        giver_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'PENDING',
        description TEXT,
        amount DECIMAL(10, 2),
        temperature VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        event_id UUID REFERENCES events(id),
        status VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inviter_id UUID REFERENCES users(id),
        group_id UUID REFERENCES groups(id),
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        profession VARCHAR(255),
        visited_at DATE,
        status VARCHAR(20) DEFAULT 'INVITED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    // Ensure missing columns exist
    await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS company VARCHAR(255)");
    await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
    await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS phone VARCHAR(50)");
    await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS profession VARCHAR(255)");
    await client.query("ALTER TABLE visitors ALTER COLUMN inviter_id DROP NOT NULL");


    await client.query(`
      CREATE TABLE IF NOT EXISTS one_to_ones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id UUID REFERENCES users(id),
        partner_id UUID REFERENCES users(id),
        meeting_date DATE,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'COMPLETED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

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
         title VARCHAR(255),
         web_linkedin VARCHAR(255),
         activity_area VARCHAR(255),
         duration VARCHAR(100),
         target_customer TEXT,
         why_join TEXT,
         value_add TEXT,
         previous_groups TEXT,
         created_at TIMESTAMP DEFAULT NOW()
       )
    `);

    // Ensure new fields exist on existing public_visitors tables
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS title VARCHAR(255)");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS web_linkedin VARCHAR(255)");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS activity_area VARCHAR(255)");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS duration VARCHAR(100)");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS target_customer TEXT");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS why_join TEXT");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS value_add TEXT");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS previous_groups TEXT");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL");
    // Power Teams
    await client.query(`
      CREATE TABLE IF NOT EXISTS power_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        visitor_email_subject TEXT,
        visitor_email_template TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("ALTER TABLE power_teams ADD COLUMN IF NOT EXISTS visitor_email_subject TEXT");
    await client.query("ALTER TABLE power_teams ADD COLUMN IF NOT EXISTS visitor_email_template TEXT");


    await client.query(`
      CREATE TABLE IF NOT EXISTS power_team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        power_team_id UUID REFERENCES power_teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'MEMBER',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(power_team_id, user_id)
      )
    `);

    // Ensure Columns exist for Core Tables (in case tables existed but were empty/partial)
    await client.query("ALTER TABLE group_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");
    await client.query("ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'MEMBER'");
    await client.query("ALTER TABLE power_team_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'MEMBER'");
    await client.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");
    await client.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_dates JSONB DEFAULT '[]'::jsonb");
    await client.query("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS type VARCHAR(20)");
    await client.query("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'");
    await client.query("ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50)");
    await client.query("ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()");

    // Event Table Enhancements
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PUBLISHED'");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'TRY'");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER DEFAULT 50");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS generate_tickets BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS city VARCHAR(100)");

    // Event Tickets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, FREE
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Seed default visitor template if not exists
    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('visitor_welcome_template', $1)
      ON CONFLICT (key) DO NOTHING
    `, [`
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <p>Sayın <strong>{name}</strong>,</p>
        <p><strong>Event4Network (E4N)</strong>, iş insanlarının bir araya gelerek güvene dayalı, sürdürülebilir iş ilişkileri kurduğu seçici bir networking platformudur.</p>
        <p>Sizleri de bu yapıyı yakından tanıyabileceğiniz online toplantımıza davet etmek isteriz.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 5px 0;">📅 <strong>Tarih:</strong> {meeting_date}</p>
          <p style="margin: 5px 0;">🕢 <strong>Saat:</strong> {meeting_time}</p>
          <p style="margin: 5px 0;">🔗 <strong>Katılım Linki:</strong> <a href="{meeting_link}" style="color: #4f46e5;">{meeting_link}</a></p>
        </div>
        <p>Toplantımızda hem sistemi daha detaylı aktaracak hem de katılımcılarla birebir tanışma fırsatı bulabileceksiniz.</p>
        <p>Ayrıca öncesinde incelemek isterseniz:<br/>
        📱 <strong>Instagram:</strong> <a href="https://www.instagram.com/event4network/" style="color: #4f46e5;">https://www.instagram.com/event4network/</a></p>
        <p>Katılımınızı bekliyoruz.<br/>Görüşmek üzere.</p>
        <p>İyi günler dileriz.</p>
      </div>
    `]);

    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('membership_invite_template', $1)
      ON CONFLICT (key) DO NOTHING
    `, [`
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Üyelik Daveti</h2>
        <p>Sayın <strong>{name}</strong>,</p>
        <p>{group_name} grubumuzdaki toplantımıza katılımınız için teşekkür ederiz.</p>
        <p>Sizi de E4N ailesinin bir parçası olarak görmekten mutluluk duyarız. Üyelik başvurunuzu aşağıdaki link üzerinden tamamlayabilirsiniz:</p>
        <p><a href="https://www.event4network.com/apply" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Üyelik Başvurusunu Tamamla</a></p>
        <p>Görüşmek üzere.</p>
      </div>
    `]);

    console.log('✅ Database Schema Synced');
  } catch (e) {
    console.error('❌ Migration Error:', e);
  } finally {
    client.release();
  }
};
