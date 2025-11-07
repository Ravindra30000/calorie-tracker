import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`;
  
  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input className={inputClasses} {...props} />
      </div>
    );
  }
  
  return <input className={inputClasses} {...props} />;
}

