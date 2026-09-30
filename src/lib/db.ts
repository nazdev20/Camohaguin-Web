import { getPrisma } from './prisma';

interface SqlExecutor {
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: any[]): Promise<number>;
}

interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

async function runQuery<T>(
  executor: SqlExecutor,
  sql: string,
  params: any[] = [],
): Promise<QueryResult<T>> {
  const returnsRows = /^(SELECT|WITH|VALUES|SHOW|EXPLAIN)\b/i.test(sql.trim()) ||
    /\bRETURNING\b/i.test(sql);

  if (returnsRows) {
    const rows = await executor.$queryRawUnsafe<T[]>(sql, ...params);
    return { rows, rowCount: rows.length };
  }

  const rowCount = await executor.$executeRawUnsafe(sql, ...params);
  return { rows: [], rowCount };
}

/**
 * Execute a parameterized query returning all matching rows typed as T[]
 */
export async function query<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await runQuery<T>(getPrisma(), sql, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL ${duration}ms] ${sql.trim().replace(/\s+/g, ' ')}`);
    }
    return result.rows;
  } catch (error: any) {
    console.error('[barangay-db query error]', {
      sql,
      message: error?.message,
    });
    throw error;
  }
}

/**
 * Execute a parameterized query returning the first matching row or null
 */
export async function queryOne<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute operations within an atomic database transaction
 */
export async function withTransaction<T>(
  callback: (client: {
    query<T = any>(
      sql: string,
      params?: any[],
    ): Promise<QueryResult<T>>;
  }) => Promise<T>,
): Promise<T> {
  return getPrisma().$transaction(
    transaction => callback({
      query: <Row = any>(sql: string, params: any[] = []) =>
        runQuery<Row>(transaction, sql, params),
    }),
    { timeout: 15_000 },
  );
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
