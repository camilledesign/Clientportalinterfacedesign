import { useState } from "react";
import { Search, Users, FileText, FolderOpen, Settings, LogOut } from "lucide-react";
import { AdminDashboard } from "./AdminDashboard";
import { AdminRequests } from "./AdminRequests";
import { AdminClientDetail } from "./AdminClientDetail";
import { supabase } from "../../utils/supabase/client";
import camilleImage from "figma:asset/09a506315f8c8fec25acae2f02c2bbe6694afef2.png";

// Removed "dashboard" from the View type
type View = "clients" | "requests" | "assets" | "settings" | "client-detail";

interface AdminPanelProps {
  globalRefreshToken?: number;
}

export function AdminPanel({ globalRefreshToken = 0 }: AdminPanelProps) {
  // Default view is now "clients" instead of "dashboard"
  const [currentView, setCurrentView] = useState<View>("clients");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user_data');
      localStorage.removeItem('sb_access_token');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView("client-detail");
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentView("clients"); // Changed from "dashboard" to "clients"
  };

  // Removed Dashboard nav item entirely
  const navItems = [
    { id: "clients", label: "Clients", icon: Users },
    { id: "requests", label: "Requests", icon: FileText },
    { id: "assets", label: "Assets", icon: FolderOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Top Navigation */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={camilleImage} 
              alt="Camille Haïdar" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="text-[#111111]">Camille Haïdar</div>
              <div className="text-xs text-[rgba(0,0,0,0.5)]">Admin Panel</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(0,0,0,0.3)]" />
              <input
                type="text"
                placeholder="Search clients, requests..."
                className="w-full pl-12 pr-4 py-2.5 bg-[#F5F5F7] rounded-[12px] border border-transparent outline-none focus:border-[#0071E3] focus:bg-white transition-all text-[#111111]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-[rgba(0,0,0,0.5)] hover:text-[#111111] hover:bg-[#F5F5F7] rounded-[12px] transition-all flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto px-8 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-[24px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-24">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentView === item.id ||
                (currentView === "client-detail" && item.id === "clients");

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    setSelectedClientId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all mb-1 ${
                    isActive
                      ? "bg-[#0071E3] text-white"
                      : "text-[rgba(0,0,0,0.6)] hover:bg-[#F5F5F7] hover:text-[#111111]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {currentView === "clients" && <AdminDashboard onSelectClient={handleSelectClient} globalRefreshToken={globalRefreshToken} />}
          {currentView === "requests" && <AdminRequests globalRefreshToken={globalRefreshToken} />}
          {currentView === "client-detail" && selectedClientId && (
            <AdminClientDetail clientId={selectedClientId} onBack={handleBackToClients} globalRefreshToken={globalRefreshToken} />
          )}
          {currentView === "assets" && (
            <div className="bg-white rounded-[24px] p-12 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
              <FolderOpen className="w-16 h-16 text-[rgba(0,0,0,0.2)] mx-auto mb-4" />
              <h2 className="text-[24px] text-[#111111] mb-2">Assets Library</h2>
              <p className="text-[rgba(0,0,0,0.5)]">Global assets management coming soon</p>
            </div>
          )}
          {currentView === "settings" && (
            <div className="bg-white rounded-[24px] p-12 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
              <Settings className="w-16 h-16 text-[rgba(0,0,0,0.2)] mx-auto mb-4" />
              <h2 className="text-[24px] text-[#111111] mb-2">Settings</h2>
              <p className="text-[rgba(0,0,0,0.5)]">Admin settings coming soon</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}