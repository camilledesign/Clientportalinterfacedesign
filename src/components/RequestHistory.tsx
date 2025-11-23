import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { BriefModal } from "./BriefModal";
import { Button } from "./ui/button";
import { getUserRequests } from "../utils/api";
import { handlePossibleSessionError } from "../utils/supabase/errors";

interface Request {
  id: string;
  category: "Brand" | "Website" | "Product";
  title: string;
  submitDate: string;
  status: "new" | "in-progress" | "completed" | "delivered";
  brief?: any;
  deliveredDate?: string;
}

interface RequestHistoryProps {
  globalRefreshToken?: number;
}

export function RequestHistory({ globalRefreshToken = 0 }: RequestHistoryProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch requests function - defined outside useEffect so it can be called from error handler
  const fetchRequests = async () => {
    let isMounted = true;

    try {
      setLoading(true);
      setError("");
      
      console.log('🔵 RequestHistory: Fetching requests from Supabase...');
      
      // Fetch requests using API helper
      const result = await getUserRequests();
      
      if (!isMounted) return;
      
      console.log('✅ RequestHistory: Fetched requests:', result.requests.length);
      
      setRequests(result.requests);
    } catch (err: any) {
      if (!isMounted) return;
      
      // Check if it's a session error
      if (handlePossibleSessionError(err)) {
        // Session expired - global handler will redirect to login
        return;
      }
      
      console.error("❌ RequestHistory: Error fetching requests:", err);
      setError(err.message || "Failed to load requests");
    } finally {
      if (!isMounted) return;
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    fetchRequests();
  }, [globalRefreshToken]); // Re-fetch when globalRefreshToken changes

  // Filter requests by status
  const currentRequest = requests.find(r => r.status === "in-progress" || r.status === "new");
  const pastRequests = requests.filter(r => r.status === "completed" || r.status === "delivered");

  const getStatusBadge = (status: Request["status"]) => {
    switch (status) {
      case "new":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-[8px] bg-orange-500/10 text-orange-600">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span className="text-sm">New</span>
          </div>
        );
      case "in-progress":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-[8px] bg-[#0071E3]/10 text-[#0071E3]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
            <span className="text-sm">In Progress</span>
          </div>
        );
      case "completed":
      case "delivered":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-[8px] bg-green-500/10 text-green-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
            <span className="text-sm">Completed</span>
          </div>
        );
    }
  };

  const getCategoryColor = (type: Request["category"]) => {
    switch (type) {
      case "Brand":
        return "bg-purple-500/10 text-purple-600";
      case "Website":
        return "bg-blue-500/10 text-blue-600";
      case "Product":
        return "bg-green-500/10 text-green-600";
    }
  };

  const openModal = (brief: any) => {
    setSelectedBrief(brief);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBrief(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-[16px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
          <p className="text-[rgba(0,0,0,0.6)]">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="bg-red-50 rounded-[16px] p-6 border border-red-200">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-3 text-sm text-[#0071E3] hover:text-[#0077ED] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Current Request */}
      {currentRequest && (
        <div>
          <h2 className="text-[#111111] mb-4">Current Request</h2>
          <div className="bg-white rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-[8px] text-sm ${getCategoryColor(currentRequest.category)}`}>
                    {currentRequest.category}
                  </span>
                  {getStatusBadge(currentRequest.status)}
                </div>
                <h3 className="text-[#111111] mb-2">{currentRequest.title}</h3>
                <div className="flex items-center gap-4 text-sm text-[rgba(0,0,0,0.6)]">
                  <div>
                    <span className="text-[rgba(0,0,0,0.4)]">Requested:</span> {currentRequest.submitDate}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[rgba(0,0,0,0.2)]" />
                  <div>
                    <span className="text-[rgba(0,0,0,0.4)]">Delivery:</span>{" "}
                    <span className="text-[#0071E3]">In Progress</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openModal(currentRequest.brief)}
                className="text-sm text-[#0071E3] hover:text-[#0077ED] flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Brief
              </button>
            </div>
          </div>
          <p className="text-sm text-[rgba(0,0,0,0.6)] mt-3 ml-1">
            You can only have one request in progress at a time
          </p>
        </div>
      )}

      {/* Past Requests */}
      <div>
        <h2 className="text-[#111111] mb-4">Past Requests</h2>
        {pastRequests.length > 0 ? (
          <div className="space-y-3">
            {pastRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-[8px] text-sm ${getCategoryColor(request.category)}`}>
                        {request.category}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <h3 className="text-[#111111] mb-2">{request.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-[rgba(0,0,0,0.6)]">
                      <div>
                        <span className="text-[rgba(0,0,0,0.4)]">Requested:</span> {request.submitDate}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[rgba(0,0,0,0.2)]" />
                      <div>
                        <span className="text-[rgba(0,0,0,0.4)]">Delivered:</span> {request.deliveredDate}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(request.brief)}
                    className="text-sm text-[#0071E3] hover:text-[#0077ED] flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View Brief
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[16px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
            <Clock className="w-12 h-12 text-[rgba(0,0,0,0.2)] mx-auto mb-3" />
            <p className="text-[rgba(0,0,0,0.6)]">No past requests yet</p>
          </div>
        )}
      </div>

      {/* Brief Modal */}
      <BriefModal
        isOpen={isModalOpen}
        onClose={closeModal}
        brief={selectedBrief}
      />
    </div>
  );
}