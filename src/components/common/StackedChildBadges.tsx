import React from 'react';
import { useKicacoStore } from '../../store/kicacoStore';

// Rainbow colors for children (same as other components)
const childColors = [
  '#f8b6c2', // Pink
  '#fbd3a2', // Orange
  '#fde68a', // Yellow
  '#bbf7d0', // Green
  '#c0e2e7', // Blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Purple
];

interface StackedChildBadgesProps {
  childName?: string;
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  className?: string;
}

const StackedChildBadges: React.FC<StackedChildBadgesProps> = ({ 
  childName, 
  size = 'md',
  maxVisible = 3,
  className = ''
}) => {
  const children = useKicacoStore(state => state.children);
  
  // Parse multiple children from comma-separated string
  const childNames = childName ? childName.split(',').map(name => name.trim()).filter(name => name) : [];
  
  // If only one child, don't use stacking
  if (childNames.length <= 1) {
    if (childNames.length === 0) return null;
    
    const name = childNames[0];
    const childProfile = children.find(c => c.name === name);
    const childIndex = children.findIndex(c => c.name === name);
    const color = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : '#6b7280');
    
    const sizeClasses = {
      sm: 'w-3 h-3 text-[8px]',
      md: 'w-4 h-4 text-[10px]',
      lg: 'w-8 h-8 text-xs'
    };
    
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-gray-700 font-semibold ring-1 ring-gray-400 flex-shrink-0 ${className}`}
        style={{ backgroundColor: color }}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  // Multiple children - use stacking
  const visibleChildren = childNames.slice(0, maxVisible);
  const remainingCount = Math.max(0, childNames.length - maxVisible);
  
  const sizeConfig = {
    sm: { size: 'w-3 h-3', text: 'text-[7px]', offset: '-ml-1' },
    md: { size: 'w-4 h-4', text: 'text-[8px]', offset: '-ml-1.5' },
    lg: { size: 'w-6 h-6', text: 'text-[10px]', offset: '-ml-2' }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className={`flex items-center ${className}`}>
      {visibleChildren.map((name, index) => {
        const childProfile = children.find(c => c.name === name);
        const childIndex = children.findIndex(c => c.name === name);
        const color = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : '#6b7280');
        
        return (
          <div
            key={name}
            className={`${config.size} rounded-full flex items-center justify-center text-gray-700 ${config.text} font-semibold ring-1 ring-gray-400 bg-clip-padding flex-shrink-0 ${index > 0 ? config.offset : ''}`}
            style={{ 
              backgroundColor: color,
              zIndex: index + 1
            }}
            title={name}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          className={`${config.size} rounded-full flex items-center justify-center text-gray-600 ${config.text} font-semibold bg-gray-200 ring-1 ring-gray-400 flex-shrink-0 ${config.offset}`}
          style={{ zIndex: visibleChildren.length + 1 }}
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default StackedChildBadges; 