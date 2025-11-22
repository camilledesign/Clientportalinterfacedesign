import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Log configuration for debugging
console.log('🔵 Initializing Supabase client...');
console.log('🔵 Project ID:', projectId);
console.log('🔵 Supabase URL:', `https://${projectId}.supabase.co`);
console.log('🔵 Anon Key (first 20 chars):', publicAnonKey.substring(0, 20) + '...');

// Create Supabase client for frontend
export const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
  }
);

console.log('✅ Supabase client initialized');