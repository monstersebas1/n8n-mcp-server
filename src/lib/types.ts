export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, Record<string, N8nConnection[][]>>;
  settings?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface N8nWorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  status: "success" | "error" | "waiting" | "running";
  startedAt: string;
  stoppedAt?: string;
  data?: {
    resultData?: {
      runData?: Record<string, N8nNodeExecutionData[]>;
      error?: { message: string; stack?: string };
    };
  };
}

export interface N8nNodeExecutionData {
  startTime: number;
  executionTime: number;
  data: Record<string, unknown>;
  error?: { message: string; description?: string };
}

export interface N8nExecutionSummary {
  id: string;
  workflowId: string;
  status: "success" | "error" | "waiting" | "running";
  startedAt: string;
  stoppedAt?: string;
}

export interface N8nNodeType {
  name: string;
  displayName: string;
  description: string;
  group: string[];
  version: number;
  defaults: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
  properties: N8nNodeProperty[];
}

export interface N8nNodeProperty {
  displayName: string;
  name: string;
  type: string;
  default?: unknown;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string }>;
}
