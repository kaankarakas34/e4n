import pg from 'pg';
const { Pool } = pg;

// Bu URL'i kod içine gömüyoruz ki environment variable okuma hatası ihtimalini eleyelim.
// Kullanıcının verdiği şifreyi ve configi kullanıyoruz.
const connectionString = "postgres://postgres:vy%2F22xUZF3%2Fn8S8@db.kaoagsuxccwgrdydxros.supabase.co:5432/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase SSL gerektirir
    connectionTimeoutMillis: 10000, // 10 saniye zaman aşımı
});

async function testConnection() {
    console.log('🔄 Veritabanına bağlanılıyor...');
    console.log(`📡 URL: ${connectionString.replace(/:[^:]*@/, ':****@')}`); // Şifreyi gizleyerek ekrana bas

    try {
        const client = await pool.connect();
        console.log('✅ BAĞLANTI BAŞARILI! (Connection Established)');

        const res = await client.query('SELECT NOW() as zaman, version() as versiyon');
        console.log('🕒 Sunucu Zamanı:', res.rows[0].zaman);
        console.log('ℹ️  PostgreSQL Sürümü:', res.rows[0].versiyon);

        // Tablo kontrolü yapalım
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);

        console.log('📂 Bulunan Tablolar (İlk 5):');
        tables.rows.forEach(t => console.log(` - ${t.table_name}`));

        client.release();
    } catch (err) {
        console.error('❌ BAĞLANTI HATASI (Connection Failed):');
        console.error('Hata Mesajı:', err.message);
        console.error('Hata Kodu:', err.code);
        if (err.message.includes('password')) {
            console.error('💡 İPUCU: Şifre veya kullanıcı adı hatalı olabilir.');
        } else if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
            console.error('💡 İPUCU: Güvenlik duvarı (Firewall) engelliyor olabilir veya Host adresi yanlış.');
        } else if (err.message.includes('no-pg_hba.conf')) {
            console.error('💡 İPUCU: SSL ayarı gerekli olabilir (ssl: rejectUnauthorized: false ayarını zaten kullanıyoruz).');
        }
    } finally {
        await pool.end();
        process.exit();
    }
}

testConnection();
