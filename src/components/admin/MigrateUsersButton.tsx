import { useState } from "react";
import { Button } from "../ui/button";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { getAdminSessionToken } from "../../utils/api";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a93d7fb4`;

export function MigrateUsersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const migrateUsers = async () => {
    if (!confirm('This will migrate all legacy users (key: user:email) to the new format (key: user:id). Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const sessionToken = getAdminSessionToken();

      const response = await fetch(`${API_BASE}/debug/migrate-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Admin-Session': sessionToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(`✅ Migration complete: ${data.migrated} users migrated`);
      console.log('Migration result:', data);
    } catch (error: any) {
      setResult(`❌ Migration failed: ${error.message}`);
      console.error('Migration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={migrateUsers}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? 'Migrating...' : 'Migrate Legacy Users'}
      </Button>
      {result && (
        <div className={`p-3 rounded-[12px] text-sm ${
          result.startsWith('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {result}
        </div>
      )}
      <p className="text-xs text-[rgba(0,0,0,0.5)]">
        Converts old user records (user:email) to new format (user:id) for Supabase Auth compatibility
      </p>
    </div>
  );
}
