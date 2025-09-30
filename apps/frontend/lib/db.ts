import { Pool } from 'pg'

const connectionString = process.env.NEXT_DATABASE_URL

let pool: Pool | null = null

export function getDb() {
  if (!connectionString) {
    throw new Error('NEXT_DATABASE_URL is not set')
  }
  if (!pool) {
    pool = new Pool({ connectionString })
  }
  return pool
}

export async function ensureSchema() {
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS pool_transactions (
      id SERIAL PRIMARY KEY,
      pool_id INTEGER NOT NULL,
      vault_id BIGINT NOT NULL,
      tranche SMALLINT NOT NULL,
      amount BIGINT NOT NULL,
      tx_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pools (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      maturity TEXT NOT NULL,
      description TEXT,
      senior_apy NUMERIC,
      mezzanine_apy NUMERIC,
      junior_apy NUMERIC,
      module_addr TEXT,
      owner_addr TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS rwas (
      id SERIAL PRIMARY KEY,
      pool_id INTEGER NOT NULL,
      rwa_id BIGINT NOT NULL,
      value BIGINT NOT NULL,
      asset_type TEXT NOT NULL,
      originator TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}
