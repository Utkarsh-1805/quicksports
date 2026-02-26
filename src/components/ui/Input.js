'use client';

import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input(
  { 
    label, 
    error, 
    type = 'text', 
    className = '', 
    containerClassName = '',
    ...props 
  }, 
  ref
) {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-3 rounded-lg border transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

export default Input;
