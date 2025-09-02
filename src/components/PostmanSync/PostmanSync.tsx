import React, { useState } from 'react';
import { Copy, Download, FileCode, Globe, Key } from 'lucide-react';
import { generatePostmanRequest, generateCurlCommand, validateSportradarApiKey, SPORTRADAR_ENDPOINTS } from '../../utils/postmanSync';

interface PostmanSyncProps {
  apiKey?: string;
  baseUrl?: string;
}

const PostmanSync: React.FC<PostmanSyncProps> = ({ 
  apiKey = '', 
  baseUrl = 'https://api.sportradar.com' 
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('competitions');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getEndpointUrl = (endpoint: string) => {
    return SPORTRADAR_ENDPOINTS[endpoint as keyof typeof SPORTRADAR_ENDPOINTS]
      .replace('{access_level}', 'trial')
      .replace('{locale}', 'en')
      .replace('{date}', new Date().toISOString().split('T')[0])
      .replace('{season_id}', 'sr:season:118689')
      .replace('{match_id}', 'sr:match:49365133')
      .replace('{competitor_id}', 'sr:competitor:44')
      .replace('{competitor_id2}', 'sr:competitor:35');
  };

  const generatePostmanCollection = () => {
    const endpoints = Object.keys(SPORTRADAR_ENDPOINTS);
    const collection = {
      info: {
        name: "Sportradar Soccer v4 - Generated from App",
        description: "Auto-generated collection matching your app's configuration",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      variable: [
        { key: "base_url", value: baseUrl },
        { key: "api_key", value: apiKey || "{{YOUR_API_KEY}}" },
        { key: "access_level", value: "trial" },
        { key: "locale", value: "en" }
      ],
      item: endpoints.map(endpoint => ({
        name: endpoint.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        request: {
          method: "GET",
          header: [
            { key: "Accept", value: "application/json" },
            { key: "Content-Type", value: "application/json" }
          ],
          url: {
            raw: `{{base_url}}${getEndpointUrl(endpoint)}?api_key={{api_key}}`,
            host: ["{{base_url}}"],
            path: getEndpointUrl(endpoint).split('/').filter(p => p),
            query: [{ key: "api_key", value: "{{api_key}}" }]
          }
        }
      }))
    };
    
    return JSON.stringify(collection, null, 2);
  };

  const keyValidation = validateSportradarApiKey(apiKey);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileCode className="h-5 w-5 text-blue-600" />
            <span>Postman Integration</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate Postman requests matching your app configuration
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => copyToClipboard(generatePostmanCollection(), 'collection')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>{copiedItem === 'collection' ? 'Copied!' : 'Export Collection'}</span>
          </button>
        </div>
      </div>

      {/* API Key Status */}
      <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">API Key Status</span>
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
            keyValidation.valid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {keyValidation.message}
          </div>
        </div>
        {apiKey && (
          <div className="mt-2 text-xs text-gray-500 font-mono">
            Key: {apiKey.substring(0, 8)}...{apiKey.slice(-4)}
          </div>
        )}
      </div>

      {/* Endpoint Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Endpoint to Generate
        </label>
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.keys(SPORTRADAR_ENDPOINTS).map(endpoint => (
            <option key={endpoint} value={endpoint}>
              {endpoint.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Generated Request Examples */}
      <div className="space-y-4">
        {/* Postman URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Postman URL</label>
            <button
              onClick={() => {
                const request = generatePostmanRequest(getEndpointUrl(selectedEndpoint), apiKey, baseUrl);
                copyToClipboard(request.url, 'postman-url');
              }}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedItem === 'postman-url' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 font-mono text-xs text-gray-800 break-all">
            {generatePostmanRequest(getEndpointUrl(selectedEndpoint), apiKey, baseUrl).url}
          </div>
        </div>

        {/* cURL Command */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">cURL Command</label>
            <button
              onClick={() => {
                const curl = generateCurlCommand(getEndpointUrl(selectedEndpoint), apiKey, baseUrl);
                copyToClipboard(curl, 'curl');
              }}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedItem === 'curl' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
            {generateCurlCommand(getEndpointUrl(selectedEndpoint), apiKey, baseUrl)}
          </div>
        </div>

        {/* App Endpoint (for reference) */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Your App Uses (via proxy)</label>
          <div className="bg-blue-50 rounded-lg p-3 font-mono text-xs text-blue-800 break-all">
            /api/sportradar{getEndpointUrl(selectedEndpoint)}?api_key={apiKey ? `${apiKey.substring(0,8)}...` : '[API_KEY]'}
          </div>
        </div>
      </div>

      {/* Environment Templates */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Environment Templates Available</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-900">Trial Environment</div>
            <div className="text-xs text-gray-600 mt-1">
              Location: postman/environments/sportradar-trial.postman_environment.json
            </div>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-900">Production Environment</div>
            <div className="text-xs text-gray-600 mt-1">
              Location: postman/environments/sportradar-production.postman_environment.json
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Import environment templates from postman/ directory</li>
          <li>• Your app proxy automatically handles CORS issues</li>
          <li>• Rate limits: 1 request per 90 seconds on trial tier</li>
          <li>• Use the exported collection for comprehensive testing</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanSync;