import React from 'react';

export function Switch({ checked, onCheckedChange, disabled, className = '', ...props }) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={`
        inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
        transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked 
          ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
          : 'bg-neutral-700'
        }
        ${className}
      `}
      {...props}
    >
      <span
        className={`
          pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}