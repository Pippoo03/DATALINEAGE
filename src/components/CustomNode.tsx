import React from 'react';
import { Handle, Position } from 'reactflow';
import { Component } from '../types';
import { 
  Database, 
  Table, 
  Eye, 
  Play, 
  Activity,
  BarChart3,
  AlertCircle,
  Server
} from 'lucide-react';

interface CustomNodeProps {
  data: {
    component: Component;
    isSelected: boolean;
    onClick: (nodeId: string) => void;
  };
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case 'database': return <Database className="h-5 w-5" />;
    case 'table': return <Table className="h-5 w-5" />;
    case 'view': return <Eye className="h-5 w-5" />;
    case 'stored_procedure': return <Play className="h-5 w-5" />;
    case 'activity': return <Activity className="h-5 w-5" />;
    case 'power_bi_chart': return <BarChart3 className="h-5 w-5" />;
    default: return <Server className="h-5 w-5" />;
  }
};

const getNodeStyle = (component: Component, isSelected: boolean) => {
  let baseClasses = "border-2 transition-all duration-200 cursor-pointer hover:shadow-lg";
  
  if (component.hasFailed) {
    baseClasses += " bg-red-50 border-red-300 shadow-red-100";
  } else {
    // Component type colors
    switch (component.type) {
      case 'database':
        baseClasses += " bg-blue-50 border-blue-300 shadow-blue-100";
        break;
      case 'table':
        baseClasses += " bg-green-50 border-green-300 shadow-green-100";
        break;
      case 'view':
        baseClasses += " bg-cyan-50 border-cyan-300 shadow-cyan-100";
        break;
      case 'stored_procedure':
        baseClasses += " bg-purple-50 border-purple-300 shadow-purple-100";
        break;
      case 'activity':
        baseClasses += " bg-pink-50 border-pink-300 shadow-pink-100";
        break;
      case 'power_bi_chart':
        baseClasses += " bg-orange-50 border-orange-300 shadow-orange-100";
        break;
      default:
        baseClasses += " bg-gray-50 border-gray-300 shadow-gray-100";
    }
  }

  if (isSelected) {
    baseClasses += " ring-4 ring-blue-500 ring-opacity-50 scale-105";
  }

  return baseClasses;
};

const getNodeShape = (type: string) => {
  switch (type) {
    case 'database':
      return 'rounded-full'; // Cylinder-like appearance
    case 'activity':
      return 'clip-path-hexagon'; // Hexagon for activities
    case 'power_bi_chart':
      return 'rounded-lg transform rotate-1'; // Slightly rotated rectangle
    default:
      return 'rounded-lg'; // Standard rectangle
  }
};

const truncateText = (text: string, maxLength: number = 20) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const { component, isSelected, onClick } = data;

  return (
    <div
      className={`${getNodeStyle(component, isSelected)} ${getNodeShape(component.type)} p-4 min-w-[260px] max-w-[320px] shadow-lg`}
      onClick={() => onClick(component.id)}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400" />

      {/* Node Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded ${component.hasFailed ? 'bg-red-200 text-red-700' : 'bg-white shadow-sm'}`}>
            {getComponentIcon(component.type)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 
              className="font-semibold text-sm text-gray-900 truncate"
              title={component.name}
            >
              {truncateText(component.name, 18)}
            </h3>
            <p className="text-xs text-gray-500 truncate" title={component.id}>
              {truncateText(component.id, 20)}
            </p>
          </div>
        </div>
        
        {/* Status and Environment Indicators */}
        <div className="flex flex-col items-end gap-1">
          {component.hasFailed && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">❌</span>
            </div>
          )}
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${component.environment === 'production' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
            }
          `}>
            {component.environment === 'production' ? 'PROD' : 'PPE'}
          </span>
        </div>
      </div>

      {/* Node Details */}
      <div className="space-y-1">
        {component.datatype && (
          <div className="text-xs">
            <span className="text-gray-500">Type:</span>
            <span className="ml-1 font-medium">{component.datatype}</span>
          </div>
        )}
        
        {component.database && (
          <div className="text-xs">
            <span className="text-gray-500">DB:</span>
            <span className="ml-1 font-medium" title={component.database}>
              {truncateText(component.database, 15)}
            </span>
          </div>
        )}

        {/* Power BI specific info */}
        {component.type === 'power_bi_chart' && component.chartType && (
          <div className="text-xs">
            <span className="text-gray-500">Chart:</span>
            <span className="ml-1 font-medium">{component.chartType}</span>
          </div>
        )}
      </div>

      {/* Failure Details */}
      {component.hasFailed && component.failureDetails && (
        <div className="mt-2 p-2 bg-red-100 rounded text-xs">
          <div className="text-red-700 font-medium">⚠️ Pipeline Failed</div>
          <div className="text-red-600">
            {component.failureDetails.failureCount} failures
          </div>
        </div>
      )}
    </div>
  );
};