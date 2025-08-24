import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Download, Maximize } from 'lucide-react';
import { LineageConfig } from '../types';

interface LineageControlsProps {
  config: LineageConfig;
  onConfigChange: (config: Partial<LineageConfig>) => void;
  onExport: () => void;
  onFullscreen: () => void;
  isGenerating?: boolean;
}

export const LineageControls: React.FC<LineageControlsProps> = ({
  config,
  onConfigChange,
  onExport,
  onFullscreen,
  isGenerating = false
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Direction Control */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Direction:</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => onConfigChange({ direction: 'upstream' })}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm transition-colors
                  ${config.direction === 'upstream' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <ArrowUp className="h-4 w-4" />
                Upstream
              </button>
              <button
                onClick={() => onConfigChange({ direction: 'both' })}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm border-x border-gray-300 transition-colors
                  ${config.direction === 'both' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <ArrowUpDown className="h-4 w-4" />
                Both
              </button>
              <button
                onClick={() => onConfigChange({ direction: 'downstream' })}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm transition-colors
                  ${config.direction === 'downstream' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <ArrowDown className="h-4 w-4" />
                Downstream
              </button>
            </div>
          </div>

          {/* Depth Control */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Depth:</label>
            <select
              value={config.depth}
              onChange={(e) => onConfigChange({ depth: Number(e.target.value) })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(depth => (
                <option key={depth} value={depth}>{depth} level{depth > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFullscreen}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
          >
            <Maximize className="h-4 w-4" />
            Fullscreen
          </button>
          <button
            onClick={onExport}
            disabled={!config.selectedComponentId || isGenerating}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            Export SVG
          </button>
        </div>
      </div>

      {config.selectedComponentId && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Selected:</span> {config.selectedComponentId}
        </div>
      )}
    </div>
  );
};