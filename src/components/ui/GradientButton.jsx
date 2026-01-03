import React from 'react';
import { Button } from '@/components/ui/button';

export default function GradientButton({ children, className = "", disabled = false, ...props }) {
  return (
    <Button
      className={`bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg border-0 ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}