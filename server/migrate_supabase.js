import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kullanıcıdan connection string'i environment variable olarak alıyoruz
// Örnek: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error("\x1b[31m%s\x1b[0m", "HATA: SUPABASE_DB_URL bulunamadı!");
    console.log("\x1b[33m%s\x1b[0m", "Lütfen .env dosyasına SUPABASE_DB_URL değişkenini ekleyin veya komutu şu şekilde çalıştırın:");
    console.log("\n  SUPABASE_DB_URL='postgresql://postgres:[SIFRE]@[HOST]:6543/postgres' node migrate_supabase.js\n");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString,
    // ssl: {
    //     rejectUnauthorized: false // Supabase bağlantıları için genellikle gereklidir
    // }
});

async function migrate() {
    let client;
    try {
        client = await pool.connect();
        console.log("\x1b[32m%s\x1b[0m", "✅ Supabase veritabanına başarıyla bağlanıldı.");

        // 1. init.sql dosyasını oku ve çalıştır
        const initSqlPath = path.join(__dirname, 'init.sql');
        if (fs.existsSync(initSqlPath)) {
            console.log("📄 init.sql okunuyor...");
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            console.log("⚙️  Tablolar ve şema oluşturuluyor...");
            await client.query(initSql);
            console.log("\x1b[32m%s\x1b[0m", "✅ init.sql başarıyla çalıştırıldı.");
        } else {
            console.warn("⚠️  init.sql bulunamadı, atlanıyor.");
        }

        // 2. seed_members.sql dosyasını oku ve çalıştır
        const seedSqlPath = path.join(__dirname, 'seed_members.sql');
        if (fs.existsSync(seedSqlPath)) {
            console.log("📄 seed_members.sql okunuyor...");
            const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
            console.log("🌱 Örnek veriler (seed_members) ekleniyor...");
            await client.query(seedSql);
            console.log("\x1b[32m%s\x1b[0m", "✅ seed_members.sql başarıyla çalıştırıldı.");
        } else {
            console.warn("⚠️  seed_members.sql bulunamadı, atlanıyor.");
        }

        // 3. seed_professions.sql dosyasını oku ve çalıştır
        const professionsSqlPath = path.join(__dirname, 'seed_professions.sql');
        if (fs.existsSync(professionsSqlPath)) {
            console.log("📄 seed_professions.sql okunuyor...");
            const professionsSql = fs.readFileSync(professionsSqlPath, 'utf8');
            console.log("🌱 Meslek verileri (seed_professions) ekleniyor...");
            await client.query(professionsSql);
            console.log("\x1b[32m%s\x1b[0m", "✅ seed_professions.sql başarıyla çalıştırıldı.");
        } else {
            console.warn("⚠️  seed_professions.sql bulunamadı, atlanıyor.");
        }

        console.log("\x1b[32m%s\x1b[0m", "\n🚀 Migration ve Seed işlemi başarıyla tamamlandı!");

    } catch (err) {
        console.error("\x1b[31m%s\x1b[0m", "\n❌ HATA OLUŞTU:");
        console.error(err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

migrate();
