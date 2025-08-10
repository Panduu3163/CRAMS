import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className={`spinner ${sizeClasses[size]} mb-4`}></div>
      <p className="text-secondary-600 text-sm font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
