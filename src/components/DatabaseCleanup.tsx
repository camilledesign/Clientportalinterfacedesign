import { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function DatabaseCleanup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCleanup = async () => {
    if (!confirm("⚠️ WARNING: This will delete ALL data from the database including:\n\n• All users\n• All sessions\n• All clients\n• All requests\n• All assets\n\nAdmin sessions will be kept for the admin panel.\n\nAre you ABSOLUTELY sure you want to continue?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a93d7fb4/cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Cleanup failed");
      }

      setResult(data);
      console.log("✅ Database cleanup successful:", data);
    } catch (err: any) {
      console.error("❌ Cleanup error:", err);
      setError(err.message || "Failed to clean database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] text-[#111111] mb-2">Database Cleanup</h1>
          <p className="text-[rgba(0,0,0,0.5)]">
            Remove all data from the database
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          {/* Warning Section */}
          <div className="bg-red-50 border border-red-200 rounded-[16px] p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-red-900 mb-2">⚠️ Danger Zone</h3>
                <p className="text-sm text-red-700 mb-3">
                  This action will permanently delete:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>All user accounts</li>
                  <li>All user sessions</li>
                  <li>All clients</li>
                  <li>All requests</li>
                  <li>All asset records</li>
                </ul>
                <p className="text-sm text-red-700 mt-3">
                  Admin sessions will be preserved (for access code: 3333)
                </p>
              </div>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-[16px] p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-green-900 mb-3">✅ Cleanup Successful</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Users deleted:</span>{" "}
                        {result.deleted.users}
                      </div>
                      <div>
                        <span className="font-medium">Sessions deleted:</span>{" "}
                        {result.deleted.sessions}
                      </div>
                      <div>
                        <span className="font-medium">Clients deleted:</span>{" "}
                        {result.deleted.clients}
                      </div>
                      <div>
                        <span className="font-medium">Requests deleted:</span>{" "}
                        {result.deleted.requests}
                      </div>
                      <div>
                        <span className="font-medium">Assets deleted:</span>{" "}
                        {result.deleted.assets}
                      </div>
                      <div>
                        <span className="font-medium">Admin sessions kept:</span>{" "}
                        {result.kept.adminSessions}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <span className="font-medium">Total deleted:</span>{" "}
                      {result.deleted.total} items
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 mb-6 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCleanup}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-[12px] py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Cleaning..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clean Database
                </>
              )}
            </Button>
            <Button
              onClick={() => (window.location.hash = "")}
              disabled={loading}
              className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] py-3 transition-all disabled:opacity-50"
            >
              Back to Login
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.06)]">
            <p className="text-xs text-[rgba(0,0,0,0.4)]">
              After cleanup, you can manually create new user accounts in Supabase:
            </p>
            <div className="mt-3 p-3 bg-[#F5F5F7] rounded-[12px] font-mono text-xs text-[rgba(0,0,0,0.6)]">
              <div className="mb-1">Key: user:email@example.com</div>
              <div className="text-[10px] whitespace-pre">
{`Value: {
  "id": "uuid",
  "email": "email@example.com",
  "password": "password123",
  "name": "User Name",
  "company": "Company Name",
  "clientId": "client-uuid",
  "createdAt": "2024-..."
}`}
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a
            href="#"
            className="text-sm text-[rgba(0,0,0,0.3)] hover:text-[rgba(0,0,0,0.5)] transition-colors"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
