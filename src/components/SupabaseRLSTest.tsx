import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { getProfile, upsertProfile, kvSet, kvGet } from '../utils/supabase/db';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * Supabase RLS Test Component
 * 
 * This component validates:
 * 1. ✅ Supabase client is initialized with SUPABASE_URL + SUPABASE_ANON_KEY
 * 2. ✅ Auth session token is available for RLS
 * 3. ✅ Profile Table CRUD
 * 4. ✅ KV Store CRUD (Legacy)
 */
export function SupabaseRLSTest() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kvTestValue, setKvTestValue] = useState('');
  const [kvResult, setKvResult] = useState<string | null>(null);

  // Check auth session on mount
  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Checking Supabase auth session...');
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      setError(`Session error: ${sessionError.message}`);
      return;
    }

    setSession(session);

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
      if (userError.message.includes('Auth session missing')) {
        setError('You are not logged in. Please log in to run these tests.');
      } else {
        setError(`User error: ${userError.message}`);
      }
      return;
    }

    setUser(user);

    if (user) {
      loadProfile(user.id);
    } else {
      setError('No authenticated user. Please log in first.');
    }
  };

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      console.log('🔍 Loading profile for:', userId);
      const data = await getProfile(userId);
      setProfile(data);
      console.log('✅ Profile loaded:', data);
    } catch (err: any) {
      console.error('❌ Profile load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const updates = {
        id: user.id,
        full_name: profile?.full_name || user.email?.split('@')[0],
        company: profile?.company || 'My Company',
        is_admin: profile?.is_admin || false,
      };

      console.log('🔄 Updating profile:', updates);
      const data = await upsertProfile(updates);
      setProfile(data);
      console.log('✅ Profile updated:', data);
    } catch (err: any) {
      console.error('❌ Profile update error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKvTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const key = `test:${user?.id}`;
      const val = `Test Value ${new Date().toLocaleTimeString()}`;
      
      console.log(`🔑 Setting KV: ${key} = ${val}`);
      await kvSet(key, val);
      
      console.log(`🔑 Reading KV: ${key}`);
      const readVal = await kvGet(key);
      setKvResult(readVal);
      console.log(`✅ KV Read Result: ${readVal}`);
    } catch (err: any) {
      console.error('❌ KV error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
        <h1 className="text-[32px] text-[#111111] mb-2">Supabase Architecture Test</h1>
        <p className="text-[rgba(0,0,0,0.6)]">
          Validating new multi-tenant architecture and RLS policies
        </p>
      </div>

      {/* Auth Status */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-[24px] text-[#111111] mb-4">1️⃣ Current User</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${session ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[16px]">
              {user ? `Logged in as: ${user.email}` : 'Not logged in'}
            </span>
            {!user && (
              <Button 
                onClick={() => window.location.hash = ''} 
                variant="outline" 
                size="sm"
                className="ml-4"
              >
                Go to Login
              </Button>
            )}
          </div>

          {session && (
             <div className="bg-gray-50 rounded-[12px] p-3 mt-3 text-sm font-mono text-[rgba(0,0,0,0.6)]">
                User ID: {user?.id}
             </div>
          )}
        </div>
      </div>

      {/* Profile Table Test */}
      {user && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[24px] text-[#111111]">2️⃣ Profile Table (RLS)</h2>
            <Button onClick={() => loadProfile(user.id)} variant="outline" size="sm">
              Refresh Profile
            </Button>
          </div>
          
          {profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[rgba(0,0,0,0.6)] mb-1">Full Name</label>
                  <Input 
                    value={profile.full_name || ''} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[rgba(0,0,0,0.6)] mb-1">Company</label>
                  <Input 
                    value={profile.company || ''} 
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-[12px] flex items-center justify-between">
                <span className="text-sm font-medium">Admin Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.is_admin ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {profile.is_admin ? 'ADMIN' : 'USER'}
                </span>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-[rgba(0,0,0,0.4)]">
              {loading ? 'Loading profile...' : 'No profile found. Click Update to create one.'}
              {!loading && (
                 <div className="mt-4">
                    <Button onClick={handleUpdateProfile}>Create Profile</Button>
                 </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legacy KV Test */}
      {user && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-[24px] text-[#111111] mb-4">3️⃣ Legacy KV Store</h2>
          <p className="text-sm text-[rgba(0,0,0,0.6)] mb-4">
             Testing backward compatibility for non-critical data.
          </p>
          
          <div className="flex items-center gap-4">
             <Button onClick={handleKvTest} variant="outline" disabled={loading}>
               Test KV Write/Read
             </Button>
             {kvResult && (
               <span className="text-green-600 text-sm">
                 ✅ Read back: "{kvResult}"
               </span>
             )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-6">
          <h3 className="text-[18px] text-red-800 mb-2">❌ Error</h3>
          <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
        </div>
      )}
    </div>
  );
}
