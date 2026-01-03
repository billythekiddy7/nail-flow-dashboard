import React from 'react';

export default function NumberInput({ className = '', ...props }) {
  return (
    <input
      type="number"
      className={`no-spin bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 w-full text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}