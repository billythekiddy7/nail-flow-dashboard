import React, { useState, useRef, useCallback } from 'react';

export function Slider({ 
  value = [0], 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className = '',
  disabled = false,
  ...props 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  
  const currentValue = value[0] || 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    setIsDragging(true);
    updateValue(e);
    
    const handleMouseMove = (e) => updateValue(e);
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled]);

  const updateValue = useCallback((e) => {
    if (!sliderRef.current || disabled) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newValue = min + percentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    if (onValueChange && clampedValue !== currentValue) {
      onValueChange([clampedValue]);
    }
  }, [min, max, step, currentValue, onValueChange, disabled]);

  return (
    <div
      ref={sliderRef}
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {/* Track */}
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-700">
        {/* Range */}
        <div 
          className="absolute h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Thumb */}
      <div
        className={`
          absolute block h-5 w-5 rounded-full border-2 border-white bg-white shadow-lg 
          transition-colors cursor-pointer
          ${isDragging ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        `}
        style={{ 
          left: `calc(${percentage}% - 10px)`,
          transform: 'translateY(-50%)',
          top: '50%'
        }}
      />
    </div>
  );
}