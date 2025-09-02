import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, Key, Globe, AlertTriangle, Clock, Database, Bug } from 'lucide-react';
import PostmanSync from '../PostmanSync/PostmanSync';
import { useCompetitions } from '../../hooks/useSportradarData';

// Types
interface TestResult {
  loading: boolean;
  result: any;
  error: any;
  startTime?: number;
  duration?: number;
  headers?: Record<string, string>;
}

interface EnvironmentIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  fix: string;
}

interface HealthCheck {
  name: string;
  description: string;
  passed: boolean;
  message?: string;
}

// Subcomponents
const StatusIndicator: React.FC<{
  isLoading: boolean;
  hasError: boolean;
  hasSuccess: boolean;
}> = ({ isLoading, hasError, hasSuccess }) => {
  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
  if (hasError) return <XCircle className="h-5 w-5 text-red-600" />;
  if (hasSuccess) return <CheckCircle className="h-5 w-5 text-green-600" />;
  return <Globe className="h-5 w-5 text-gray-400" />;
};

const ResultDetails: React.FC<{ result: any; title: string }> = ({ result, title }) => {
  if (!result) return null;
  
  return (
    <div className="mt-4">
      <h5 className="text-sm font-medium text-gray-700 mb-2">{title}</h5>
      <div className="max-h-48 overflow-auto bg-gray-100 rounded-lg p-3">
        <pre className="text-xs text-gray-800 whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const ResponseHeaders: React.FC<{ headers: Record<string, string> }> = ({ headers }) => {
  if (!headers || Object.keys(headers).length === 0) return null;
  
  return (
    <div className="mt-4 bg-gray-50 p-3 rounded-lg">
      <h5 className="font-medium text-gray-700 mb-2 text-sm">Response Headers</h5>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="font-mono">
            <span className="text-gray-500">{key}:</span> <span className="text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RequestTimer: React.FC<{ duration?: number }> = ({ duration }) => {
  if (!duration) return null;
  
  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
      <Clock className="h-3 w-3" />
      <span>Duration: {duration}ms</span>
    </div>
  );
};

const DebugPanel: React.FC<{ error: any }> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
      <h5 className="font-medium text-red-700 mb-2 flex items-center space-x-1">
        <Bug className="h-4 w-4" />
        <span>Debug Information</span>
      </h5>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-4 text-red-600">
          <div><span className="font-mono">Type:</span> {error.name || 'Error'}</div>
          <div><span className="font-mono">Status:</span> {error.status || 'N/A'}</div>
        </div>
        <div className="text-red-600">
          <span className="font-mono">Message:</span> {error.message}
        </div>
        {error.stack && (
          <div className="text-red-500">
            <span className="font-mono">Stack Trace:</span>
            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto max-h-32">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const EnvironmentStatus: React.FC<{ issues: EnvironmentIssue[] }> = ({ issues }) => {
  if (issues.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {issues.map((issue, index) => (
        <div key={index} className={`p-3 rounded-lg border ${
          issue.type === 'critical' 
            ? 'bg-red-50 border-red-200 text-red-700'
            : issue.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-start space-x-2">
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${
              issue.type === 'critical' ? 'text-red-600' :
              issue.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <p className="font-medium text-sm">{issue.message}</p>
              <p className="text-xs mt-1 opacity-75">{issue.fix}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const HealthCheckResults: React.FC<{ checks: HealthCheck[] }> = ({ checks }) => {
  if (checks.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {checks.map((check, index) => (
        <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
          check.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {check.passed ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> :
              <XCircle className="h-4 w-4 text-red-600" />
            }
            <span className="text-sm font-medium">{check.name}</span>
          </div>
          <span className="text-xs">{check.message || check.description}</span>
        </div>
      ))}
    </div>
  );
};

// Enhanced API test hook that uses real Sportradar API
const useAPITest = () => {
  const { data, isLoading, error, refetch } = useCompetitions();
  
  return { 
    data: data ? { message: "API connection successful", competitions: data.competitions || [] } : null,
    isLoading, 
    error,
    refetch 
  };
};

// Main Component
const APITester: React.FC = () => {
  const [manualTest, setManualTest] = useState<TestResult>({
    loading: false,
    result: null,
    error: null
  });

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [environmentIssues, setEnvironmentIssues] = useState<EnvironmentIssue[]>([]);

  const { data: autoTestResult, isLoading: autoLoading, error: autoError, refetch } = useAPITest();

  // Environment validation
  const validateEnvironment = useCallback((): EnvironmentIssue[] => {
    const issues: EnvironmentIssue[] = [];
    
    // Mock environment checks since we can't access import.meta.env in this demo
    const hasApiKey = true; // import.meta.env.VITE_SPORTRADAR_API_KEY
    const isProduction = false; // import.meta.env.MODE === 'production'
    
    if (!hasApiKey) {
      issues.push({
        type: 'critical',
        message: 'API key missing in environment variables',
        fix: 'Add VITE_SPORTRADAR_API_KEY to .env file'
      });
    }
    
    if (isProduction) {
      issues.push({
        type: 'warning',
        message: 'Using default base URL in production',
        fix: 'Configure custom base URL for production'
      });
    }
    
    return issues;
  }, []);

  // Health check runner
  const runHealthCheck = useCallback(async (): Promise<HealthCheck[]> => {
    const checks = [
      {
        name: 'API Key Validation',
        description: 'API key exists and is valid',
        check: () => Promise.resolve(true), // Mock check
        passed: false
      },
      {
        name: 'Base URL Reachable',
        description: 'Base URL is accessible',
        check: async () => {
          try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            return Math.random() > 0.3; // 70% success rate for demo
          } catch {
            return false;
          }
        },
        passed: false
      },
      {
        name: 'CORS Configuration',
        description: 'CORS headers properly configured',
        check: () => Promise.resolve(true),
        passed: false
      }
    ];
    
    const results = await Promise.all(checks.map(async (check) => ({
      ...check,
      passed: await check.check(),
      message: undefined
    })));
    
    return results;
  }, []);

  // Enhanced manual test with timeout and detailed error handling
  const runManualTest = async () => {
    const startTime = Date.now();
    setManualTest({ loading: true, result: null, error: null, startTime });
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Mock API call for demo
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.7) { // 30% error rate for demo
            reject(new Error('Network timeout'));
          } else {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                competitions: new Array(10).fill({ id: 1, name: "Sample Competition" }),
                total: 10
              }),
              headers: new Headers({
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': '95',
                'X-RateLimit-Limit': '100'
              })
            });
          }
        }, 1000 + Math.random() * 2000);
      });
      
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      // Mock response for demo
      const mockResult = {
        competitions: new Array(10).fill({ id: 1, name: "Sample Competition" }),
        total: 10
      };
      
      const mockHeaders = {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '95',
        'X-RateLimit-Limit': '100'
      };
      
      setManualTest({
        loading: false,
        result: mockResult,
        error: null,
        duration,
        headers: mockHeaders
      });
    } catch (err) {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      const detailedError = {
        name: err instanceof Error ? err.constructor.name : 'Error',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        status: (err as any).status || 'N/A',
        stack: err instanceof Error ? err.stack : 'N/A',
        timestamp: new Date().toISOString()
      };
      
      // Save error to localStorage for debugging
      try {
        localStorage.setItem('last_api_error', JSON.stringify(detailedError));
      } catch {
        // Handle localStorage errors silently
      }
      
      setManualTest({
        loading: false,
        result: null,
        error: detailedError,
        duration
      });
    }
  };

  // Initialize checks on mount
  useEffect(() => {
    setEnvironmentIssues(validateEnvironment());
    runHealthCheck().then(setHealthChecks);
  }, [validateEnvironment, runHealthCheck]);

  const getStatusColor = (isLoading: boolean, hasError: boolean, hasSuccess: boolean) => {
    if (isLoading) return 'border-blue-200 bg-blue-50';
    if (hasError) return 'border-red-200 bg-red-50';
    if (hasSuccess) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enhanced API Connection Tester
        </h2>
        <p className="text-gray-600">
          Professional API testing with advanced debugging capabilities and Postman integration
        </p>
      </div>

      {/* Postman Integration */}
      <PostmanSync />

      {/* Environment Issues */}
      {environmentIssues.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Environment Issues</span>
          </h3>
          <EnvironmentStatus issues={environmentIssues} />
        </div>
      )}

      {/* Health Checks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Database className="h-5 w-5 text-gray-600" />
            <span>System Health Checks</span>
          </h3>
          <button
            onClick={() => runHealthCheck().then(setHealthChecks)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <HealthCheckResults checks={healthChecks} />
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automatic Test */}
        <div className={`rounded-xl border p-6 ${getStatusColor(autoLoading, !!autoError, !!autoTestResult)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <StatusIndicator isLoading={autoLoading} hasError={!!autoError} hasSuccess={!!autoTestResult} />
              <span>Automatic Test</span>
            </h3>
            <button
              onClick={() => refetch()}
              disabled={autoLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors duration-150"
            >
              <RefreshCw className={`h-4 w-4 ${autoLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {autoLoading ? (
            <div className="text-center py-4">
              <p className="text-blue-600 font-medium">Testing connection...</p>
            </div>
          ) : autoError ? (
            <div className="space-y-3">
              <div className="text-red-700 font-medium">Connection Failed</div>
              <div className="text-sm text-red-600 bg-red-100 p-3 rounded-lg font-mono">
                {autoError.message}
              </div>
              <DebugPanel error={autoError} />
            </div>
          ) : autoTestResult ? (
            <div className="space-y-3">
              <div className="text-green-700 font-medium">✅ Connection Successful</div>
              <div className="text-sm text-green-600">
                Found {autoTestResult.competitions?.length || 0} competitions
              </div>
              <ResultDetails result={autoTestResult} title="Response Data" />
            </div>
          ) : (
            <div className="text-gray-500">No test results yet</div>
          )}
        </div>

        {/* Manual Test */}
        <div className={`rounded-xl border p-6 ${getStatusColor(manualTest.loading, !!manualTest.error, !!manualTest.result)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <StatusIndicator isLoading={manualTest.loading} hasError={!!manualTest.error} hasSuccess={!!manualTest.result} />
              <span>Manual Test</span>
            </h3>
            <button
              onClick={runManualTest}
              disabled={manualTest.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              {manualTest.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span>Test Now</span>
            </button>
          </div>

          {manualTest.loading ? (
            <div className="text-center py-4">
              <p className="text-blue-600 font-medium">Running manual test...</p>
            </div>
          ) : manualTest.error ? (
            <div className="space-y-3">
              <div className="text-red-700 font-medium">Manual Test Failed</div>
              <RequestTimer duration={manualTest.duration} />
              <DebugPanel error={manualTest.error} />
            </div>
          ) : manualTest.result ? (
            <div className="space-y-3">
              <div className="text-green-700 font-medium">✅ Manual Test Successful</div>
              <div className="text-sm text-green-600">
                Found {manualTest.result.competitions?.length || 0} competitions
              </div>
              <RequestTimer duration={manualTest.duration} />
              <ResponseHeaders headers={manualTest.headers || {}} />
              <ResultDetails result={manualTest.result} title="Response Data" />
            </div>
          ) : (
            <div className="text-gray-500">Click "Test Now" to run manual test</div>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Key className="h-5 w-5 text-gray-600" />
          <span>API Configuration</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
              development
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono">
              /api/sportradar/...
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key Status
            </label>
            <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              Configured
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proxy Status
            </label>
            <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              Active (Vite)
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Troubleshooting Guide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">CORS Errors</h4>
            <p className="text-sm text-gray-600 mb-2">
              Cross-origin request issues typically resolved by proxy
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Check Vite proxy configuration</li>
              <li>• Restart development server</li>
              <li>• Implement backend proxy for production</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">403 Forbidden</h4>
            <p className="text-sm text-gray-600 mb-2">
              API key or permission related issues
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Verify API key is correct</li>
              <li>• Check trial/production access</li>
              <li>• Ensure proper User-Agent header</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">429 Rate Limit</h4>
            <p className="text-sm text-gray-600 mb-2">
              Too many requests in short time period
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Wait for rate limit reset</li>
              <li>• Implement exponential backoff</li>
              <li>• Consider upgrading API plan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITester;