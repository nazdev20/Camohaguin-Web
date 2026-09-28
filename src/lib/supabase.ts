/**
 * Supabase Client Configuration & Live Status Checker
 * Uses project URL and publishable key
 */

export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  'https://cbcvhmvdaujhbquryaom.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_hBItT31I4RBvcksW7tMRyw_kfEnFZbB';

export const SUPABASE_REST_ENDPOINT = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1`;

export interface SupabaseHealth {
  connected: boolean;
  status: 'connected' | 'schema_notice' | 'error';
  message: string;
  url: string;
  keyPreview: string;
  exposedSchemasNotice?: boolean;
}

/**
 * Check connection status to the Supabase REST endpoint
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  const keyPreview = `${SUPABASE_PUBLISHABLE_KEY.slice(0, 14)}...${SUPABASE_PUBLISHABLE_KEY.slice(-6)}`;
  try {
    const res = await fetch(`${SUPABASE_REST_ENDPOINT}/services?select=*`, {
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        status: 'connected',
        message: `Successfully connected to Supabase! (${Array.isArray(data) ? data.length : 0} services found in public.services)`,
        url: SUPABASE_URL,
        keyPreview,
      };
    }

    const errJson = await res.json().catch(() => null);

    // Check if table missing or schema notice
    if (errJson?.code === 'PGRST205') {
      return {
        connected: true,
        status: 'schema_notice',
        message: 'Connected to Supabase! Tables are not yet migrated to the "public" schema (or schema "barangay" needs to be exposed in Supabase API settings).',
        url: SUPABASE_URL,
        keyPreview,
        exposedSchemasNotice: true,
      };
    }

    return {
      connected: true,
      status: 'schema_notice',
      message: errJson?.message || `Supabase responded with status ${res.status}`,
      url: SUPABASE_URL,
      keyPreview,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'error',
      message: err?.message || 'Failed to reach Supabase endpoint',
      url: SUPABASE_URL,
      keyPreview,
    };
  }
}

/**
 * Direct REST helper to query tables in the `barangay` or `public` schema
 */
export async function supabaseRestQuery<T = any>(
  table: string,
  options?: {
    schema?: string;
    select?: string;
    filter?: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: any;
  }
): Promise<{ data: T | null; error: string | null }> {
  try {
    const schema = options?.schema || 'public';
    const select = options?.select || '*';
    let url = `${SUPABASE_REST_ENDPOINT}/${table}?select=${encodeURIComponent(select)}`;

    if (options?.filter) {
      url += `&${options.filter}`;
    }

    const headers: Record<string, string> = {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Profile': schema,
      'Content-Profile': schema,
    };

    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errText = await response.text();
      return { data: null, error: `Supabase REST [${response.status}]: ${errText}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error connecting to Supabase' };
  }
}
