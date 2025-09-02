import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;