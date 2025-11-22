import { supabase } from './supabase/client';
import { upsertProfile, getProfile } from './supabase/db';

/**
 * Initialize or update user profile in 'profiles' table after successful auth.
 * Returns the complete profile including is_admin flag.
 */
export async function initUserProfile() {
  try {
    // Get the authenticated user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError);
      throw new Error('Not authenticated');
    }

    console.log('🔵 Initializing user profile for:', user.email);

    // 1. Try to get existing profile first to check for is_admin and client_id
    let existingProfile = null;
    try {
      existingProfile = await getProfile(user.id);
      console.log('🔵 Existing profile:', existingProfile);
    } catch (profileError: any) {
      console.error('⚠️ Could not fetch existing profile (table may not exist):', profileError);
      
      // If it's a table/schema error, throw with a clear message
      if (profileError.message?.includes('relation') || 
          profileError.message?.includes('does not exist') ||
          profileError.code === '42P01') {
        throw new Error('Database table "profiles" does not exist. Please run the setup SQL script in your Supabase Dashboard.');
      }
      
      // For other errors, continue without existing profile
      console.log('🔵 Continuing without existing profile...');
    }

    // 2. Prepare user profile data
    // We respect existing is_admin status if present
    // We generate a client_id if one doesn't exist (migrating from legacy logic)
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      company: user.user_metadata?.company || 'Company',
      client_id: user.user_metadata?.clientId || existingProfile?.client_id || crypto.randomUUID(),
      is_admin: existingProfile?.is_admin || false, // IMPORTANT: Preserve is_admin from database
    };

    console.log('🔵 Upserting user profile to table:', {
      ...profileData,
      is_admin: profileData.is_admin // Explicitly log is_admin
    });

    // 3. Upsert to profiles table (replaces KV store logic)
    let savedProfile;
    try {
      savedProfile = await upsertProfile(profileData);
      
      console.log('✅ User profile initialized:', {
        id: savedProfile.id,
        email: savedProfile.email,
        is_admin: savedProfile.is_admin, // Explicitly log is_admin
        client_id: savedProfile.client_id
      });
    } catch (upsertError: any) {
      console.error('❌ Failed to upsert profile:', upsertError);
      
      // If it's a table/schema error, throw with a clear message
      if (upsertError.message?.includes('relation') || 
          upsertError.message?.includes('does not exist') ||
          upsertError.message?.includes('policy') ||
          upsertError.code === '42P01' ||
          upsertError.code === '42501') {
        throw new Error('Database error: profiles table not configured properly. Please run the setup SQL script.');
      }
      
      throw upsertError;
    }

    // Store session data in localStorage (Legacy compat + currentUser state)
    const session = await supabase.auth.getSession();
    if (session.data.session) {
      localStorage.setItem('sb_access_token', session.data.session.access_token);
      localStorage.setItem('user_data', JSON.stringify({
        id: user.id,
        email: user.email,
        name: savedProfile.full_name,
        clientId: savedProfile.client_id,
        is_admin: savedProfile.is_admin // IMPORTANT: Store is_admin in localStorage too
      }));
    }

    // Return the complete profile WITH is_admin flag
    return {
      id: savedProfile.id,
      email: savedProfile.email,
      full_name: savedProfile.full_name,
      company: savedProfile.company,
      client_id: savedProfile.client_id,
      is_admin: savedProfile.is_admin, // IMPORTANT: Expose is_admin to the app
      created_at: savedProfile.created_at,
      updated_at: savedProfile.updated_at
    };
  } catch (error: any) {
    console.error('❌ Error initializing user profile:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

/**
 * Sign in with email and password using Supabase Auth
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    console.log('🔵 Signing in with email/password:', email);
    console.log('🔵 Note: Not using timeout for login - will wait for Supabase to respond');

    // NO TIMEOUT on login - let it take as long as it needs
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }

    console.log('✅ Supabase auth successful');

    // Initialize/update user profile
    await initUserProfile();

    return data;
  } catch (error: any) {
    console.error('❌ Sign in with password failed:', error);
    throw new Error(error.message || 'Sign in failed');
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string, metadata?: { name?: string; company?: string }) {
  try {
    console.log('🔵 Signing up with email/password:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }

    console.log('✅ Supabase signup successful');

    // If email confirmation is not required, initialize profile
    if (data.session) {
      await initUserProfile();
    }

    return data;
  } catch (error: any) {
    console.error('❌ Sign up failed:', error);
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    console.log('🔵 Signing out...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }

    // Clear localStorage
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_email');

    console.log('✅ Signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out failed:', error);
    throw new Error(error.message || 'Sign out failed');
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    console.log('🔵 Requesting session from Supabase...');
    const startTime = Date.now();
    
    const { data: { session }, error } = await supabase.auth.getSession();

    const duration = Date.now() - startTime;
    console.log(`🔵 Session check completed in ${duration}ms`);

    if (error) {
      console.error('❌ Get session error:', error);
      return null;
    }

    if (session) {
      console.log('✅ Active session found');
      return session;
    }

    console.log('❌ No active session');
    return null;
  } catch (error: any) {
    console.error('❌ Failed to get session:', error);
    // Return null instead of throwing so the app can show login screen
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    console.log('🔵 Requesting user from Supabase...');
    const startTime = Date.now();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    const duration = Date.now() - startTime;
    console.log(`🔵 User check completed in ${duration}ms`);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error: any) {
    console.error('❌ Failed to get user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    console.log('🔵 Checking authentication...');
    const session = await getCurrentSession();
    
    if (session) {
      console.log('✅ User is authenticated');
      return true;
    } else {
      console.log('❌ User is not authenticated');
      return false;
    }
  } catch (error) {
    console.error('❌ isAuthenticated failed:', error);
    return false;
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔵 Testing Supabase connection...');
    const startTime = Date.now();
    
    // Try a simple health check
    const { data, error } = await supabase.auth.getSession();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error: error.message, duration };
    }
    
    console.log(`✅ Supabase connection successful (${duration}ms)`);
    return { success: true, duration };
  } catch (error: any) {
    console.error('❌ Supabase connection test error:', error);
    return { success: false, error: error.message };
  }
}