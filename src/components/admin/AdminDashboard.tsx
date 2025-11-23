import { Eye } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  email: string;
  company: string;
  client_id: string;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

interface AdminDashboardProps {
  onSelectClient: (clientId: string) => void;
  globalRefreshToken?: number;
}

export function AdminDashboard({ onSelectClient, globalRefreshToken = 0 }: AdminDashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📊 Loading clients from public.profiles...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error loading profiles:', error);
          throw error;
        }
        
        if (!isMounted) return;
        
        console.log('✅ Profiles loaded:', data);
        setClients(data || []);
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error("❌ Error loading clients:", err);
        setError(err.message || 'Failed to load clients');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [globalRefreshToken]); // Re-fetch when globalRefreshToken changes

  // Retry function for error state
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger reload by incrementing a local counter or just directly fetching
    window.location.reload();
  };

  const formatLastActivity = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const activeClients = clients.filter(c => !c.is_admin).length;
  const adminClients = clients.filter(c => c.is_admin).length;
  const totalClients = clients.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] text-[#111111] mb-2">Clients Overview</h1>
          <p className="text-[rgba(0,0,0,0.5)]">Manage all client accounts and subscriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Total Users</div>
          <div className="text-[32px] text-[#111111]">{totalClients}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Clients</div>
          <div className="text-[32px] text-green-600">{activeClients}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Admins</div>
          <div className="text-[32px] text-purple-600">{adminClients}</div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[rgba(0,0,0,0.5)]">Loading clients...</div>
        ) : error ? (
          <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={handleRetry}
              className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
            >
              Retry
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[rgba(0,0,0,0.5)]">No users found in the database.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F5F7]">
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Name</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Email</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Company</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Created</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Type</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="text-[#111111]">{client.full_name || 'Unnamed'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[rgba(0,0,0,0.5)]">{client.email || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[rgba(0,0,0,0.5)]">{client.company || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[rgba(0,0,0,0.5)]">{formatLastActivity(client.created_at)}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                      client.is_admin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {client.is_admin ? "Admin" : "Client"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectClient(client.id)}
                      className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}