import { Component, Edge } from '../types';

export const mockComponents: Component[] = [
  // Databases
  {
    id: 'db_billing_prod',
    name: 'M365BillingSystem-Prod',
    type: 'database',
    database: 'M365BillingSystem',
    endpoint: 'prod-sql-server.database.windows.net',
    environment: 'production'
  },
  {
    id: 'db_analytics_prod',
    name: 'Analytics-DataWarehouse',
    type: 'database', 
    database: 'AnalyticsWarehouse',
    endpoint: 'analytics-prod.database.windows.net',
    environment: 'production'
  },
  {
    id: 'db_customer_test',
    name: 'CustomerData-Test',
    type: 'database',
    database: 'CustomerData',
    endpoint: 'spo-ba-test.database.windows.net',
    environment: 'pre-production'
  },

  // Tables
  {
    id: 'tbl_users',
    name: 'Users',
    type: 'table',
    datatype: 'Table',
    database: 'M365BillingSystem',
    endpoint: 'prod-sql-server.database.windows.net',
    environment: 'production'
  },
  {
    id: 'tbl_billing_history',
    name: 'BillingHistory',
    type: 'table',
    datatype: 'Table',
    database: 'M365BillingSystem',
    endpoint: 'prod-sql-server.database.windows.net',
    environment: 'production',
    hasFailed: true,
    failureDetails: {
      pipelineName: 'Daily-Billing-ETL',
      failureTime: '2024-01-15 08:30:00',
      failureCount: 3,
      status: 'Failed'
    }
  },
  {
    id: 'tbl_subscriptions',
    name: 'Subscriptions',
    type: 'table',
    datatype: 'Table',
    database: 'M365BillingSystem',
    endpoint: 'prod-sql-server.database.windows.net',
    environment: 'production'
  },

  // Views
  {
    id: 'view_customer_metrics',
    name: 'CustomerMetrics_View',
    type: 'view',
    datatype: 'View',
    database: 'AnalyticsWarehouse',
    endpoint: 'analytics-prod.database.windows.net',
    environment: 'production'
  },
  {
    id: 'view_revenue_summary',
    name: 'RevenueSummary_View',
    type: 'view',
    datatype: 'View',
    database: 'AnalyticsWarehouse',
    endpoint: 'analytics-prod.database.windows.net',
    environment: 'production'
  },

  // Stored Procedures
  {
    id: 'sp_calculate_billing',
    name: 'SP_CalculateMonthlyBilling',
    type: 'stored_procedure',
    datatype: 'StoredProcedure',
    database: 'M365BillingSystem',
    endpoint: 'prod-sql-server.database.windows.net',
    environment: 'production'
  },
  {
    id: 'sp_update_metrics',
    name: 'SP_UpdateCustomerMetrics',
    type: 'stored_procedure',
    datatype: 'StoredProcedure',
    database: 'AnalyticsWarehouse',
    endpoint: 'analytics-prod.database.windows.net',
    environment: 'production'
  },

  // Activities/ETL Processes
  {
    id: 'act_billing_etl',
    name: 'Daily-Billing-ETL',
    type: 'activity',
    datatype: 'DataFlow',
    database: 'DataFactory',
    endpoint: 'adf-prod.westus2.azuredatafactory.net',
    environment: 'production',
    hasFailed: true,
    failureDetails: {
      pipelineName: 'Daily-Billing-ETL',
      failureTime: '2024-01-15 08:30:00',
      failureCount: 3,
      status: 'Failed'
    }
  },
  {
    id: 'act_customer_sync',
    name: 'Customer-Data-Sync',
    type: 'activity',
    datatype: 'DataFlow',
    database: 'DataFactory',
    endpoint: 'adf-prod.westus2.azuredatafactory.net',
    environment: 'production'
  },

  // Power BI Charts
  {
    id: 'pbi_revenue_card',
    name: 'Total Revenue Card',
    type: 'power_bi_chart',
    datatype: 'Card',
    database: 'PowerBI',
    endpoint: 'app.powerbi.com',
    environment: 'production',
    dashboardName: 'Executive Dashboard',
    pageName: 'Revenue Overview',
    chartType: 'Card'
  },
  {
    id: 'pbi_customer_table',
    name: 'Top Customers Table',
    type: 'power_bi_chart',
    datatype: 'Table',
    database: 'PowerBI',
    endpoint: 'app.powerbi.com',
    environment: 'production',
    dashboardName: 'Executive Dashboard',
    pageName: 'Customer Analytics',
    chartType: 'Table'
  },
  {
    id: 'pbi_trend_visual',
    name: 'Revenue Trend Visual',
    type: 'power_bi_chart',
    datatype: 'LineChart',
    database: 'PowerBI',
    endpoint: 'app.powerbi.com',
    environment: 'production',
    dashboardName: 'Executive Dashboard',
    pageName: 'Revenue Overview',
    chartType: 'LineChart'
  },

  // Additional components for testing large graphs
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `additional_table_${i}`,
    name: `AdditionalTable_${i}`,
    type: 'table' as const,
    datatype: 'Table',
    database: 'AnalyticsWarehouse',
    endpoint: 'analytics-prod.database.windows.net',
    environment: 'production' as const
  }))
];

export const mockEdges: Edge[] = [
  // Database to Tables
  { id: 'e1', source: 'db_billing_prod', target: 'tbl_users', label: 'contains', type: 'references' },
  { id: 'e2', source: 'db_billing_prod', target: 'tbl_billing_history', label: 'contains', type: 'references' },
  { id: 'e3', source: 'db_billing_prod', target: 'tbl_subscriptions', label: 'contains', type: 'references' },

  // Tables to Stored Procedures
  { id: 'e4', source: 'tbl_users', target: 'sp_calculate_billing', label: 'reads', type: 'reads' },
  { id: 'e5', source: 'tbl_subscriptions', target: 'sp_calculate_billing', label: 'reads', type: 'reads' },
  { id: 'e6', source: 'sp_calculate_billing', target: 'tbl_billing_history', label: 'writes', type: 'writes' },

  // Activities/ETL
  { id: 'e7', source: 'tbl_billing_history', target: 'act_billing_etl', label: 'reads', type: 'reads' },
  { id: 'e8', source: 'tbl_users', target: 'act_customer_sync', label: 'reads', type: 'reads' },

  // ETL to Views
  { id: 'e9', source: 'act_billing_etl', target: 'view_revenue_summary', label: 'populates', type: 'writes' },
  { id: 'e10', source: 'act_customer_sync', target: 'view_customer_metrics', label: 'populates', type: 'writes' },

  // Views to Power BI
  { id: 'e11', source: 'view_revenue_summary', target: 'pbi_revenue_card', label: 'feeds', type: 'reads' },
  { id: 'e12', source: 'view_revenue_summary', target: 'pbi_trend_visual', label: 'feeds', type: 'reads' },
  { id: 'e13', source: 'view_customer_metrics', target: 'pbi_customer_table', label: 'feeds', type: 'reads' },

  // Additional edges for testing
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `additional_edge_${i}`,
    source: 'view_customer_metrics',
    target: `additional_table_${i}`,
    label: 'feeds',
    type: 'reads' as const
  }))
];