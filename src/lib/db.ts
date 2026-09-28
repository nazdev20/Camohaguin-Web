/**
 * Database connection pool & query helpers
 * Target: PostgreSQL (Schema: barangay, public)
 */

import { Pool, PoolClient, QueryResultRow } from 'pg';

// Global pool instance to prevent multiple connection pools during hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __barangayDbPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

function createPool(): Pool {
  if (!connectionString) {
    console.warn(
      '[barangay-db] Warning: DATABASE_URL is not set. Database operations requiring connection will fail until configured.'
    );
  }

  // Detect SSL requirement for cloud-hosted PostgreSQL/Supabase
  const isCloudPostgres = connectionString?.includes('supabase') ||
    connectionString?.includes('neon.tech') ||
    connectionString?.includes('render.com') ||
    process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/barangay_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
  });

  // Automatically set search_path on each newly acquired client
  pool.on('connect', (client: PoolClient) => {
    client.query('SET search_path TO barangay, public', (err) => {
      if (err) {
        console.error('[barangay-db] Failed to set search_path to barangay, public:', err.message);
      }
    });
  });

  pool.on('error', (err: Error) => {
    console.error('[barangay-db] Unexpected error on idle database client:', err.message);
  });

  return pool;
}

export const pool = globalThis.__barangayDbPool || createPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__barangayDbPool = pool;
}

/**
 * Execute a parameterized query returning all matching rows typed as T[]
 */
export async function query<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(sql, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL ${duration}ms] ${sql.trim().replace(/\s+/g, ' ')}`);
    }
    return result.rows;
  } catch (error: any) {
    console.error('[barangay-db query error]', {
      sql,
      params,
      message: error?.message,
    });
    throw error;
  }
}

/**
 * Execute a parameterized query returning the first matching row or null
 */
export async function queryOne<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute operations within an atomic database transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO barangay, public');
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[barangay-db] Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test connectivity and verify search path
 */
export async function testConnection(): Promise<{ ok: boolean; schema?: string; error?: string }> {
  try {
    const row = await queryOne<{ current_schema: string }>('SELECT current_schema()');
    return { ok: true, schema: row?.current_schema };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Database connection error' };
  }
}
