import { useState } from "react";
import { Button } from "./ui/button";
import { signInWithPassword } from "../utils/auth";

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log('🔵 Login: Attempting sign in for:', email);
      
      // NO TIMEOUT - let Supabase take as long as it needs
      // This will show a loading spinner, but won't artificially fail
      await signInWithPassword(email, password);
      
      console.log('✅ Login: Sign in successful');
      
      onSuccess();
    } catch (err: any) {
      console.error('❌ Login: Sign in error:', err);
      
      // Provide more specific error messages
      let errorMessage = "Login failed. Please check the console for details.";
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email before signing in";
      } else if (err.message?.includes('relation') || err.message?.includes('table') || err.message?.includes('policy') || err.message?.includes('profiles')) {
        errorMessage = "Database error. Please run the setup script (see error screen).";
        // Force a refresh to show the database setup screen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        errorMessage = "Network error. Cannot reach Supabase. Check if the project is paused or your internet connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] text-[#111111] mb-2">Client Portal</h1>
          <p className="text-[rgba(0,0,0,0.5)]">Sign in to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-[rgba(0,0,0,0.7)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] rounded-[12px] text-[#111111] placeholder-[rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent transition-all"
                placeholder="your@email.com"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm text-[rgba(0,0,0,0.7)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] rounded-[12px] text-[#111111] placeholder-[rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}