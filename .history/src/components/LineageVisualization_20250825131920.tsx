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
    const horizontalSpacing = 500; // Much larger horizontal spacing
    const baseVerticalSpacing = 300; // Much larger vertical spacing
    const minVerticalGap = 250; // Much larger minimum gap
    const maxNodesPerColumn = 3; // Limit nodes per column for better readability
    const jitterRange = 80; // Increased random offset

    // Separate nodes into upstream and downstream
    const upstream = new Set<string>();
    const downstream = new Set<string>();
    
    const collectLineage = (nodeId: string, isUpstream: boolean) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      if (nodeId !== rootId) {
        if (isUpstream) {
          upstream.add(nodeId);
          levels.set(nodeId, -1); // All upstream nodes at level -1
        } else {
          downstream.add(nodeId);
          levels.set(nodeId, 1); // All downstream nodes at level 1
        }
      } else {
        levels.set(nodeId, 0); // Root node at level 0
      }

      // Process upstream nodes
      if (isUpstream) {
        allEdges
          .filter(edge => edge.target === nodeId && edgeIds.includes(edge.id))
          .forEach(edge => collectLineage(edge.source, true));
      }
      // Process downstream nodes
      else {
        allEdges
          .filter(edge => edge.source === nodeId && edgeIds.includes(edge.id))
          .forEach(edge => collectLineage(edge.target, false));
      }
    };

    // First collect upstream nodes
    collectLineage(rootId, true);
    // Reset visited for downstream collection
    visited.clear();
    // Then collect downstream nodes
    collectLineage(rootId, false);

    // Group nodes by level (-1 for upstream, 0 for root, 1 for downstream)
    upstream.forEach(nodeId => {
      if (!nodesByLevel.has(-1)) {
        nodesByLevel.set(-1, []);
      }
      nodesByLevel.get(-1)!.push(nodeId);
    });

    nodesByLevel.set(0, [rootId]);

    downstream.forEach(nodeId => {
      if (!nodesByLevel.has(1)) {
        nodesByLevel.set(1, []);
      }
      nodesByLevel.get(1)!.push(nodeId);
    });

    // Process nodes level by level (upstream -> root -> downstream)
    const levels = [-1, 0, 1];
    
    levels.forEach(level => {
      const nodesAtLevel = nodesByLevel.get(level) || [];
      // Base x position: left for upstream, center for root, right for downstream
      const baseX = level * horizontalSpacing;
      
      // Sort nodes by number of connections for better organization
      const sortedNodes = [...nodesAtLevel].sort((a, b) => {
        const edgesA = allEdges.filter(e => e.source === a || e.target === a).length;
        const edgesB = allEdges.filter(e => e.source === b || e.target === b).length;
        return edgesB - edgesA;
      });

      // Calculate vertical distribution
      const totalHeight = (sortedNodes.length - 1) * baseVerticalSpacing;
      const startY = -totalHeight / 2;

      sortedNodes.forEach((nodeId, index) => {
        // Calculate base position
        const baseY = startY + index * baseVerticalSpacing;
        
        // Add controlled randomness - less horizontal jitter for better alignment
        const jitterX = (Math.random() * jitterRange - jitterRange / 2) * 0.5; // Reduced horizontal jitter
        const jitterY = Math.random() * jitterRange - jitterRange / 2;
        
        positions.set(nodeId, {
          x: baseX + jitterX,
          y: baseY + jitterY
        });
      });
    });

    // Enhanced overlap prevention
    const adjustForOverlaps = () => {
      const levelGroups = new Map<number, Array<{ id: string; x: number; y: number }>>();
      
      positions.forEach((pos, nodeId) => {
        const level = Math.round(pos.x / horizontalSpacing);
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push({ id: nodeId, x: pos.x, y: pos.y });
      });
      
      // Multiple passes to ensure no overlaps
      const numPasses = 2;
      for (let pass = 0; pass < numPasses; pass++) {
        levelGroups.forEach(nodes => {
          nodes.sort((a, b) => a.y - b.y);
          
          for (let i = 1; i < nodes.length; i++) {
            const current = nodes[i];
            const previous = nodes[i - 1];
            const gap = current.y - previous.y;
            
            if (gap < minVerticalGap) {
              // Add some randomness to the spacing
              const adjustment = minVerticalGap - gap + (Math.random() * 20);
              current.y = previous.y + adjustment;
              positions.set(current.id, { x: current.x, y: current.y });
            }
          }
        });
      }
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
