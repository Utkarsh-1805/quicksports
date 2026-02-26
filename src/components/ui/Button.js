'use client';

import { forwardRef } from 'react';
import { Spinner } from './Spinner';

export const Button = forwardRef(function Button(
  { 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props 
  }, 
  ref
) {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
});

export default Button;
