const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_Qh1ZvFbozf3u@ep-dark-water-aha1acom-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, 'migrations', '001_neon_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nTables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
