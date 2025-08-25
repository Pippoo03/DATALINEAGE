import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge as ReactFlowEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
  EdgeTypes,
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

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export const LineageVisualization: React.FC<LineageVisualizationProps> = ({
  components,
  edges,
  config,
  onNodeClick,
}) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  const generateHierarchicalLayout = useCallback((
    nodeIds: string[], 
    edgeIds: string[], 
    allEdges: Edge[], 
    rootId: string
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const nodesByLevel = new Map<number, string[]>();
    const nodeWidth = 280;
    const nodeHeight = 140;
    const horizontalSpacing = 400;
    const verticalSpacing = 180;
    const minVerticalGap = 20;

    const calculateLevels = (nodeId: string, level: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const currentLevel = levels.get(nodeId) || level;
      if (Math.abs(level) < Math.abs(currentLevel) || (Math.abs(level) === Math.abs(currentLevel) && level > currentLevel)) {
        levels.set(nodeId, level);
      }

      allEdges
        .filter(edge => edge.source === nodeId && edgeIds.includes(edge.id))
        .forEach(edge => calculateLevels(edge.target, level + 1));

      allEdges
        .filter(edge => edge.target === nodeId && edgeIds.includes(edge.id))
        .forEach(edge => calculateLevels(edge.source, level - 1));
    };

    calculateLevels(rootId, 0);

    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(nodeId);
    });

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
          const minDistance = nodeHeight + minVerticalGap;
          
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

  const generateLineage = useCallback(() => {
    if (!config.selectedComponentId) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Layout configuration
    const VERTICAL_SPACING = 200;
    const HORIZONTAL_SPACING = 300;

    // Create component map for quick lookups
    const componentMap = new Map(components.map((c: Component) => [c.id, c]));
    const visitedNodes = new Set<string>();
    const graphNodes: Node[] = [];
    const graphEdges: ReactFlowEdge[] = [];

    // Helper function to recursively build the graph
    const buildGraph = (nodeId: string, position: { x: number, y: number }) => {
      if (visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);

      const component = componentMap.get(nodeId);
      if (!component) return;

      // Add node
      graphNodes.push({
        id: nodeId,
        type: 'custom',
        position,
        data: { 
          component,
          isSelected: nodeId === config.selectedComponentId 
        }
      });

      // Find related edges and nodes
      let relatedEdges: Edge[] = [];
      if (config.direction === 'upstream' || config.direction === 'both') {
        relatedEdges = relatedEdges.concat(edges.filter((e: Edge) => e.target === nodeId));
      }
      if (config.direction === 'downstream' || config.direction === 'both') {
        relatedEdges = relatedEdges.concat(edges.filter((e: Edge) => e.source === nodeId));
      }

      // Process related nodes with proper spacing
      relatedEdges.forEach((edge, index) => {
        const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
        if (!visitedNodes.has(nextNodeId)) {
          const xOffset = (index - (relatedEdges.length - 1) / 2) * HORIZONTAL_SPACING;
          const yOffset = edge.source === nodeId ? VERTICAL_SPACING : -VERTICAL_SPACING;
          
          buildGraph(
            nextNodeId,
            { 
              x: position.x + xOffset,
              y: position.y + yOffset
            }
          );
        }

        // Add edge
        graphEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      });
    };

    // Start building the graph from the selected component
    buildGraph(config.selectedComponentId, { x: window.innerWidth / 2, y: window.innerHeight / 3 });

    setNodes(graphNodes);
    setEdges(graphEdges);

    // Auto-fit the view
    setTimeout(() => {
      fitView({ padding: 0.5 });
    }, 100);
  }, [components, edges, config, setNodes, setEdges, fitView]);

  // Update layout when config changes
  useEffect(() => {
    generateLineage();
  }, [generateLineage]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );

  const generateLineage = useCallback(() => {
    if (!config.selectedComponentId) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Layout configuration
    const VERTICAL_SPACING = 200;
    const HORIZONTAL_SPACING = 300;

    // Create component map for quick lookups
    const componentMap = new Map(components.map(c => [c.id, c]));
    const visitedNodes = new Set<string>();
    const graphNodes: Node[] = [];
    const graphEdges: ReactFlowEdge[] = [];

    // Helper function to recursively build the graph
    const buildGraph = (nodeId: string, position: { x: number, y: number }) => {
      if (visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);

      const component = componentMap.get(nodeId);
      if (!component) return;

      // Add node
      graphNodes.push({
        id: nodeId,
        type: 'custom',
        position,
        data: { 
          component,
          isSelected: nodeId === config.selectedComponentId 
        }
      });

      // Find related edges and nodes
      let relatedEdges: Edge[] = [];
      if (config.direction === 'upstream' || config.direction === 'both') {
        relatedEdges = relatedEdges.concat(edges.filter(e => e.target === nodeId));
      }
      if (config.direction === 'downstream' || config.direction === 'both') {
        relatedEdges = relatedEdges.concat(edges.filter(e => e.source === nodeId));
      }

      // Process related nodes with proper spacing
      relatedEdges.forEach((edge, index) => {
        const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
        if (!visitedNodes.has(nextNodeId)) {
          const xOffset = (index - (relatedEdges.length - 1) / 2) * HORIZONTAL_SPACING;
          const yOffset = edge.source === nodeId ? VERTICAL_SPACING : -VERTICAL_SPACING;
          
          buildGraph(
            nextNodeId,
            { 
              x: position.x + xOffset,
              y: position.y + yOffset
            }
          );
        }
        // Add edge
        graphEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      });
    };

    // Start building the graph from the selected component
    buildGraph(config.selectedComponentId, { x: window.innerWidth / 2, y: window.innerHeight / 3 });

    setNodes(graphNodes);
    setEdges(graphEdges);

    // Auto-fit the view
    setTimeout(() => {
      fitView({ padding: 0.5 });
    }, 100);
  }, [components, edges, config, setNodes, setEdges, fitView]);

  // Update layout when config changes
  useEffect(() => {
    generateLineage();
  }, [generateLineage]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
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

      const relevantEdges = edges.filter(edge => {
        if (direction === 'up') {
          return edge.target === componentId;
        } else {
          return edge.source === componentId;
        }
      });

      relevantEdges.forEach(edge => {
        lineageEdges.add(edge.id);
        const nextComponentId = direction === 'up' ? edge.source : edge.target;
        lineageComponents.add(nextComponentId);
        
        if (currentDepth < config.depth) {
          traverse(nextComponentId, currentDepth + 1, direction);
        }
      });
    };

    // Start traversal based on direction
    if (config.direction === 'upstream' || config.direction === 'both') {
      traverse(config.selectedComponentId, 0, 'up');
    }
    if (config.direction === 'downstream' || config.direction === 'both') {
      traverse(config.selectedComponentId, 0, 'down');
    }

    // Always include the selected component
    lineageComponents.add(config.selectedComponentId);

    // Layout configuration
    const VERTICAL_SPACING = 200;    // Increased vertical spacing
    const HORIZONTAL_SPACING = 300;  // Increased horizontal spacing
    
    // Create arrays of upstream and downstream components
    const upstreamComps: string[] = [];
    const downstreamComps: string[] = [];
    const centerComp = config.selectedComponentId;

    // Separate components into upstream and downstream
    lineageComponents.forEach(compId => {
      if (compId === centerComp) return;
      
      const isUpstream = edges.some(edge => 
        edge.source === compId && 
        edge.target === centerComp
      );
      
      if (isUpstream) {
        upstreamComps.push(compId);
      } else {
        downstreamComps.push(compId);
      }
    });

    // Create nodes with proper positioning
    const newNodes: Node[] = [];
    
    // Add center node
    const centerComponent = components.find(c => c.id === centerComp);
    if (centerComponent) {
      newNodes.push({
        id: centerComponent.id,
        type: 'custom',
        position: { x: HORIZONTAL_SPACING * 1.5, y: VERTICAL_SPACING },
        data: { component: centerComponent, isSelected: true }
      });
    }

    // Position upstream nodes
    upstreamComps.forEach((compId, index) => {
      const component = components.find(c => c.id === compId);
      if (component) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        newNodes.push({
          id: component.id,
          type: 'custom',
          position: {
            x: col * HORIZONTAL_SPACING,
            y: row * VERTICAL_SPACING
          },
          data: { component, isSelected: false }
        });
      }
    });

    // Position downstream nodes
    downstreamComps.forEach((compId, index) => {
      const component = components.find(c => c.id === compId);
      if (component) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        newNodes.push({
          id: component.id,
          type: 'custom',
          position: {
            x: col * HORIZONTAL_SPACING,
            y: (row + 2) * VERTICAL_SPACING
          },
          data: { component, isSelected: false }
        });
      }
    });

    // Create edges
    const newEdges: ReactFlowEdge[] = Array.from(lineageEdges).map(edgeId => {
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) return null;
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'custom',
        animated: true,
      };
    }).filter((edge): edge is ReactFlowEdge => edge !== null);

    setNodes(newNodes);
    setEdges(newEdges);
    setIsGenerating(false);
    
    // Auto-fit the view
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
    const getNodePosition = (index: number, total: number, isUpstream: boolean) => {
      const verticalSpacing = 150;  // Increased vertical spacing between nodes
      const horizontalSpacing = 250; // Increased horizontal spacing between nodes
      const centerY = 300;  // Center point vertically
      
      if (isUpstream) {
        const row = Math.floor(index / 3);  // 3 nodes per row
        const col = index % 3;
        return {
          x: col * horizontalSpacing,
          y: centerY - (row + 1) * verticalSpacing
        };
      } else {
        const row = Math.floor(index / 3);
        const col = index % 3;
        return {
          x: col * horizontalSpacing,
          y: centerY + row * verticalSpacing
        };
      }
    const componentArray = Array.from(lineageComponents);
    const componentMap = new Map(components.map(c => [c.id, c]));
    
    // Calculate positions for left-to-right flow
    const positions = generateHierarchicalLayout(componentArray, Array.from(lineageEdges), edges, config.selectedComponentId);

    // Create React Flow nodes
    const flowNodes: Node[] = componentArray
      .map(id => componentMap.get(id))
      .filter(Boolean)
      .map(component => ({
        id: component!.id,
        type: 'custom',
        position: positions.get(component!.id) || { x: 0, y: 0 },
        data: {
          component: component!,
          isSelected: component!.id === config.selectedComponentId,
          onClick: onNodeClick
        }
      }));

    // Create React Flow edges
    const flowEdges: ReactFlowEdge[] = Array.from(lineageEdges).map(edgeId => {
      const edge = edges.find(e => e.id === edgeId)!;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'custom',
        animated: edge.animated || false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6B7280',
        },
        data: {
          label: edge.label,
          edgeType: edge.type
        }
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Fit view after nodes are set
    setTimeout(() => {
      fitView({ padding: 0.1, duration: 800 });
      setIsGenerating(false);
    }, 100);
  }, [config, components, edges, onNodeClick, setNodes, setEdges, fitView]);

  // Generate hierarchical layout positions
  const generateHierarchicalLayout = (
    nodeIds: string[], 
    edgeIds: string[], 
    allEdges: Edge[], 
    rootId: string
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const nodesByLevel = new Map<number, string[]>();

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
        .forEach(edge => {
          calculateLevels(edge.target, level + 1);
        });

      // Find upstream nodes (negative levels)
      allEdges
        .filter(edge => edge.target === nodeId && edgeIds.includes(edge.id))
        .forEach(edge => {
          calculateLevels(edge.source, level - 1);
        });
    };

    calculateLevels(rootId, 0);

    // Group nodes by level and sort levels
    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(nodeId);
    });

    // Calculate positions with proper spacing
    const nodeWidth = 280;
    const nodeHeight = 140;
    const horizontalSpacing = 400; // Increased spacing between levels
    const verticalSpacing = 180;   // Increased spacing between nodes in same level
    const minVerticalGap = 20;     // Minimum gap between nodes

    // Sort levels from most upstream to most downstream
    const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
      const nodesAtLevel = nodesByLevel.get(level)!;
      const x = level * horizontalSpacing;
      
      // Calculate total height needed for this level
      const totalHeight = (nodesAtLevel.length - 1) * verticalSpacing;
      const startY = -totalHeight / 2;
      
      // Sort nodes at this level for consistent positioning
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
      
      // Group positions by x-coordinate (level)
      positions.forEach((pos, nodeId) => {
        const level = Math.round(pos.x / horizontalSpacing);
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push({ id: nodeId, x: pos.x, y: pos.y });
      });
      
      // Sort and redistribute nodes in each level to prevent overlaps
      levelGroups.forEach((nodes, level) => {
        nodes.sort((a, b) => a.y - b.y);
        
        for (let i = 1; i < nodes.length; i++) {
          const current = nodes[i];
          const previous = nodes[i - 1];
          const minDistance = nodeHeight + minVerticalGap;
          
          if (current.y - previous.y < minDistance) {
            current.y = previous.y + minDistance;
            positions.set(current.id, { x: current.x, y: current.y });
          }
        }
      });
    };
    
    adjustForOverlaps();

    return positions;
  };

  useEffect(() => {
    generateLineage();
  }, [generateLineage]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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