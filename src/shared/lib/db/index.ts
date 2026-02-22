import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// Prevent unhandled 'error' events on idle clients from crashing the process
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Create the Drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Re-export schema for convenience
export * from './schema';

// Export types
export type Database = typeof db;
