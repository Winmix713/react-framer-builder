import React from 'react';
import { Activity, BarChart3, Calendar, Target, Trophy, Settings, Monitor } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'live', label: 'Live Matches', icon: Activity },
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'predictions', label: 'Predictions', icon: Target },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'api-test', label: 'API Test', icon: Settings },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Soccer Prediction Hub
            </h1>
          </div>
          
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;