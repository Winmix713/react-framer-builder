
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { ProcessingStep } from "@/pages/Index";

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  isProcessing: boolean;
}

export const ProcessingStatus = ({ steps, isProcessing }: ProcessingStatusProps) => {
  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepTextColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Feldolgozás állapota</h2>
        <div className="text-sm text-gray-400">
          {completedSteps}/{totalSteps} lépés
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Haladás</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
              step.status === 'processing' ? 'bg-blue-900/20 border border-blue-700/30' :
              step.status === 'completed' ? 'bg-green-900/20 border border-green-700/30' :
              step.status === 'error' ? 'bg-red-900/20 border border-red-700/30' :
              'bg-gray-900/50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${getStepTextColor(step.status)}`}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-sm text-gray-400 mt-1">
                  {step.description}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {!isProcessing && completedSteps === totalSteps && (
        <div className="mt-6 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              Feldolgozás sikeresen befejezve!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
