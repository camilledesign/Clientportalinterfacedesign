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
}

export function AdminDashboard({ onSelectClient }: AdminDashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ 
    name: '', 
    email: '', 
    status: 'active' as 'active' | 'paused',
    userName: '',
    password: '',
    confirmPassword: ''
  });
  const [showDatabaseViewer, setShowDatabaseViewer] = useState(false);
  const [databaseData, setDatabaseData] = useState<any>(null);
  const [loadingDatabase, setLoadingDatabase] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

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
      
      console.log('✅ Profiles loaded:', data);
      setClients(data || []);
    } catch (err: any) {
      console.error("❌ Error loading clients:", err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      setError(null);
      console.log('Starting database seed...');
      await seedDatabase();
      console.log('Seed complete, reloading clients...');
      await loadClients();
      alert('✅ Database seeded successfully!');
    } catch (err: any) {
      console.error("Error seeding database:", err);
      setError(err.message || 'Failed to seed database');
      alert(`❌ Failed to seed database: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      console.log('🧪 Testing connection...');
      console.log('Token from localStorage:', token ? token.substring(0, 8) + '...' : 'NONE');
      
      // Test health endpoint
      const healthResponse = await fetch('https://jqdmpwuzthojykzyhevh.supabase.co/functions/v1/make-server-a93d7fb4/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', healthData);
      
      // Test debug sessions endpoint
      const sessionsResponse = await fetch('https://jqdmpwuzthojykzyhevh.supabase.co/functions/v1/make-server-a93d7fb4/debug/sessions');
      const sessionsData = await sessionsResponse.json();
      console.log('🔍 Sessions in DB:', sessionsData);
      
      alert(`Health: ${JSON.stringify(healthData)}\n\nSessions: ${JSON.stringify(sessionsData)}\n\nYour token: ${token ? token.substring(0, 8) + '...' : 'NONE'}`);
    } catch (err: any) {
      console.error('Connection test failed:', err);
      alert(`Connection test failed: ${err.message}`);
    }
  };

  const handleReauthenticate = () => {
    // Clear the old session and force re-auth
    localStorage.removeItem('admin_session_token');
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

  const activeClients = clients.filter(c => c.status === "active").length;
  const pausedClients = clients.filter(c => c.status === "paused").length;
  const totalRequests = clients.reduce((sum, c) => sum + (c.activeRequests || 0), 0);

  const handleViewDatabase = async () => {
    try {
      setLoadingDatabase(true);
      const data = await getDatabaseDebugInfo();
      setDatabaseData(data);
      setShowDatabaseViewer(true);
    } catch (err: any) {
      alert(`Failed to load database: ${err.message}`);
    } finally {
      setLoadingDatabase(false);
    }
  };

  const handleClearUnwantedData = async () => {
    if (!confirm('Are you sure you want to clear old sessions and admin sessions from the database?')) {
      return;
    }
    
    try {
      await clearDatabase(['session:', 'admin_session:']);
      alert('✅ Unwanted data cleared from database');
      // Reload database view
      await handleViewDatabase();
    } catch (err: any) {
      alert(`Failed to clear database: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] text-[#111111] mb-2">Clients Overview</h1>
          <p className="text-[rgba(0,0,0,0.5)]">Manage all client accounts and subscriptions</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="rounded-full bg-gray-100 hover:bg-gray-200 text-[#111111] px-6 py-6" 
            onClick={handleViewDatabase}
            disabled={loadingDatabase}
          >
            {loadingDatabase ? "Loading..." : "🔍 View Database"}
          </Button>
          <Button 
            className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-6" 
            onClick={() => setCreatingClient(true)}
          >
            + Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Total Clients</div>
          <div className="text-[32px] text-[#111111]">{clients.length}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Active</div>
          <div className="text-[32px] text-green-600">{activeClients}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Paused</div>
          <div className="text-[32px] text-[rgba(0,0,0,0.3)]">{pausedClients}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[rgba(0,0,0,0.5)] text-sm mb-2">Total Requests</div>
          <div className="text-[32px] text-[#0071E3]">{totalRequests}</div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[rgba(0,0,0,0.5)]">Loading clients...</div>
        ) : error ? (
          <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={loadClients}
                className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
              >
                Retry
              </Button>
              <Button 
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              >
                {seeding ? "Seeding..." : "🌱 Seed Database"}
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('admin_session_token');
                  window.location.reload();
                }}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white px-6 py-3"
              >
                Reauthenticate
              </Button>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[rgba(0,0,0,0.5)] mb-4">No clients yet. Seed the database to get started.</p>
            <Button 
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
            >
              {seeding ? "Seeding Database..." : "🌱 Seed Database"}
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F5F7]">
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Client Name</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Email</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Active Requests</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Last Activity</th>
                <th className="text-left py-4 px-6 text-sm text-[rgba(0,0,0,0.5)]">Status</th>
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
                    <span className="text-[rgba(0,0,0,0.3)]">0</span>
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

      {/* Edit Client Dialog */}
      <Dialog open={editingClient !== null} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="bg-white rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={editingClient?.name || ''}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="rounded-[12px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editingClient?.email || ''}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, email: e.target.value } : null)}
                className="rounded-[12px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editingClient?.status || 'active'}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, status: e.target.value as "active" | "paused" } : null)}
                className="w-full rounded-[12px] border border-[#E5E5E7] px-4 py-2.5 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingClient(null)}
              className="rounded-[12px] border-[#E5E5E7] px-6 py-2.5"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editingClient) {
                  try {
                    await updateClient(editingClient.id, {
                      name: editingClient.name,
                      email: editingClient.email,
                      status: editingClient.status
                    });
                    await loadClients();
                    setEditingClient(null);
                  } catch (err: any) {
                    alert(`Failed to update client: ${err.message}`);
                  }
                }
              }}
              className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-2.5"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <Dialog open={deletingClient !== null} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <DialogContent className="bg-white rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Confirm deletion of this client and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[rgba(0,0,0,0.7)] mb-2">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="bg-[#F5F5F7] rounded-[12px] p-4 mt-4">
              <p className="text-sm text-[rgba(0,0,0,0.5)] mb-1">Client Name</p>
              <p className="text-[#111111]">{deletingClient?.name}</p>
              <p className="text-sm text-[rgba(0,0,0,0.5)] mt-3 mb-1">Email</p>
              <p className="text-[#111111]">{deletingClient?.email}</p>
            </div>
            <p className="text-red-600 text-sm mt-4">
              ⚠️ This will also delete all associated requests and assets.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDeletingClient(null)}
              className="rounded-[12px] border-[#E5E5E7] px-6 py-2.5"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (deletingClient) {
                  try {
                    await deleteClient(deletingClient.id);
                    await loadClients();
                    setDeletingClient(null);
                  } catch (err: any) {
                    alert(`Failed to delete client: ${err.message}`);
                  }
                }
              }}
              className="rounded-[12px] bg-red-600 hover:bg-red-700 text-white px-6 py-2.5"
            >
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={creatingClient} onOpenChange={(open) => !open && setCreatingClient(false)}>
        <DialogContent className="bg-white rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle>Create Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                className="rounded-[12px]"
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <Input
                id="userName"
                value={newClient.userName}
                onChange={(e) => setNewClient(prev => ({ ...prev, userName: e.target.value }))}
                className="rounded-[12px]"
                placeholder="User's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-[12px]"
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newClient.password}
                onChange={(e) => setNewClient(prev => ({ ...prev, password: e.target.value }))}
                className="rounded-[12px]"
                placeholder="Create a password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={newClient.confirmPassword}
                onChange={(e) => setNewClient(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="rounded-[12px]"
                placeholder="Confirm password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={newClient.status}
                onChange={(e) => setNewClient(prev => ({ ...prev, status: e.target.value as "active" | "paused" }))}
                className="w-full rounded-[12px] border border-[#E5E5E7] px-4 py-2.5 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setCreatingClient(false)}
              className="rounded-[12px] border-[#E5E5E7] px-6 py-2.5"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // Validation
                if (!newClient.name || !newClient.email) {
                  alert('Please fill in company name and email');
                  return;
                }
                
                if (!newClient.password || !newClient.confirmPassword) {
                  alert('Please enter and confirm a password');
                  return;
                }
                
                if (newClient.password !== newClient.confirmPassword) {
                  alert('Passwords do not match');
                  return;
                }
                
                if (newClient.password.length < 4) {
                  alert('Password must be at least 4 characters long');
                  return;
                }
                
                try {
                  const result = await createClient({
                    name: newClient.name,
                    email: newClient.email,
                    status: newClient.status,
                    password: newClient.password,
                    userName: newClient.userName || newClient.name
                  });
                  
                  await loadClients();
                  setNewClient({ 
                    name: '', 
                    email: '', 
                    status: 'active',
                    userName: '',
                    password: '',
                    confirmPassword: ''
                  });
                  setCreatingClient(false);
                  
                  if (result.userCreated) {
                    alert(`✅ Client created successfully!\n\nLogin credentials:\nEmail: ${newClient.email}\nPassword: ${newClient.password}`);
                  } else {
                    alert('✅ Client created successfully!');
                  }
                } catch (err: any) {
                  alert(`Failed to create client: ${err.message}`);
                }
              }}
              className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-2.5"
            >
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Database Viewer Dialog */}
      <Dialog open={showDatabaseViewer} onOpenChange={(open) => !open && setShowDatabaseViewer(false)}>
        <DialogContent className="bg-white rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle>Database Viewer</DialogTitle>
            <DialogDescription>
              View and manage database contents.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[rgba(0,0,0,0.7)] mb-2">
              This is a debug view of the database. Use with caution.
            </p>
            <div className="bg-[#F5F5F7] rounded-[12px] p-4 mt-4">
              <p className="text-sm text-[rgba(0,0,0,0.5)] mb-1">Database Data</p>
              <pre className="text-[#111111] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {loadingDatabase ? 'Loading...' : JSON.stringify(databaseData, null, 2)}
              </pre>
            </div>
            <p className="text-red-600 text-sm mt-4">
              ⚠️ Be careful when modifying data directly.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDatabaseViewer(false)}
              className="rounded-[12px] border-[#E5E5E7] px-6 py-2.5"
            >
              Close
            </Button>
            <Button
              onClick={handleClearUnwantedData}
              className="rounded-[12px] bg-red-600 hover:bg-red-700 text-white px-6 py-2.5"
            >
              Clear Unwanted Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}