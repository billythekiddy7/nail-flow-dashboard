import React from 'react';

// Grid responsivo com auto-fit e clamp
export function ResponsiveGrid({ 
  children, 
  minItemWidth = '300px', 
  gap = '1.5rem',
  className = '',
  ...props 
}) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
    gap: `clamp(1rem, ${gap}, 2rem)`,
    width: '100%'
  };

  return (
    <div 
      className={`responsive-grid ${className}`} 
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
}

// Typography responsiva com clamp
export const ResponsiveText = ({ 
  minSize = '0.875rem', 
  maxSize = '1.125rem', 
  preferredSize = '1rem',
  children,
  className = '',
  as: Component = 'p',
  ...props 
}) => {
  const textStyle = {
    fontSize: `clamp(${minSize}, ${preferredSize}, ${maxSize})`,
    lineHeight: '1.6'
  };

  return (
    <Component 
      className={`responsive-text ${className}`}
      style={textStyle}
      {...props}
    >
      {children}
    </Component>
  );
};

// Container com max-width responsivo
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = '1200px',
  padding = '1rem',
  className = '',
  ...props 
}) => {
  const containerStyle = {
    maxWidth,
    margin: '0 auto',
    padding: `clamp(0.5rem, ${padding}, 2rem)`,
    width: '100%'
  };

  return (
    <div 
      className={`responsive-container ${className}`}
      style={containerStyle}
      {...props}
    >
      {children}
    </div>
  );
};