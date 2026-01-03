import React from 'react';

export default function GridAutoFit({ children, minWidth = "260px", gap = "1.5rem", className = "" }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
    gap: gap
  };

  return (
    <div className={className} style={gridStyle}>
      {children}
    </div>
  );
}