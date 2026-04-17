import type { Config } from "./config.js";
import type {
  N8nWorkflow,
  N8nWorkflowSummary,
  N8nExecution,
  N8nExecutionSummary,
  N8nNodeType,
} from "./types.js";

export class N8nClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: Config) {
    this.baseUrl = config.n8nBaseUrl;
    this.headers = {
      "X-N8N-API-KEY": config.n8nApiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;

    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new N8nApiError(response.status, errorBody, method, path);
    }

    return response.json() as Promise<T>;
  }

  async listWorkflows(): Promise<N8nWorkflowSummary[]> {
    const result = await this.request<{ data: N8nWorkflowSummary[] }>(
      "GET",
      "/workflows"
    );
    return result.data;
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("GET", `/workflows/${id}`);
  }

  async createWorkflow(
    workflow: Partial<N8nWorkflow>
  ): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("POST", "/workflows", workflow);
  }

  async updateWorkflow(
    id: string,
    workflow: Partial<N8nWorkflow>
  ): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("PUT", `/workflows/${id}`, workflow);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.request<void>("DELETE", `/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("PATCH", `/workflows/${id}`, {
      active: true,
    });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("PATCH", `/workflows/${id}`, {
      active: false,
    });
  }

  async executeWorkflow(
    id: string,
    data?: Record<string, unknown>
  ): Promise<N8nExecution> {
    return this.request<N8nExecution>("POST", `/workflows/${id}/run`, data);
  }

  async listExecutions(
    workflowId?: string
  ): Promise<N8nExecutionSummary[]> {
    const query = workflowId ? `?workflowId=${workflowId}` : "";
    const result = await this.request<{ data: N8nExecutionSummary[] }>(
      "GET",
      `/executions${query}`
    );
    return result.data;
  }

  async getExecution(id: string): Promise<N8nExecution> {
    return this.request<N8nExecution>("GET", `/executions/${id}`);
  }

  async getNodeTypes(): Promise<N8nNodeType[]> {
    return this.request<N8nNodeType[]>("GET", "/node-types");
  }
}

export class N8nApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    method: string,
    path: string
  ) {
    super(`n8n API error ${status} on ${method} ${path}: ${body}`);
    this.name = "N8nApiError";
  }
}
