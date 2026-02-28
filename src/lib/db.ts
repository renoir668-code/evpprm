import { createPool } from '@vercel/postgres';
import * as bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let pool: any = null;
let sqliteDb: any = null;
const isVercel = process.env.VERCEL === '1';

function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString && !isVercel) {
    if (!sqliteDb) {
      console.log("Local development mode: Using SQLite fallback.");
      const dbPath = path.join(process.cwd(), 'local_prm.db');
      sqliteDb = new Database(dbPath);
    }
    return null;
  }

  if (!pool) {
    if (!connectionString) {
      console.warn("No connection string found for pool.");
    }
    pool = createPool({
      connectionString: connectionString,
    });
  }
  return pool;
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  const currentPool = getPool();

  if (!currentPool) {
    // SQLite Initialization
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'User',
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS workgroups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS user_workgroups (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        workgroup_id TEXT REFERENCES workgroups(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, workgroup_id)
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        health_status TEXT DEFAULT 'Active',
        integration_status TEXT DEFAULT 'No',
        integration_products TEXT,
        key_person_id TEXT,
        needs_attention_days INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        vertical TEXT,
        use_case TEXT,
        logo_url TEXT,
        dismissed_at DATETIME
      )
    `);

    // Migration for SQLite
    try {
      sqliteDb.exec('ALTER TABLE partners ADD COLUMN logo_url TEXT');
    } catch (e) { }
    try {
      sqliteDb.exec('ALTER TABLE partners ADD COLUMN dismissed_at DATETIME');
    } catch (e) { }

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS partner_tags (
        partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
        tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (partner_id, tag_id)
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT
      )
    `);

    try {
      sqliteDb.exec('ALTER TABLE contacts ADD COLUMN phone TEXT');
    } catch (e) { }

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        date DATETIME NOT NULL,
        notes TEXT,
        type TEXT,
        attachments TEXT DEFAULT '[]'
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS custom_reminders (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_date DATETIME NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      sqliteDb.exec('ALTER TABLE interactions ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL');
    } catch (e) { }

    const marioHash = "$2b$10$pFVD.Gf8ZLUX/FjOeHDd6eXT6PInTQOSvwFEymA.kDxBgYzKfuPyi";
    sqliteDb.prepare(`
      INSERT INTO users (id, name, email, role, password_hash)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `).run('admin-mario', 'Mario', 'Mario', 'Admin', marioHash);

    isInitialized = true;
    console.log('SQLite Database initialized');
    return;
  }

  // Postgres Initialization
  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');

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
      CREATE TABLE IF NOT EXISTS workgroups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_workgroups (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        workgroup_id TEXT REFERENCES workgroups(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, workgroup_id)
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
        use_case TEXT,
        logo_url TEXT,
        dismissed_at TIMESTAMP
      )
    `);

    try {
      await client.query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT');
      await client.query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP');
    } catch (e) { }


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
        phone TEXT,
        role TEXT
      )
    `);

    try {
      await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT');
    } catch (e) { }

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await client.query('ALTER TABLE interactions ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id) ON DELETE SET NULL');
    } catch (e) { }

    const marioHash = "$2b$10$pFVD.Gf8ZLUX/FjOeHDd6eXT6PInTQOSvwFEymA.kDxBgYzKfuPyi";
    await client.query(`
      INSERT INTO users (id, name, email, role, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, ['admin-mario', 'Mario', 'Mario', 'Admin', marioHash]);

    await client.query('COMMIT');
    isInitialized = true;
    console.log('PostgreSQL Database initialized');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Postgres migration error:", e);
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

export const query = async (text: string, params?: any[]) => {
  await ensureDb();
  const currentPool = getPool();

  if (!currentPool) {
    // SQLite: Convert $1, $2 ... to ?
    const convertedText = text.replace(/\$\d+/g, '?');
    const stmt = sqliteDb.prepare(convertedText);

    if (text.trim().toUpperCase().startsWith('SELECT')) {
      return { rows: stmt.all(params || []) };
    } else {
      const result = stmt.run(params || []);
      return { rows: [], rowCount: result.changes };
    }
  }

  return currentPool.query(text, params);
};

export const getClient = async () => {
  await ensureDb();
  const currentPool = getPool();
  if (!currentPool) {
    // Return a mock client that uses the shared sqlite handle
    return {
      query: (t: string, p?: any[]) => query(t, p),
      release: () => { },
    };
  }
  return currentPool.connect();
};

// Fire it off immediately just in case
// ensureDb().catch(console.error);
