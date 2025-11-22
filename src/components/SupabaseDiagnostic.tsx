import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function SupabaseDiagnostic() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    setTestResult(null);

    const results: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    // Check 1: Basic configuration
    results.checks.push({
      name: 'Supabase Configuration',
      status: projectId && publicAnonKey ? 'pass' : 'fail',
      details: {
        projectId: projectId,
        hasAnonKey: !!publicAnonKey,
        url: `https://${projectId}.supabase.co`
      }
    });

    // Check 2: Network connectivity test
    try {
      const startTime = Date.now();
      const response = await fetch(`https://${projectId}.supabase.co/auth/v1/health`, {
        method: 'GET',
        headers: {
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      });
      const duration = Date.now() - startTime;
      
      results.checks.push({
        name: 'Network Connectivity',
        status: response.ok ? 'pass' : 'fail',
        details: {
          statusCode: response.status,
          duration: `${duration}ms`,
          reachable: true
        }
      });
    } catch (error: any) {
      results.checks.push({
        name: 'Network Connectivity',
        status: 'fail',
        details: {
          error: error.message,
          reachable: false,
          note: 'Cannot reach Supabase servers'
        }
      });
    }

    // Check 3: Auth endpoint test
    try {
      const startTime = Date.now();
      const response = await fetch(`https://${projectId}.supabase.co/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        }
      });
      const duration = Date.now() - startTime;
      
      results.checks.push({
        name: 'Auth Endpoint',
        status: response.ok ? 'pass' : 'fail',
        details: {
          statusCode: response.status,
          duration: `${duration}ms`,
          working: response.ok
        }
      });
    } catch (error: any) {
      results.checks.push({
        name: 'Auth Endpoint',
        status: 'fail',
        details: {
          error: error.message,
          working: false
        }
      });
    }

    setTestResult(results);
    setTesting(false);
  };

  useEffect(() => {
    // Auto-run on mount
    runDiagnostic();
  }, []);

  const allPassed = testResult?.checks.every((check: any) => check.status === 'pass');

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-[16px] shadow-lg border border-[rgba(0,0,0,0.1)] p-4 max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm">Supabase Diagnostic</h3>
          <Button
            onClick={runDiagnostic}
            disabled={testing}
            size="sm"
            className="text-xs"
          >
            {testing ? 'Testing...' : 'Retest'}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-2">
            <div className={`text-sm p-2 rounded-lg ${allPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {allPassed ? '✅ All checks passed' : '❌ Some checks failed'}
            </div>

            {testResult.checks.map((check: any, index: number) => (
              <div key={index} className="text-xs border border-[rgba(0,0,0,0.1)] rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{check.name}</span>
                  <span className={check.status === 'pass' ? 'text-green-600' : 'text-red-600'}>
                    {check.status === 'pass' ? '✓' : '✗'}
                  </span>
                </div>
                <pre className="text-[10px] text-[rgba(0,0,0,0.5)] overflow-auto max-h-20">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </div>
            ))}

            {!allPassed && (
              <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
                <p className="mb-1">Possible issues:</p>
                <ul className="list-disc list-inside space-y-1 text-[10px]">
                  <li>Supabase project may be paused (check dashboard)</li>
                  <li>Network/firewall blocking connection</li>
                  <li>Invalid project credentials</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}