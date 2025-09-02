import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import LiveMatches from './components/LiveMatches/LiveMatches';
import DailySchedule from './components/Schedule/DailySchedule';
import PredictionAnalysis from './components/Predictions/PredictionAnalysis';
import StandingsTable from './components/Standings/StandingsTable';
import APIMonitorDashboard from './components/Monitoring/APIMonitorDashboard';
import APITester from './components/APITester/APITester';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'live':
        return <LiveMatches />;
      case 'schedule':
        return <DailySchedule />;
      case 'standings':
        return <StandingsTable />;
      case 'predictions':
        return <PredictionAnalysis />;
      case 'monitoring':
        return <APIMonitorDashboard />;
      case 'api-test':
        return <APITester />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="pb-8">
            {renderActiveTab()}
          </main>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;