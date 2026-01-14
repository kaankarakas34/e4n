import pg from 'pg';
const { Pool } = pg;

const regions = [
    'aws-0-eu-central-1', // Frankfurt
    'aws-0-us-east-1',    // N. Virginia
    'aws-0-us-west-1',    // N. California
    'aws-0-ap-southeast-1', // Singapore
    'aws-0-eu-west-1',      // Ireland
    'aws-0-eu-west-2',      // London
    'aws-0-sa-east-1',      // Sao Paulo
    'aws-1-ap-southeast-2'  // Sydney? (New)
];

const projectID = 'kaoagsuxccwgrdydxros';
const password = encodeURIComponent('vy/22xUZF3/n8S8');

async function checkRegion(region) {
    const host = `${region}.pooler.supabase.com`;
    // Note: Pooler user format is postgres.[PROJECT_ID]
    const connectionString = `postgres://postgres.${projectID}:${password}@${host}:6543/postgres?pgbouncer=true`;

    console.log(`🌍 Deneniyor: ${region} (${host})...`);

    // Bağlantı zaman aşımı kısa tutalım
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log(`✅ BAŞARILI! Projeniz bu bölgede: ${region}`);
        console.log(`📝 Doğru Connection String:`);
        console.log(connectionString);
        client.release();
        return true;
    } catch (err) {
        if (err.message.includes('Tenant or user not found')) {
            console.log(`❌ ${region}: Proje burada değil (Tenant not found).`);
        } else if (err.code === 'ENOTFOUND') {
            console.log(`❌ ${region}: DNS çözülemedi.`);
        } else {
            console.log(`❌ ${region}: Hata - ${err.message}`);
        }
        return false;
    } finally {
        await pool.end();
    }
}

async function scan() {
    console.log('🚀 Supabase Pooler Bölgesi Taranıyor...');
    for (const region of regions) {
        const success = await checkRegion(region);
        if (success) process.exit(0);
    }
    console.log('⚠️ Hiçbir bölgede bulunamadı. Project ID veya Şifre yanlış olabilir, ya da IPv6-only modundadır.');
}

scan();
