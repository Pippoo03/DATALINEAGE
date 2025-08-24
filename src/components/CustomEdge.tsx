import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

interface CustomEdgeData {
  label: string;
  edgeType: 'reads' | 'writes' | 'uses' | 'references';
}

export const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = (edgeType: string) => {
    switch (edgeType) {
      case 'reads': return '#10B981'; // Green
      case 'writes': return '#F59E0B'; // Amber
      case 'uses': return '#8B5CF6'; // Purple
      case 'references': return '#6B7280'; // Gray
      default: return '#6B7280';
    }
  };

  const edgeColor = getEdgeColor(data?.edgeType || 'references');

  return (
    <>
      <path
        d={edgePath}
        stroke={edgeColor}
        strokeWidth={2}
        fill="none"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
      />
      {data?.label && (
        <text>
          <textPath href={`#${edgePath}`} startOffset="50%" textAnchor="middle">
            <tspan
              x={labelX}
              y={labelY}
              className="react-flow__edge-text"
              fill={edgeColor}
              fontSize="12"
              fontWeight="500"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {data.label}
            </tspan>
          </textPath>
        </text>
      )}
    </>
  );
};