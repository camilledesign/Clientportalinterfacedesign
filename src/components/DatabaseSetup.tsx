import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";

export function DatabaseSetup() {
  const [copied, setCopied] = useState(false);

  const setupSQL = `-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  company TEXT,
  client_id TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS profiles_client_id_idx ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(setupSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] text-[#111111] mb-2">Database Setup Required</h1>
          <p className="text-[rgba(0,0,0,0.5)]">
            The profiles table needs to be created in your Supabase database
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="space-y-6">
            {/* Instructions */}
            <div>
              <h2 className="text-[20px] text-[#111111] mb-4">Setup Instructions</h2>
              <ol className="space-y-3 text-[rgba(0,0,0,0.7)]">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-sm">
                    1
                  </span>
                  <span>Open your Supabase Dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-sm">
                    2
                  </span>
                  <span>Go to the <strong>SQL Editor</strong> section</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-sm">
                    3
                  </span>
                  <span>Copy the SQL script below and paste it into the editor</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-sm">
                    4
                  </span>
                  <span>Click <strong>Run</strong> to execute the script</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-sm">
                    5
                  </span>
                  <span>Return here and refresh the page</span>
                </li>
              </ol>
            </div>

            {/* SQL Script */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] text-[#111111]">SQL Script</h3>
                <Button
                  onClick={handleCopy}
                  size="sm"
                  className="flex items-center gap-2"
                  variant={copied ? "default" : "outline"}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Script"}
                </Button>
              </div>
              <div className="bg-[#F5F5F7] rounded-[12px] p-4 overflow-auto max-h-[400px]">
                <pre className="text-xs text-[#111111] font-mono whitespace-pre">
                  {setupSQL}
                </pre>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> After running the SQL script, you'll need to create your first admin user
                in the Supabase Authentication section, then manually set <code className="bg-amber-100 px-1 rounded">is_admin = true</code> in
                the profiles table for that user.
              </p>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] py-3"
            >
              I've Run the Script - Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
