import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge as ReactFlowEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
  MarkerType,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Component, Edge, LineageConfig } from '../types';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';

interface LineageVisualizationProps {
  components: Component[];
  edges: Edge[];
  config: LineageConfig;
  onNodeClick: (nodeId: string) => void;
}

export const LineageVisualization: React.FC<LineageVisualizationProps> = ({
  components,
  edges,
  config,
  onNodeClick,
}) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize node and edge types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  // Handle node click
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: ReactFlowEdge[]) => addEdge(params, eds)),
    [setEdges]
  );

  // Generate hierarchical layout
  const generateHierarchicalLayout = useCallback((
    componentIds: string[], 
    edgeIds: string[], 
    allEdges: Edge[], 
    rootId: string
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const nodesByLevel = new Map<number, string[]>();
    const horizontalSpacing = 400;
    const verticalSpacing = 180;
    const minVerticalGap = 140;

    // Calculate levels from root (0 = center, negative = upstream, positive = downstream)
    const calculateLevels = (nodeId: string, level: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const currentLevel = levels.get(nodeId) || level;
      if (Math.abs(level) < Math.abs(currentLevel) || (Math.abs(level) === Math.abs(currentLevel) && level > currentLevel)) {
        levels.set(nodeId, level);
      }

      // Find downstream nodes (positive levels)
      allEdges
        .filter(edge => edge.source === nodeId && edgeIds.includes(edge.id))
        .forEach(edge => calculateLevels(edge.target, level + 1));

      // Find upstream nodes (negative levels)
      allEdges
        .filter(edge => edge.target === nodeId && edgeIds.includes(edge.id))
        .forEach(edge => calculateLevels(edge.source, level - 1));
    };

    calculateLevels(rootId, 0);

    // Group nodes by level
    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(nodeId);
    });

    // Sort levels and calculate positions
    const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
      const nodesAtLevel = nodesByLevel.get(level)!;
      const x = level * horizontalSpacing;
      const totalHeight = (nodesAtLevel.length - 1) * verticalSpacing;
      const startY = -totalHeight / 2;
      const sortedNodes = [...nodesAtLevel].sort();

      sortedNodes.forEach((nodeId, index) => {
        positions.set(nodeId, {
          x,
          y: startY + index * verticalSpacing
        });
      });
    });

    // Adjust positions to prevent overlaps
    const adjustForOverlaps = () => {
      const levelGroups = new Map<number, Array<{ id: string; x: number; y: number }>>();
      
      positions.forEach((pos, nodeId) => {
        const level = Math.round(pos.x / horizontalSpacing);
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push({ id: nodeId, x: pos.x, y: pos.y });
      });
      
      levelGroups.forEach(nodes => {
        nodes.sort((a, b) => a.y - b.y);
        
        for (let i = 1; i < nodes.length; i++) {
          const current = nodes[i];
          const previous = nodes[i - 1];
          const minDistance = minVerticalGap;
          
          if (current.y - previous.y < minDistance) {
            current.y = previous.y + minDistance;
            positions.set(current.id, { x: current.x, y: current.y });
          }
        }
      });
    };
    
    adjustForOverlaps();
    return positions;
  }, []);

  // Generate lineage visualization
  const generateLineage = useCallback(() => {
    if (!config.selectedComponentId) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setIsGenerating(true);

    // Find related components based on direction and depth
    const visited = new Set<string>();
    const lineageComponents = new Set<string>();
    const lineageEdges = new Set<string>();

    const traverse = (componentId: string, currentDepth: number, direction: 'up' | 'down') => {
      if (currentDepth > config.depth || visited.has(`${componentId}-${direction}`)) {
        return;
      }

      visited.add(`${componentId}-${direction}`);
      lineageComponents.add(componentId);

      const relevantEdges = edges.filter((edge: Edge) => {
        if (direction === 'up') {
          return edge.target === componentId;
        } else {
          return edge.source === componentId;
        }
      });

      relevantEdges.forEach((edge: Edge) => {
        lineageEdges.add(edge.id);
        const nextComponentId = direction === 'up' ? edge.source : edge.target;
        lineageComponents.add(nextComponentId);
        
        if (currentDepth < config.depth) {
          traverse(nextComponentId, currentDepth + 1, direction);
        }
      });
    };

    if (config.direction === 'upstream' || config.direction === 'both') {
      traverse(config.selectedComponentId, 0, 'up');
    }
    if (config.direction === 'downstream' || config.direction === 'both') {
      traverse(config.selectedComponentId, 0, 'down');
    }

    lineageComponents.add(config.selectedComponentId);

    const componentArray = Array.from(lineageComponents);
    const componentMap = new Map(components.map(c => [c.id, c]));
    
    // Calculate positions for left-to-right flow
    const positions = generateHierarchicalLayout(
      componentArray,
      Array.from(lineageEdges),
      edges,
      config.selectedComponentId
    );

    // Create React Flow nodes
    const flowNodes: Node[] = componentArray
      .map(id => componentMap.get(id))
      .filter((component): component is Component => component !== undefined)
      .map(component => ({
        id: component.id,
        type: 'custom',
        position: positions.get(component.id) || { x: 0, y: 0 },
        data: {
          component,
          isSelected: component.id === config.selectedComponentId
        }
      }));

    // Create React Flow edges
    const flowEdges: ReactFlowEdge[] = Array.from(lineageEdges)
      .map(edgeId => edges.find((e: Edge) => e.id === edgeId))
      .filter((edge): edge is Edge => edge !== undefined)
      .map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'custom',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6B7280',
        }
      }));

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Fit view after nodes are set
    setTimeout(() => {
      fitView({ padding: 0.1, duration: 800 });
      setIsGenerating(false);
    }, 100);
  }, [components, edges, config, setNodes, setEdges, fitView, generateHierarchicalLayout]);

  // Update layout when config changes
  useEffect(() => {
    generateLineage();
  }, [generateLineage]);

  if (isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating lineage diagram...</p>
        </div>
      </div>
    );
  }

  if (!config.selectedComponentId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Select a component to visualize its lineage</p>
          <p className="text-gray-400 text-sm mt-2">Choose from the search results on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={nodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        className="bg-gray-50"
      >
        <Controls />
        <Background color="#e5e7eb" gap={16} />
      </ReactFlow>
    </div>
  );
};
