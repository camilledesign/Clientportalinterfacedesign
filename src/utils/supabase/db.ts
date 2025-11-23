import { supabase } from './client';
import { wrapSupabaseError } from './errors';

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

/**
 * Get all profiles (admin only)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getAllProfiles error:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// REQUEST HELPERS
// ============================================

export interface RequestInput {
  user_id: string;
  type: 'brand' | 'website' | 'product';
  title: string;
  payload: any;
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered';
}

export interface RequestRecord {
  id: string;
  user_id: string;
  type: 'brand' | 'website' | 'product';
  title: string;
  payload: any;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new request (brief submission)
 */
export async function createRequest(
  userId: string,
  type: 'brand' | 'website' | 'product',
  title: string,
  payload: any
): Promise<RequestRecord> {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      user_id: userId,
      type,
      title,
      payload,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createRequest error:', error);
    throw error;
  }

  console.log('✅ Request created:', data.id);
  return data;
}

/**
 * Get all requests for a specific user
 */
export async function getUserRequests(userId: string): Promise<RequestRecord[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getUserRequests error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all requests (admin only)
 */
export async function getAllRequests(): Promise<RequestRecord[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getAllRequests error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get requests for a specific user (admin viewing a client)
 */
export async function getRequestsByUser(userId: string): Promise<RequestRecord[]> {
  return getUserRequests(userId);
}

/**
 * Update request status
 */
export async function updateRequestStatus(
  requestId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
): Promise<RequestRecord> {
  const { data, error } = await supabase
    .from('requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('❌ updateRequestStatus error:', error);
    throw error;
  }

  return data;
}

// ============================================
// ASSET HELPERS
// ============================================

export interface AssetInput {
  user_id: string;
  label: string;
  description?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export interface AssetRecord {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

/**
 * Create asset record after file upload
 */
export async function createAsset(asset: AssetInput): Promise<AssetRecord> {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single();

  if (error) {
    console.error('❌ createAsset error:', error);
    throw error;
  }

  console.log('✅ Asset created:', data.id);
  return data;
}

/**
 * Get all assets for a specific user
 */
export async function getUserAssets(userId: string): Promise<AssetRecord[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getUserAssets error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get assets for a specific user (admin viewing a client)
 */
export async function getAssetsByUser(userId: string): Promise<AssetRecord[]> {
  return getUserAssets(userId);
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('❌ deleteAsset error:', error);
    throw error;
  }

  console.log('✅ Asset deleted:', assetId);
}

/**
 * Delete an asset and its file from storage
 */
export async function deleteAssetWithFile(assetId: string): Promise<void> {
  try {
    // 1. Fetch asset to get file_path
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('file_path')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching asset for deletion:', fetchError);
      throw fetchError;
    }

    // 2. Delete file from storage if file_path exists
    if (asset?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('assets')
        .remove([asset.file_path]);

      if (storageError) {
        console.error('❌ Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log('✅ File deleted from storage:', asset.file_path);
      }
    }

    // 3. Delete database record
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (deleteError) {
      console.error('❌ Error deleting asset from database:', deleteError);
      throw deleteError;
    }

    console.log('✅ Asset deleted completely:', assetId);
  } catch (error) {
    console.error('❌ deleteAssetWithFile error:', error);
    throw error;
  }
}

/**
 * Upload file to Supabase Storage and create asset record
 */
export async function uploadAsset(
  userId: string,
  file: File,
  label: string,
  description?: string
): Promise<{ asset: AssetRecord; publicUrl: string }> {
  try {
    // 1. Upload file to Storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ File upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ File uploaded:', uploadData.path);

    // 2. Get public URL (for signed URL generation later)
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    // 3. Create asset record in database
    const asset = await createAsset({
      user_id: userId,
      label: label || file.name,
      description,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    });

    return { asset, publicUrl };
  } catch (error) {
    console.error('❌ uploadAsset error:', error);
    throw error;
  }
}

/**
 * Create a metadata-only asset (no file upload)
 * Used for: colors, URLs, changelog entries, etc.
 */
export async function createMetadataAsset(
  userId: string,
  label: string,
  description: string
): Promise<AssetRecord> {
  try {
    console.log('🔵 Creating metadata asset:', { userId, label, description });

    const asset = await createAsset({
      user_id: userId,
      label,
      description,
      file_path: null,
      file_size: null,
      mime_type: null,
    });

    console.log('✅ Metadata asset created:', asset.id);
    return asset;
  } catch (error) {
    console.error('❌ createMetadataAsset error:', error);
    throw error;
  }
}

/**
 * Update a metadata-only asset
 */
export async function updateMetadataAsset(
  assetId: string,
  updates: { label?: string; description?: string }
): Promise<void> {
  try {
    console.log('🔵 Updating metadata asset:', assetId, updates);

    const { error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', assetId);

    if (error) {
      console.error('❌ updateMetadataAsset error:', error);
      throw error;
    }

    console.log('✅ Metadata asset updated:', assetId);
  } catch (error) {
    console.error('❌ updateMetadataAsset error:', error);
    throw error;
  }
}

/**
 * Get signed URL for a private asset
 */
export async function getAssetSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('assets')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('❌ getAssetSignedUrl error:', error);
    throw error;
  }

  return data.signedUrl;
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