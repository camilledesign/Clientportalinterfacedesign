import { supabase } from './client';

/**
 * Supabase Database Utilities
 * 
 * Helper functions for working with Supabase tables with RLS.
 * All functions automatically include the auth token from the global session.
 */

// ============================================
// TYPES
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  client_id: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Request {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  type: 'brand' | 'website' | 'product';
  content: any;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

/**
 * SELECT - Query data from a table
 * 
 * @example
 * const users = await selectFrom('users', { email: 'test@example.com' });
 */
export async function selectFrom<T = any>(
  table: string,
  filters?: Record<string, any>,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<{ data: T[] | null; error: any; count: number | null }> {
  try {
    let query = supabase.from(table).select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(`❌ SELECT error on ${table}:`, error);
      return { data: null, error, count: null };
    }

    console.log(`✅ SELECT from ${table}: ${data?.length || 0} rows`);
    return { data, error: null, count };
  } catch (err) {
    console.error(`❌ SELECT exception on ${table}:`, err);
    return { data: null, error: err, count: null };
  }
}

/**
 * INSERT - Create new row(s) in a table
 * 
 * @example
 * const result = await insertInto('users', { email: 'new@example.com', name: 'New User' });
 */
export async function insertInto<T = any>(
  table: string,
  data: T | T[]
): Promise<{ data: T[] | null; error: any }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(Array.isArray(data) ? data : [data])
      .select();

    if (error) {
      console.error(`❌ INSERT error on ${table}:`, error);
      return { data: null, error };
    }

    console.log(`✅ INSERT into ${table}: ${result?.length || 0} rows`);
    return { data: result, error: null };
  } catch (err) {
    console.error(`❌ INSERT exception on ${table}:`, err);
    return { data: null, error: err };
  }
}

/**
 * UPDATE - Update row(s) in a table
 * 
 * @example
 * const result = await updateIn('users', { id: '123' }, { name: 'Updated Name' });
 */
export async function updateIn<T = any>(
  table: string,
  filters: Record<string, any>,
  updates: Partial<T>
): Promise<{ data: T[] | null; error: any }> {
  try {
    let query = supabase.from(table).update(updates);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.select();

    if (error) {
      console.error(`❌ UPDATE error on ${table}:`, error);
      return { data: null, error };
    }

    console.log(`✅ UPDATE in ${table}: ${data?.length || 0} rows`);
    return { data, error: null };
  } catch (err) {
    console.error(`❌ UPDATE exception on ${table}:`, err);
    return { data: null, error: err };
  }
}

/**
 * DELETE - Delete row(s) from a table
 * 
 * @example
 * const result = await deleteFrom('users', { id: '123' });
 */
export async function deleteFrom(
  table: string,
  filters: Record<string, any>
): Promise<{ error: any }> {
  try {
    let query = supabase.from(table).delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      console.error(`❌ DELETE error on ${table}:`, error);
      return { error };
    }

    console.log(`✅ DELETE from ${table}`);
    return { error: null };
  } catch (err) {
    console.error(`❌ DELETE exception on ${table}:`, err);
    return { error: err };
  }
}

/**
 * UPSERT - Insert or update row(s) in a table
 * 
 * @example
 * const result = await upsertIn('users', { id: '123', email: 'user@example.com', name: 'User' });
 */
export async function upsertIn<T = any>(
  table: string,
  data: T | T[],
  onConflict?: string
): Promise<{ data: T[] | null; error: any }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .upsert(Array.isArray(data) ? data : [data], {
        onConflict: onConflict,
      })
      .select();

    if (error) {
      console.error(`❌ UPSERT error on ${table}:`, error);
      return { data: null, error };
    }

    console.log(`✅ UPSERT into ${table}: ${result?.length || 0} rows`);
    return { data: result, error: null };
  } catch (err) {
    console.error(`❌ UPSERT exception on ${table}:`, err);
    return { data: null, error: err };
  }
}

// ============================================
// PROFILE HELPERS
// ============================================

/**
 * Get a user's profile
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ getProfile error:', error);
    return null;
  }

  return data;
}

/**
 * Upsert a user's profile
 */
export async function upsertProfile(profile: {
  id: string;
  full_name?: string;
  email?: string;
  company?: string;
  client_id?: string;
  is_admin?: boolean;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ upsertProfile error:', error);
    throw error;
  }

  return data;
}

// ============================================
// KV STORE HELPERS
// ============================================
/**
 * LEGACY KV STORE USAGE
 * 
 * The KV store is now deprecated for core user data.
 * Use the 'profiles' table and typed helpers instead.
 * 
 * Retain KV store ONLY for:
 * - App settings
 * - Feature flags
 * - Non-critical temporary data
 * 
 * Legacy Key Patterns:
 * - user:{userId} -> NOW MIGRATED TO 'profiles' TABLE
 * - client:{clientId} -> Client metadata (Deprecated)
 */

/**
 * Get a value from kv_store by key
 */
export async function kvGet(key: string): Promise<any | null> {
  const { data, error } = await selectFrom('kv_store_a93d7fb4', { key });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0].value;
}

/**
 * Set a value in kv_store
 */
export async function kvSet(key: string, value: any): Promise<boolean> {
  const { error } = await upsertIn(
    'kv_store_a93d7fb4',
    {
      key,
      value,
      created_at: new Date().toISOString(),
    },
    'key'
  );

  return !error;
}

/**
 * Delete a value from kv_store
 */
export async function kvDelete(key: string): Promise<boolean> {
  const { error } = await deleteFrom('kv_store_a93d7fb4', { key });
  return !error;
}

/**
 * Get multiple values by key prefix
 */
export async function kvGetByPrefix(prefix: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('kv_store_a93d7fb4')
      .select('*')
      .like('key', `${prefix}%`);

    if (error) {
      console.error('❌ kvGetByPrefix error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ kvGetByPrefix exception:', err);
    return [];
  }
}

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Get user error:', error);
    return null;
  }

  return user;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Get session error:', error);
    return null;
  }

  return session;
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS (OPTIONAL)
// ============================================

/**
 * Subscribe to changes on a table
 * 
 * @example
 * const unsubscribe = subscribeToTable('users', (payload) => {
 *   console.log('Change:', payload);
 * });
 * 
 * // Later, unsubscribe:
 * unsubscribe();
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; filter?: string }
) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: filter?.event || '*',
        schema: 'public',
        table: table,
        filter: filter?.filter,
      },
      callback
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check RLS policy by attempting a query
 */
export async function checkRLSPolicy(table: string): Promise<{
  hasAccess: boolean;
  error: any;
}> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === '42501' || error.message.includes('policy')) {
      return {
        hasAccess: false,
        error: 'RLS policy denies access. Make sure you have a policy that allows authenticated users.',
      };
    }
    return { hasAccess: false, error: error.message };
  }

  return { hasAccess: true, error: null };
}

/**
 * Get table info (columns, etc.)
 */
export async function getTableInfo(table: string) {
  try {
    // Get one row to inspect columns
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      return { columns: [], error };
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return { columns, error: null };
  } catch (err) {
    return { columns: [], error: err };
  }
}
