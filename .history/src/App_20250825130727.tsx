import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SearchBar } from './components/SearchBar';
import { ComponentList } from './components/ComponentList';
import { LineageControls } from './components/LineageControls';
import { LineageVisualization } from './components/LineageVisualization';
import { Component, LineageConfig, SearchFilters } from './types';
import { mockComponents, mockEdges } from './data/mockData';

function App() {
  const [searchResults, setSearchResults] = useState<Component[]>(mockComponents);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    componentTypes: [],
    environments: [],
    showFailedOnly: false
  });
  const [lineageConfig, setLineageConfig] = useState<LineageConfig>({
    direction: 'both',
    depth: 2,
    selectedComponentId: null
  });

  const handleComponentSelect = useCallback((component: Component) => {
    setSelectedComponent(component);
    setLineageConfig(prev => ({
      ...prev,
      selectedComponentId: component.id,
      // Suggest higher depth for Power BI charts
      depth: component.type === 'power_bi_chart' ? 3 : prev.depth
    }));
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    const component = mockComponents.find(c => c.id === nodeId);
    if (component) {
      handleComponentSelect(component);
    }
  }, [handleComponentSelect]);

  const handleLineageConfigChange = useCallback((newConfig: Partial<LineageConfig>) => {
    setLineageConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const handleExport = useCallback(() => {
    // Export functionality would be implemented here
    // For now, just show an alert
    alert('Export functionality would be implemented here');
  }, []);

  const handleFullscreen = useCallback(() => {
    // Fullscreen functionality would be implemented here
    // For now, just show an alert
    alert('Fullscreen functionality would be implemented here');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Lineage Explorer</h1>
        <p className="text-gray-600 mt-1">
          Visualize enterprise data relationships across SQL databases, stored procedures, and Power BI reports
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        components={mockComponents}
        onSearchResults={setSearchResults}
        onFiltersChange={setSearchFilters}
        filters={searchFilters}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="overflow-y-auto">
            <ComponentList
              components={searchResults}
              selectedComponent={selectedComponent}
              onComponentSelect={handleComponentSelect}
            />
          </div>
        </div>

        {/* Right Panel - Lineage Visualization */}
        <div className="flex-1 flex flex-col">
          <LineageControls
            config={lineageConfig}
            onConfigChange={handleLineageConfigChange}
            onExport={handleExport}
            onFullscreen={handleFullscreen}
          />
          
          <ReactFlowProvider>
            <LineageVisualization
              components={mockComponents}
              edges={mockEdges}
              config={lineageConfig}
              onNodeClick={handleNodeClick}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Status Bar */}
      {selectedComponent && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">Selected:</span> {selectedComponent.name}
              {selectedComponent.hasFailed && (
                <span className="ml-2 text-red-600 font-medium">⚠️ Has Failures</span>
              )}
            </div>
            <div className="text-xs text-blue-600">
              {lineageConfig.direction} • {lineageConfig.depth} level{lineageConfig.depth > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;