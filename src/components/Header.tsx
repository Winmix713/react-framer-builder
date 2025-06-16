
import { Terminal, Zap } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Framer Processor</h1>
              <p className="text-sm text-gray-400">Design to Code Automation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Zap className="w-4 h-4" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};
