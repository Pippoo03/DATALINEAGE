export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  datatype?: string;
  database?: string;
  endpoint?: string;
  environment: 'production' | 'pre-production';
  hasFailed?: boolean;
  failureDetails?: {
    pipelineName: string;
    failureTime: string;
    failureCount: number;
    status: string;
  };
  // Power BI specific fields
  dashboardName?: string;
  pageName?: string;
  chartType?: string;
  // Position for React Flow
  position?: { x: number; y: number };
}

export type ComponentType = 
  | 'activity'
  | 'dataset' 
  | 'table'
  | 'view'
  | 'stored_procedure'
  | 'power_bi_chart'
  | 'database';

export interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'reads' | 'writes' | 'uses' | 'references';
  animated?: boolean;
}

export interface LineageConfig {
  direction: 'upstream' | 'downstream' | 'both';
  depth: number;
  selectedComponentId: string | null;
}

export interface SearchFilters {
  componentTypes: ComponentType[];
  environments: ('production' | 'pre-production')[];
  showFailedOnly: boolean;
}