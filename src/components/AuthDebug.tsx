import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';

export function AuthDebug() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    setSession(session);
    setUser(user);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">Loading auth info...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-[24px] text-[#111111] mb-4">Auth Debug Info</h2>
        
        <div className="space-y-4">
          {/* Session Info */}
          <div>
            <h3 className="text-[18px] text-[#111111] mb-2">Session</h3>
            {session ? (
              <div className="bg-green-50 border border-green-200 rounded-[12px] p-3">
                <div className="text-sm space-y-1">
                  <div><strong>Access Token:</strong> {session.access_token?.substring(0, 20)}...</div>
                  <div><strong>Expires At:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</div>
                  <div><strong>Token Type:</strong> {session.token_type}</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 text-sm text-red-600">
                No active session
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-[18px] text-[#111111] mb-2">User</h3>
            {user ? (
              <div className="bg-green-50 border border-green-200 rounded-[12px] p-3">
                <div className="text-sm space-y-1">
                  <div><strong>ID:</strong> {user.id}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
                  <div><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 text-sm text-red-600">
                No authenticated user
              </div>
            )}
          </div>

          {/* localStorage */}
          <div>
            <h3 className="text-[18px] text-[#111111] mb-2">localStorage</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-3">
              <div className="text-sm space-y-1">
                <div><strong>user_data:</strong> {localStorage.getItem('user_data') || 'Not set'}</div>
                <div><strong>sb_access_token:</strong> {localStorage.getItem('sb_access_token') ? 'Present' : 'Not set'}</div>
              </div>
            </div>
          </div>

          {/* URL Hash */}
          <div>
            <h3 className="text-[18px] text-[#111111] mb-2">URL Hash</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-3">
              <div className="text-sm break-all">
                {window.location.hash || 'No hash in URL'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={checkAuth} variant="outline">
              Refresh
            </Button>
            <Button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              variant="outline"
            >
              Clear localStorage
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-[24px] p-6">
        <h3 className="text-[18px] text-[#111111] mb-2">Testing Magic Link</h3>
        <ol className="text-sm space-y-2 list-decimal list-inside">
          <li>Go back to login page</li>
          <li>Click "Use magic link instead"</li>
          <li>Enter your email (e.g., camille@jointhequest.co)</li>
          <li>Click "Send Magic Link"</li>
          <li>Check your email inbox (and spam folder)</li>
          <li>Click the link in the email</li>
          <li>You should be redirected here with auth tokens in URL</li>
          <li>The app should automatically log you in</li>
        </ol>
      </div>
    </div>
  );
}
