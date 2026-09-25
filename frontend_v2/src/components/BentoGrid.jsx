import React from 'react';

export function BentoGrid({ children, className = '', columns = 4, gap = 'md', areas, ...props }) {
  const gapSizes = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const childArray = React.Children.toArray(children).filter(Boolean);

  if (areas && areas.length > 0) {
    const gridTemplateAreas = areas.map(row => `"${row.join(' ')}"`).join(' ');
    return (
      <div
        className={`bento-grid ${gapSizes[gap]} ${className}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateAreas,
        }}
        {...props}
      >
        {childArray.map((child, i) => (
          <div key={i} className="bento-item" style={{ gridArea: child.props.area || `item-${i + 1}` }}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bento-grid ${gapSizes[gap]} ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
      {...props}
    >
      {childArray.map((child, i) => (
        <div key={i} className="bento-item" style={{ gridArea: child.props.area || `item-${i + 1}` }}>
          {child}
        </div>
      ))}
    </div>
  );
}

export function BentoItem({ children, area, span = 1, className = '', ...props }) {
  return (
    <div
      className={`bento-item ${className}`}
      style={{
        gridArea: area,
        gridColumn: area ? undefined : `span ${span}`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoGridAuto({ children, className = '', minWidth = '280px', gap = 'md', ...props }) {
  const gapSizes = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <div
      className={`bento-grid-auto ${gapSizes[gap]} ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
      }}
      {...props}
    >
      {childArray.map((child, i) => (
        <div key={i} className="bento-item">
          {child}
        </div>
      ))}
    </div>
  );
}