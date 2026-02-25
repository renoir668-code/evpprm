import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL or POSTGRES_URL is not set. Please provide a connection string.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'User',
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        health_status TEXT DEFAULT 'Active',
        integration_status TEXT DEFAULT 'No',
        integration_products TEXT,
        key_person_id TEXT,
        needs_attention_days INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        vertical TEXT,
        use_case TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_tags (
        partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
        tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (partner_id, tag_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        type TEXT,
        attachments TEXT DEFAULT '[]'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_reminders (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_date TIMESTAMP NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Ensure new Mario admin user exists
    // Ensure new Mario admin user exists and password is strictly matched to latest hash over-write
    const marioHash = "$2b$10$pFVD.Gf8ZLUX/FjOeHDd6eXT6PInTQOSvwFEymA.kDxBgYzKfuPyi";
    await client.query(`
      INSERT INTO users (id, name, email, role, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, ['admin-mario', 'Mario', 'Mario', 'Admin', marioHash]);

    // Clean up old default demo admin
    await client.query("DELETE FROM users WHERE email = 'admin@evp-prm.com' OR id = 'admin-1'");

    await client.query('COMMIT');
    isInitialized = true;
    console.log('PostgreSQL Database initialized via Supabase/Vercel URL');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration error:", e);
  } finally {
    client.release();
  }
}

export function ensureDb() {
  if (!initPromise) {
    initPromise = initDb();
  }
  return initPromise;
}

// We export query to use directly from pg, wrapping it to ensure db is ready
export const query = async (text: string, params?: any[]) => {
  await ensureDb();
  return pool.query(text, params);
};

export const getClient = async () => {
  await ensureDb();
  return pool.connect();
};

// Fire it off immediately just in case
ensureDb().catch(console.error);
