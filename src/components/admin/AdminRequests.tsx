import { useState, useEffect } from "react";
import { Globe, Palette, Smartphone, GripVertical, Eye, MoreVertical } from "lucide-react";
import { BriefModal } from "../BriefModal";
import { Button } from "../ui/button";
import { getRequests, updateRequestStatus } from "../../utils/api";

interface Request {
  id: string;
  clientName: string;
  title: string;
  category: "Website" | "Brand" | "Product";
  submitDate: string;
  status: "new" | "in-progress" | "waiting-feedback" | "done";
  priority?: "high" | "medium" | "low";
  brief: any;
}

const columns = [
  { id: "new", title: "New", color: "bg-blue-100 text-blue-700" },
  { id: "in-progress", title: "In Progress", color: "bg-purple-100 text-purple-700" },
  { id: "waiting-feedback", title: "Waiting for Feedback", color: "bg-orange-100 text-orange-700" },
  { id: "done", title: "Done", color: "bg-green-100 text-green-700" },
];

export function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client: "all",
    category: "all",
    priority: "all",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading requests...');
      const response = await getRequests();
      console.log('✅ Requests loaded:', response);
      setRequests(response.requests || []);
    } catch (error: any) {
      console.error('❌ Error loading requests:', {
        message: error.message,
        stack: error.stack
      });
      // Show a user-friendly alert
      alert(`Failed to load requests: ${error.message}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: "new" | "in-progress" | "waiting-feedback" | "done") => {
    try {
      // Optimistically update UI
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      setShowStatusMenu(null);
      
      // Update on server
      await updateRequestStatus(requestId, newStatus);
    } catch (error) {
      console.error("Error updating request status:", error);
      // Revert on error
      loadRequests();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Website":
        return <Globe className="w-4 h-4" />;
      case "Brand":
        return <Palette className="w-4 h-4" />;
      case "Product":
        return <Smartphone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRequestsByStatus = (status: string) => {
    return requests.filter((req) => req.status === status);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] text-[#111111] mb-2">Requests Dashboard</h1>
        <p className="text-[rgba(0,0,0,0.5)]">Track and manage all client requests</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filters.client}
          onChange={(e) => setFilters({ ...filters, client: e.target.value })}
          className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] text-[#111111] text-sm outline-none focus:border-[#0071E3] transition-colors"
        >
          <option value="all">All Clients</option>
          <option value="techflow">TechFlow AI</option>
          <option value="stellar">Stellar Commerce</option>
          <option value="quantum">Quantum Labs</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] text-[#111111] text-sm outline-none focus:border-[#0071E3] transition-colors"
        >
          <option value="all">All Categories</option>
          <option value="brand">Brand</option>
          <option value="website">Website</option>
          <option value="product">Product</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] text-[#111111] text-sm outline-none focus:border-[#0071E3] transition-colors"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] text-[#111111] text-sm hover:bg-[#F5F5F7] transition-colors">
            Latest First
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[#111111]">{column.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${column.color}`}>
                  {getRequestsByStatus(column.id).length}
                </span>
              </div>
              <div className="h-1 bg-[#F5F5F7] rounded-full overflow-hidden">
                <div className={`h-full ${column.color.split(' ')[0]} opacity-50`} style={{ width: '100%' }} />
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3 flex-1">
              {getRequestsByStatus(column.id).map((request) => (
                <div
                  key={request.id}
                  className="relative bg-white rounded-[16px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all cursor-grab active:cursor-grabbing group"
                >
                  {/* Drag Handle */}
                  <div className="flex items-start gap-2 mb-3">
                    <GripVertical className="w-4 h-4 text-[rgba(0,0,0,0.2)] group-hover:text-[rgba(0,0,0,0.4)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[#111111] mb-1">{request.title}</div>
                      <div className="text-xs text-[rgba(0,0,0,0.5)]">{request.clientName}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#F5F5F7]">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                      request.category === "Brand" ? "bg-purple-50 text-purple-600" :
                      request.category === "Website" ? "bg-blue-50 text-blue-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      {getCategoryIcon(request.category)}
                      <span className="text-xs">{request.category}</span>
                    </div>
                    <div className="text-xs text-[rgba(0,0,0,0.5)]">{request.submitDate}</div>
                  </div>

                  {/* Priority Badge */}
                  {request.priority && (
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                        request.priority === "high" ? "bg-red-100 text-red-700" :
                        request.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        // Open brief modal
                        setSelectedBrief(request.brief);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowStatusMenu(request.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Status Menu */}
                  {showStatusMenu === request.id && (
                    <div className="absolute right-0 top-10 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] z-10">
                      <div className="px-3 py-2 text-sm text-[#111111] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                        onClick={() => handleStatusChange(request.id, "new")}
                      >
                        New
                      </div>
                      <div className="px-3 py-2 text-sm text-[#111111] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                        onClick={() => handleStatusChange(request.id, "in-progress")}
                      >
                        In Progress
                      </div>
                      <div className="px-3 py-2 text-sm text-[#111111] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                        onClick={() => handleStatusChange(request.id, "waiting-feedback")}
                      >
                        Waiting for Feedback
                      </div>
                      <div className="px-3 py-2 text-sm text-[#111111] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                        onClick={() => handleStatusChange(request.id, "done")}
                      >
                        Done
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {getRequestsByStatus(column.id).length === 0 && (
                <div className="bg-[#FAFAFA] rounded-[16px] p-6 text-center border-2 border-dashed border-[rgba(0,0,0,0.06)]">
                  <div className="text-[rgba(0,0,0,0.3)] text-sm">No requests</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Brief Modal */}
      {selectedBrief && (
        <BriefModal
          isOpen={true}
          brief={selectedBrief}
          onClose={() => setSelectedBrief(null)}
        />
      )}
    </div>
  );
}