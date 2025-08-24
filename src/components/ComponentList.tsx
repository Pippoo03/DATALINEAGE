import React from 'react';
import { Component } from '../types';
import { ComponentCard } from './ComponentCard';

interface ComponentListProps {
  components: Component[];
  selectedComponent: Component | null;
  onComponentSelect: (component: Component) => void;
  isLoading?: boolean;
}

export const ComponentList: React.FC<ComponentListProps> = ({
  components,
  selectedComponent,
  onComponentSelect,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 text-lg">No components found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  const failedComponents = components.filter(c => c.hasFailed);
  const healthyComponents = components.filter(c => !c.hasFailed);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Search Results ({components.length})
        </h3>
        {failedComponents.length > 0 && (
          <div className="text-sm text-red-600 mb-4">
            ⚠️ {failedComponents.length} component{failedComponents.length > 1 ? 's' : ''} with failures detected
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Failed components first */}
        {failedComponents.map(component => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selectedComponent?.id === component.id}
            onClick={onComponentSelect}
          />
        ))}
        
        {/* Healthy components */}
        {healthyComponents.map(component => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selectedComponent?.id === component.id}
            onClick={onComponentSelect}
          />
        ))}
      </div>
    </div>
  );
};