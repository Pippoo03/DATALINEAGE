import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Component, ComponentType, SearchFilters } from '../types';

interface SearchBarProps {
  components: Component[];
  onSearchResults: (results: Component[]) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  filters: SearchFilters;
}

const componentTypeLabels: Record<ComponentType, string> = {
  activity: 'Activities',
  dataset: 'Datasets', 
  table: 'Tables',
  view: 'Views',
  stored_procedure: 'Stored Procedures',
  power_bi_chart: 'Power BI Charts',
  database: 'Databases'
};

export const SearchBar: React.FC<SearchBarProps> = ({
  components,
  onSearchResults,
  onFiltersChange,
  filters
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const filtered = components.filter(component => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        component.name.toLowerCase().includes(searchLower) ||
        component.id.toLowerCase().includes(searchLower) ||
        component.database?.toLowerCase().includes(searchLower) ||
        component.datatype?.toLowerCase().includes(searchLower) ||
        component.endpoint?.toLowerCase().includes(searchLower);

      // Type filter
      const matchesType = filters.componentTypes.length === 0 || 
        filters.componentTypes.includes(component.type);

      // Environment filter
      const matchesEnvironment = filters.environments.length === 0 ||
        filters.environments.includes(component.environment);

      // Failed only filter
      const matchesFailure = !filters.showFailedOnly || component.hasFailed;

      return matchesSearch && matchesType && matchesEnvironment && matchesFailure;
    });

    onSearchResults(filtered);
  }, [searchTerm, filters, components, onSearchResults]);

  const toggleComponentType = (type: ComponentType) => {
    const newTypes = filters.componentTypes.includes(type)
      ? filters.componentTypes.filter(t => t !== type)
      : [...filters.componentTypes, type];
    
    onFiltersChange({ ...filters, componentTypes: newTypes });
  };

  const toggleEnvironment = (env: 'production' | 'pre-production') => {
    const newEnvs = filters.environments.includes(env)
      ? filters.environments.filter(e => e !== env)
      : [...filters.environments, env];
    
    onFiltersChange({ ...filters, environments: newEnvs });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      componentTypes: [],
      environments: [],
      showFailedOnly: false
    });
    setSearchTerm('');
  };

  const activeFilterCount = 
    filters.componentTypes.length + 
    filters.environments.length + 
    (filters.showFailedOnly ? 1 : 0);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Input */}
        <div className="py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search components by name, database, type, or endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pb-4 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="pb-6 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Component Types */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Component Types</h4>
                <div className="space-y-2">
                  {Object.entries(componentTypeLabels).map(([type, label]) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.componentTypes.includes(type as ComponentType)}
                        onChange={() => toggleComponentType(type as ComponentType)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Environments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Environment</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.environments.includes('production')}
                      onChange={() => toggleEnvironment('production')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Production</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.environments.includes('pre-production')}
                      onChange={() => toggleEnvironment('pre-production')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pre-Production</span>
                  </label>
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showFailedOnly}
                      onChange={(e) => onFiltersChange({ ...filters, showFailedOnly: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Failed Components Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};