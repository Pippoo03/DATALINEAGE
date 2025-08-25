import React from 'react';
import { Component } from '../types';
import { 
  Database, 
  Table, 
  Eye, 
  Play, 
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

interface ComponentCardProps {
  component: Component;
  isSelected?: boolean;
  onClick: (component: Component) => void;
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case 'database': return <Database className="h-5 w-5" />;
    case 'table': return <Table className="h-5 w-5" />;
    case 'view': return <Eye className="h-5 w-5" />;
    case 'stored_procedure': return <Play className="h-5 w-5" />;
    case 'activity': return <Activity className="h-5 w-5" />;
    case 'power_bi_chart': return <BarChart3 className="h-5 w-5" />;
    default: return <Database className="h-5 w-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'database': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'table': return 'bg-green-50 text-green-700 border-green-200';
    case 'view': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'stored_procedure': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'activity': return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'power_bi_chart': return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const truncateText = (text: string, maxLength: number = 25) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  isSelected = false,
  onClick
}) => {
  return (
    <div
      onClick={() => onClick(component)}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
        ${component.hasFailed ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'hover:border-gray-300'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded border ${getTypeColor(component.type)}`}>
            {getComponentIcon(component.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate" title={component.name}>
              {truncateText(component.name, 20)}
            </h3>
            <p className="text-sm text-gray-500">{component.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {component.hasFailed ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" title="Component is healthy" />
          )}
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${component.environment === 'production' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
            }
          `}>
            {component.environment === 'production' ? 'PROD' : 'PRE-PROD'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {component.datatype && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Type:</span>
            <span className="text-sm font-medium">{component.datatype}</span>
          </div>
        )}
        
        {component.database && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Database:</span>
            <span className="text-sm font-medium" title={component.database}>
              {truncateText(component.database, 15)}
            </span>
          </div>
        )}

        {component.endpoint && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Endpoint:</span>
            <span className="text-sm font-medium" title={component.endpoint}>
              {truncateText(component.endpoint, 15)}
            </span>
          </div>
        )}

        {/* Power BI specific info */}
        {component.type === 'power_bi_chart' && (
          <>
            {component.dashboardName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Dashboard:</span>
                <span className="text-sm font-medium" title={component.dashboardName}>
                  {truncateText(component.dashboardName, 15)}
                </span>
              </div>
            )}
            {component.chartType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Chart Type:</span>
                <span className="text-sm font-medium">{component.chartType}</span>
              </div>
            )}
          </>
        )}

        {/* Failure info */}
        {component.hasFailed && component.failureDetails && (
          <div className="mt-3 p-2 bg-red-100 rounded border border-red-200">
            <div className="text-xs text-red-700">
              <div>Pipeline: {component.failureDetails.pipelineName}</div>
              <div>Failed: {component.failureDetails.failureTime}</div>
              <div>Count: {component.failureDetails.failureCount} failures</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};