import React from 'react';
import { useQuery } from '@tanstack/react-query';
import APIMonitor from '../../services/apiMonitor';
import CacheManager from '../../services/cacheManager';
import { Activity, Clock, AlertTriangle, CheckCircle, BarChart3, Database } from 'lucide-react';

const APIMonitorDashboard: React.FC = () => {
  const { data: metrics, refetch } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: () => APIMonitor.getInstance().getMetrics(),
    refetchInterval: 5000, // Update every 5 seconds
  });

  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => CacheManager.getInstance().getStats(),
    refetchInterval: 10000, // Update every 10 seconds
  });

  const monitor = APIMonitor.getInstance();
  const successRate = monitor.getSuccessRate();
  const rateLimitRate = monitor.getRateLimitRate();
  const recentErrors = monitor.getRecentErrors(5);

  const getStatusColor = (rate: number, isSuccess = true) => {
    if (isSuccess) {
      if (rate >= 90) return 'text-green-600 bg-green-50';
      if (rate >= 70) return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    } else {
      if (rate <= 5) return 'text-green-600 bg-green-50';
      if (rate <= 15) return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          API Monitoring Dashboard
        </h2>
        <p className="text-gray-600">
          Real-time monitoring of Sportradar API performance and cache efficiency
        </p>
      </div>

      {/* API Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.totalRequests || 0}
          </div>
          <div className="text-sm text-gray-600">API Requests</div>
        </div>

        <div className={`rounded-xl shadow-sm border p-6 ${getStatusColor(successRate)}`}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Success</span>
          </div>
          <div className="text-2xl font-bold">
            {successRate.toFixed(1)}%
          </div>
          <div className="text-sm">Success Rate</div>
        </div>

        <div className={`rounded-xl shadow-sm border p-6 ${getStatusColor(rateLimitRate, false)}`}>
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Rate Limits</span>
          </div>
          <div className="text-2xl font-bold">
            {rateLimitRate.toFixed(1)}%
          </div>
          <div className="text-sm">Rate Limit Rate</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-500">Avg</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.averageResponseTime?.toFixed(0) || 0}ms
          </div>
          <div className="text-sm text-gray-600">Response Time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Errors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Recent Errors</span>
          </h3>
          
          {recentErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent errors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentErrors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-800">
                      {error.endpoint}
                    </span>
                    <span className="text-xs text-red-600">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-red-700">
                    {error.error}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cache Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Cache Performance</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Entries</span>
              <span className="font-medium">{cacheStats?.totalEntries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache Size</span>
              <span className="font-medium">
                {cacheStats?.totalSizeBytes ? 
                  `${(cacheStats.totalSizeBytes / 1024).toFixed(1)} KB` : 
                  '0 KB'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expired Entries</span>
              <span className="font-medium">{cacheStats?.expiredEntries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Access</span>
              <span className="font-medium">{cacheStats?.totalAccess || 0}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                CacheManager.getInstance().clear();
                refetch();
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Request History */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <span>Request History</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Endpoint</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Response Time</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics?.requestHistory?.slice(0, 10).map((request, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">
                    {request.endpoint}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rate_limited'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {request.responseTime}ms
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default APIMonitorDashboard;