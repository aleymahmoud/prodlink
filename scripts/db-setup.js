const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function dbSetup() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Use SSL only if the connection string requires it (e.g. external DB)
  const useSSL = connectionString.includes('sslmode=require');
  const client = new Client({
    connectionString,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    console.log('[db-setup] Connecting to database...');
    await client.connect();
    console.log('[db-setup] Connected successfully');

    // --- Run all migrations in order ---
    const migrationsDir = path.join(__dirname, '..', 'neon', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[db-setup] Running migration: ${file}`);
      await client.query(migrationSql);
    }
    console.log(`[db-setup] ${migrationFiles.length} migration(s) complete`);

    // --- Run seed data ---
    const seedPath = path.join(__dirname, '..', 'neon', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('[db-setup] Running seed data...');
    await client.query(seedSql);
    console.log('[db-setup] Seed data complete');

    // --- Create default admin user if none exists ---
    const adminCheck = await client.query(
      `SELECT id FROM profiles WHERE role = 'admin' LIMIT 1`
    );

    if (adminCheck.rows.length === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@prodlink.com';
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const defaultName = process.env.ADMIN_NAME || 'System Admin';

      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      await client.query(
        `INSERT INTO profiles (email, username, full_name, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, 'admin', true)
         ON CONFLICT (email) DO NOTHING`,
        [defaultEmail, defaultUsername, defaultName, passwordHash]
      );

      console.log(`[db-setup] Default admin created: ${defaultEmail}`);
    } else {
      console.log('[db-setup] Admin user already exists, skipping');
    }

    // --- Verify ---
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log(`[db-setup] Done. ${tables.rows.length} tables ready.`);

  } catch (error) {
    console.error('[db-setup] Failed:', error.message);
    if (error.detail) console.error('[db-setup] Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dbSetup();
