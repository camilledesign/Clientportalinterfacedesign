import { AdminPanel } from "./components/admin/AdminPanel";
import { Login } from "./components/Login";
import { DatabaseCleanup } from "./components/DatabaseCleanup";
import { AuthDebug } from "./components/AuthDebug";
import { SupabaseRLSTest } from "./components/SupabaseRLSTest";
import { DatabaseSetup } from "./components/DatabaseSetup";
import { isAuthenticated, initUserProfile } from "./utils/auth";
import { supabase } from "./utils/supabase/client";
import { projectId } from "./utils/supabase/info";
import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { RequestSection } from "./components/RequestSection";
import { AssetsLibrary } from "./components/AssetsLibrary";
import { RequestHistory } from "./components/RequestHistory";
import { Profile } from "./components/Profile";
import { WebsiteRequestForm } from "./components/forms/WebsiteRequestForm";
import { BrandRequestForm } from "./components/forms/BrandRequestForm";
import { ProductRequestForm } from "./components/forms/ProductRequestForm";

type MainSection = "new-request" | "asset-library" | "request-history" | "profile" | "admin";
type FormView = "website-form" | "brand-form" | "product-form" | null;

export default function App() {
  const [activeSection, setActiveSection] = useState<MainSection>("new-request");
  const [activeForm, setActiveForm] = useState<FormView>(null);
  const [initialRequestType, setInitialRequestType] = useState<string>("");
  const [isAuth, setIsAuth] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showCleanup, setShowCleanup] = useState(false);
  const [showAuthDebug, setShowAuthDebug] = useState(false);
  const [showRLSTest, setShowRLSTest] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [needsDbSetup, setNeedsDbSetup] = useState(false);

  // Check for admin hash on mount and listen for changes
  useEffect(() => {
    const checkAdminRoute = () => {
      const hash = window.location.hash;
      
      // Only check for admin/cleanup if it's not an auth callback
      if (!hash.includes('access_token')) {
        const isCleanup = hash === "#cleanup";
        const isDebug = hash === "#auth-debug";
        const isRLSTest = hash === "#rls-test";
        setShowCleanup(isCleanup);
        setShowAuthDebug(isDebug);
        setShowRLSTest(isRLSTest);
      }
    };

    // Check on mount
    checkAdminRoute();

    // Listen for hash changes
    window.addEventListener("hashchange", checkAdminRoute);

    return () => {
      window.removeEventListener("hashchange", checkAdminRoute);
    };
  }, []);

  // Check authentication status on mount and listen for auth changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔵 Starting auth check...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        const authenticated = !!user && !error;
        console.log('🔵 Auth check result:', authenticated);
        
        if (authenticated) {
          try {
            console.log('🔵 User is authenticated, initializing profile...');
            const profile = await initUserProfile();
            console.log('✅ Profile initialized successfully:', profile);
            setCurrentUser(profile);
            setAuthError(null);
          } catch (error: any) {
            console.error('❌ Failed to initialize user profile:', error);
            // Don't block the UI - just log the error
            setCurrentUser(null);
            setAuthError(null);
          }
        } else {
          setCurrentUser(null);
        }
        
        setIsAuth(authenticated);
      } catch (error: any) {
        console.error('❌ Auth check failed:', error);
        setIsAuth(false);
        setCurrentUser(null);
        setAuthError(null);
      } finally {
        // ALWAYS set isCheckingAuth to false so we never get stuck on "Loading..."
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔵 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in via auth state change');
        try {
          const profile = await initUserProfile();
          setCurrentUser(profile);
          setIsAuth(true);
          setAuthError(null);
        } catch (error: any) {
          console.error('Failed to initialize user profile:', error);
          setAuthError(null); // Don't block UI
        } finally {
          setIsCheckingAuth(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('✅ User signed out via auth state change');
        setIsAuth(false);
        setCurrentUser(null);
        setAuthError(null);
        setIsCheckingAuth(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  const handleBackToDashboard = () => {
    setActiveForm(null);
    setActiveSection("new-request");
  };

  const handleProfileClick = () => {
    setActiveForm(null);
    setActiveSection("profile");
  };

  const handleCategoryChange = (category: "brand" | "website" | "product") => {
    setActiveForm(`${category}-form` as FormView);
  };

  const handleNavigateToForm = (formType: "website-form" | "brand-form" | "product-form", requestType: string) => {
    setActiveForm(formType);
    setInitialRequestType(requestType);
  };

  // Show cleanup panel if accessing cleanup route
  if (showCleanup) {
    return <DatabaseCleanup />;
  }

  // Show auth debug panel if accessing auth debug route
  if (showAuthDebug) {
    return <AuthDebug />;
  }

  // Show RLS test panel if accessing RLS test route
  if (showRLSTest) {
    return <SupabaseRLSTest />;
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-[rgba(0,0,0,0.5)]">Loading...</div>
      </div>
    );
  }

  // Show error if there's an auth error (e.g., database not configured)
  if (authError && isAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-6 text-5xl text-center">⚠️</div>
            <h2 className="text-[24px] text-[#111111] mb-4 text-center">Database Configuration Required</h2>
            <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
              <p className="text-sm text-red-600 mb-2">{authError}</p>
            </div>
            <div className="bg-[#F5F5F7] rounded-[12px] p-6 mb-6">
              <h3 className="text-sm mb-3 text-[#111111]">To fix this, run the following SQL in your Supabase Dashboard:</h3>
              <pre className="text-xs bg-white p-4 rounded-[8px] overflow-x-auto border border-[rgba(0,0,0,0.1)] mb-4">
{`-- 1. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  company TEXT,
  client_id TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;`}
              </pre>
              <p className="text-xs text-[rgba(0,0,0,0.5)]">
                Navigate to: Supabase Dashboard → SQL Editor → New Query → Paste the above SQL → Run
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] py-3 transition-all"
              >
                Refresh Page
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="flex-1 bg-white border border-[rgba(0,0,0,0.1)] text-[#111111] hover:bg-[#F5F5F7] rounded-[12px] py-3 transition-all"
              >
                Sign Out
              </button>
            </div>
            <div className="mt-4 text-center">
              <a
                href="#cleanup"
                className="text-sm text-[#0071E3] hover:text-[#0077ED] transition-colors"
              >
                Or use the Database Cleanup Tool
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if auth check timed out (connection issue)
  if (authError && !isAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-6 text-5xl text-center">🔌</div>
            <h2 className="text-[24px] text-[#111111] mb-4 text-center">Connection Issue</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-4 mb-6">
              <p className="text-sm text-yellow-800 mb-2">{authError}</p>
            </div>
            <div className="bg-[#F5F5F7] rounded-[12px] p-6 mb-6">
              <h3 className="text-sm mb-3 text-[#111111]">Troubleshooting steps:</h3>
              <ol className="text-sm text-[rgba(0,0,0,0.6)] space-y-2 list-decimal ml-5">
                <li>Check your internet connection</li>
                <li>Verify your Supabase project is active at <a href={`https://supabase.com/dashboard/project/${projectId}`} target="_blank" rel="noopener noreferrer" className="text-[#0071E3] hover:underline">supabase.com</a></li>
                <li>Make sure the project ID and anon key are correct in the configuration</li>
                <li>Try refreshing the page</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] py-3 transition-all"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  setAuthError(null);
                  setIsCheckingAuth(true);
                  window.location.reload();
                }}
                className="flex-1 bg-white border border-[rgba(0,0,0,0.1)] text-[#111111] hover:bg-[#F5F5F7] rounded-[12px] py-3 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuth) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // Show admin panel if user is admin
  if (currentUser?.is_admin) {
    return <AdminPanel />;
  }

  // If a form is active, show the form
  if (activeForm === "website-form") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <WebsiteRequestForm 
          onBack={handleBackToDashboard}
          onCategoryChange={handleCategoryChange}
          initialRequestType={initialRequestType}
        />
        <Footer />
      </div>
    );
  }

  if (activeForm === "brand-form") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <BrandRequestForm 
          onBack={handleBackToDashboard}
          onCategoryChange={handleCategoryChange}
          initialRequestType={initialRequestType}
        />
        <Footer />
      </div>
    );
  }

  if (activeForm === "product-form") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <ProductRequestForm 
          onBack={handleBackToDashboard}
          onCategoryChange={handleCategoryChange}
          initialRequestType={initialRequestType}
        />
        <Footer />
      </div>
    );
  }

  // Main dashboard with three sections
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navigation onProfileClick={handleProfileClick} />
      
      <main className="w-full px-12 py-8">
        {/* Three Large Toggle Buttons */}
        <div className="mb-10">
          <div className="flex gap-8 justify-center items-center">
            <button
              onClick={() => setActiveSection("new-request")}
              className={`relative pb-3 transition-all ${
                activeSection === "new-request"
                  ? "text-[#111111]"
                  : "text-[rgba(0,0,0,0.4)] hover:text-[rgba(0,0,0,0.6)]"
              }`}
            >
              <span className="text-[22px] block">New Request</span>
              {activeSection === "new-request" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071E3] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSection("asset-library")}
              className={`relative pb-3 transition-all ${
                activeSection === "asset-library"
                  ? "text-[#111111]"
                  : "text-[rgba(0,0,0,0.4)] hover:text-[rgba(0,0,0,0.6)]"
              }`}
            >
              <span className="text-[22px] block">Asset Library</span>
              {activeSection === "asset-library" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071E3] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSection("request-history")}
              className={`relative pb-3 transition-all ${
                activeSection === "request-history"
                  ? "text-[#111111]"
                  : "text-[rgba(0,0,0,0.4)] hover:text-[rgba(0,0,0,0.6)]"
              }`}
            >
              <span className="text-[22px] block">Request History</span>
              {activeSection === "request-history" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071E3] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content based on active section */}
        <div className="space-y-12">
          {activeSection === "new-request" && (
            <RequestSection onNavigateToForm={handleNavigateToForm} />
          )}
          
          {activeSection === "asset-library" && (
            <AssetsLibrary />
          )}
          
          {activeSection === "request-history" && (
            <RequestHistory />
          )}
          
          {activeSection === "profile" && (
            <Profile onBack={handleBackToDashboard} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}