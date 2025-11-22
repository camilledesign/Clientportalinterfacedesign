import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut } from "lucide-react";
import profileImage from 'figma:asset/09a506315f8c8fec25acae2f02c2bbe6694afef2.png';
import { supabase } from "../utils/supabase/client";

interface NavigationProps {
  onProfileClick?: () => void;
}

export function Navigation({ onProfileClick }: NavigationProps) {
  // Get user data from localStorage (set by initUserProfile)
  const userDataStr = localStorage.getItem('user_data');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const userName = userData?.name || userData?.email?.split('@')[0] || "Client";
  
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

  return (
    <nav className="border-b border-[rgba(0,0,0,0.06)] bg-[rgba(248,248,250,0.92)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profileImage} />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          <span className="text-[#111111]">Camille HAÏDAR</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onProfileClick}
            className="text-[rgba(0,0,0,0.6)] hover:text-[#111111] transition-colors"
          >
            {userName}
          </button>
          <button 
            onClick={handleLogout}
            className="text-[rgba(0,0,0,0.6)] hover:text-[#111111] transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}