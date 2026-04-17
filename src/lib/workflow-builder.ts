import type { N8nNode, N8nConnection } from "./types.js";
import { nodeCatalog, findNodesByIntent, getNodeByType } from "./node-catalog.js";
import type { NodeBlueprint } from "./node-catalog.js";

export interface WorkflowStep {
  intent: string;
  nodeType?: string;
  config?: string;
  customParameters?: Record<string, unknown>;
}

export interface WorkflowPlan {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface BuiltWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, Record<string, N8nConnection[][]>>;
  settings: Record<string, unknown>;
  explanation: string[];
}

const NODE_SPACING_X = 250;
const START_X = 250;
const START_Y = 300;

export function buildWorkflow(plan: WorkflowPlan): BuiltWorkflow {
  const nodes: N8nNode[] = [];
  const connections: Record<string, Record<string, N8nConnection[][]>> = {};
  const explanation: string[] = [];

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const resolved = resolveNode(step);

    if (!resolved) {
      explanation.push(
        `Step ${i + 1}: Could not find a matching node for "${step.intent}". Skipped.`
      );
      continue;
    }

    const { blueprint, configKey } = resolved;
    const config = configKey
      ? blueprint.commonConfigs[configKey]
      : Object.values(blueprint.commonConfigs)[0];

    const nodeName = generateNodeName(blueprint.displayName, nodes);
    const position: [number, number] = [
      START_X + i * NODE_SPACING_X,
      START_Y,
    ];

    const parameters = {
      ...(config?.parameters ?? {}),
      ...(step.customParameters ?? {}),
    };

    const node: N8nNode = {
      id: crypto.randomUUID(),
      name: nodeName,
      type: blueprint.type,
      typeVersion: blueprint.typeVersion,
      position,
      parameters,
    };

    nodes.push(node);

    if (i > 0) {
      const prevNode = nodes[i - 1];
      if (!connections[prevNode.name]) {
        connections[prevNode.name] = {};
      }
      if (!connections[prevNode.name]["main"]) {
        connections[prevNode.name]["main"] = [[]];
      }
      connections[prevNode.name]["main"][0].push({
        node: nodeName,
        type: "main",
        index: 0,
      });
    }

    const credNote = config?.credentials
      ? ` (requires ${config.credentials} credentials)`
      : "";
    explanation.push(
      `Step ${i + 1}: "${nodeName}" (${blueprint.type}) — ${config?.description ?? blueprint.description}${credNote}`
    );
  }

  if (nodes.length > 0 && !isTriggerNode(nodes[0].type)) {
    explanation.unshift(
      "Note: First node is not a trigger. This workflow must be started manually or you should add a trigger node."
    );
  }

  return {
    name: plan.name,
    nodes,
    connections,
    settings: { executionOrder: "v1" },
    explanation,
  };
}

export function suggestWorkflow(description: string): WorkflowPlan {
  const lower = description.toLowerCase();
  const steps: WorkflowStep[] = [];

  const trigger = detectTrigger(lower);
  steps.push(trigger);

  const actions = detectActions(lower);
  steps.push(...actions);

  if (steps.length === 1) {
    steps.push({
      intent: "code processing",
      nodeType: "n8n-nodes-base.code",
      config: "javascript",
    });
  }

  return {
    name: generateWorkflowName(description),
    description,
    steps,
  };
}

function detectTrigger(description: string): WorkflowStep {
  const triggerPatterns: Array<{ pattern: RegExp; step: WorkflowStep }> = [
    {
      pattern: /\b(every\s+(day|morning|evening|night|hour|minute)|daily|hourly|scheduled?|cron|at \d+\s*(am|pm)?)\b/,
      step: { intent: "schedule trigger", nodeType: "n8n-nodes-base.scheduleTrigger", config: "everyMorning" },
    },
    {
      pattern: /\b(webhook|http\s+request\s+comes|receives?\s+(a\s+)?request|api\s+endpoint|incoming\s+data)\b/,
      step: { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook", config: "postEndpoint" },
    },
    {
      pattern: /\b(new\s+email|email\s+(arrives?|comes?|received?)|inbox|imap)\b/,
      step: { intent: "email trigger", nodeType: "n8n-nodes-base.emailReadImap", config: "inbox" },
    },
    {
      pattern: /\b(manual|test|try)\b/,
      step: { intent: "manual trigger", nodeType: "n8n-nodes-base.manualTrigger", config: "default" },
    },
  ];

  for (const { pattern, step } of triggerPatterns) {
    if (pattern.test(description)) {
      return step;
    }
  }

  return { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook", config: "postEndpoint" };
}

function detectActions(description: string): WorkflowStep[] {
  const matchedActions: Array<{ index: number; step: WorkflowStep }> = [];

  const actionPatterns: Array<{ pattern: RegExp; step: WorkflowStep }> = [
    {
      pattern: /\b(check\s+(\w+\s+)?email|read\s+(\w+\s+)?email|fetch\s+(\w+\s+)?email|get\s+(\w+\s+)?email)/,
      step: { intent: "read emails", nodeType: "n8n-nodes-base.emailReadImap", config: "inbox" },
    },
    {
      pattern: /\b(send\s+(\w+\s+)?slack|slack\s+(message|notification|summary)|notify\s+(\w+\s+)?slack|post\s+to\s+slack)\b/,
      step: { intent: "send slack message", nodeType: "n8n-nodes-base.slack", config: "sendMessage" },
    },
    {
      pattern: /\b(send\s+(\w+\s+)?email|email\s+me|email\s+the|email\s+(notification|alert|summary|report)|notify\s+(via\s+)?email)\b/,
      step: { intent: "send email", nodeType: "n8n-nodes-base.emailSend", config: "sendEmail" },
    },
    {
      pattern: /\b(send\s+(\w+\s+)?telegram|telegram\s+(message|notification)|notify\s+(\w+\s+)?(on\s+)?telegram)\b/,
      step: { intent: "send telegram", nodeType: "n8n-nodes-base.telegram", config: "sendMessage" },
    },
    {
      pattern: /\b(send\s+(\w+\s+)?discord|discord\s+(message|notification)|notify\s+(\w+\s+)?(on\s+)?discord)\b/,
      step: { intent: "send discord message", nodeType: "n8n-nodes-base.discord", config: "sendWebhook" },
    },
    {
      pattern: /\b(save\s+(\w+\s+)?to\s+supabase|insert\s+(\w+\s+)?supabase|supabase\s+(table|row|insert|save|store)|store\s+(\w+\s+)?in\s+supabase)\b/,
      step: { intent: "save to supabase", nodeType: "n8n-nodes-base.supabase", config: "insertRow" },
    },
    {
      pattern: /\b(store\s+(it\s+)?in\s+(a\s+)?(database|db)|save\s+(it\s+)?to\s+(a\s+)?(database|db)|database|store\s+in\s+db)\b/,
      step: { intent: "save to database", nodeType: "n8n-nodes-base.supabase", config: "insertRow" },
    },
    {
      pattern: /\b(save\s+(\w+\s+)?to\s+google\s+sheets?|add\s+(\w+\s+)?to\s+(\w+\s+)?spreadsheet|google\s+sheets?|append\s+(\w+\s+)?row|spreadsheet|csv)\b/,
      step: { intent: "save to google sheets", nodeType: "n8n-nodes-base.googleSheets", config: "appendRow" },
    },
    {
      pattern: /\b(save\s+(\w+\s+)?to\s+notion|add\s+(\w+\s+)?to\s+notion|notion\s+(page|database|entry)|create\s+(\w+\s+)?notion)\b/,
      step: { intent: "save to notion", nodeType: "n8n-nodes-base.notion", config: "createPage" },
    },
    {
      pattern: /\b(save\s+(\w+\s+)?to\s+airtable|airtable\s+(record|row|entry)|add\s+(\w+\s+)?to\s+airtable)\b/,
      step: { intent: "save to airtable", nodeType: "n8n-nodes-base.airtable", config: "createRecord" },
    },
    {
      pattern: /\b(rss|feed|scrape\s+(a\s+)?(website|page|url))\b/,
      step: { intent: "fetch rss feed", nodeType: "n8n-nodes-base.httpRequest", config: "getRequest" },
    },
    {
      pattern: /\b(fetch\s+(data|it|from|results?)|get\s+data|pull\s+data|retrieve\s+(data|results?|it))\b/,
      step: { intent: "http request", nodeType: "n8n-nodes-base.httpRequest", config: "getRequest" },
    },
    {
      pattern: /\b(call\s+(an?\s+)?api|fetch\s+(url)|http\s+request|get\s+from\s+api|api\s+call|external\s+api)\b/,
      step: { intent: "http request", nodeType: "n8n-nodes-base.httpRequest", config: "getRequest" },
    },
    {
      pattern: /\b(post\s+to\s+(an?\s+)?api|send\s+to\s+(an?\s+)?api|http\s+post|webhook\s+url|post\s+to\s+url|send\s+to\s+endpoint)\b/,
      step: { intent: "http post", nodeType: "n8n-nodes-base.httpRequest", config: "postJson" },
    },
    {
      pattern: /\b(wait\s+(\d+\s+)?(minute|hour|day|second)s?|delay\s+(\d+\s+)?(minute|hour|day|second)s?|pause\s+for)\b/,
      step: { intent: "wait", nodeType: "n8n-nodes-base.wait", config: "fiveMinutes" },
    },
    {
      pattern: /\b(filter|only\s+keep|exclude|remove\s+(items?|rows?)\s+(where|that|if))\b/,
      step: { intent: "filter data", nodeType: "n8n-nodes-base.filter", config: "filterByField" },
    },
    {
      pattern: /\b(if|check\s+(if|whether)|condition|branch|split\s+based)\b/,
      step: { intent: "conditional check", nodeType: "n8n-nodes-base.if", config: "stringEquals" },
    },
    {
      pattern: /\b(transform|map|reshape|convert|edit\s+fields?|set\s+fields?|rename\s+fields?)\b/,
      step: { intent: "transform data", nodeType: "n8n-nodes-base.set", config: "setFields" },
    },
    {
      pattern: /\b(run\s+code|custom\s+(code|logic|script)|javascript|python)\b/,
      step: { intent: "custom code", nodeType: "n8n-nodes-base.code", config: "javascript" },
    },
    {
      pattern: /\b(hubspot|create\s+(a\s+)?(contact|deal)\s+in\s+hubspot)\b/,
      step: { intent: "hubspot", nodeType: "n8n-nodes-base.hubspot", config: "createContact" },
    },
    {
      pattern: /\b(stripe|create\s+(a\s+)?customer|charge|payment)\b/,
      step: { intent: "stripe", nodeType: "n8n-nodes-base.stripe", config: "createCustomer" },
    },
    {
      pattern: /\b(postgres|sql\s+query|database\s+query)\b/,
      step: { intent: "postgres query", nodeType: "n8n-nodes-base.postgres", config: "query" },
    },
    {
      pattern: /\b(openai|gpt|ai\s+(generate|completion|response)|chat\s+completion|summarize|summary)\b/,
      step: { intent: "ai generation", nodeType: "@n8n/n8n-nodes-langchain.openAi", config: "chatCompletion" },
    },
    {
      pattern: /\b(send\s+me|notify\s+me|alert\s+me)\b/,
      step: { intent: "send email notification", nodeType: "n8n-nodes-base.emailSend", config: "sendEmail" },
    },
    {
      pattern: /\b(merge|combine|join)\s+(data|results?|inputs?)\b/,
      step: { intent: "merge data", nodeType: "n8n-nodes-base.merge", config: "append" },
    },
    {
      pattern: /\b(loop|iterate|batch|for\s+each|process\s+each)\b/,
      step: { intent: "loop over items", nodeType: "n8n-nodes-base.splitInBatches", config: "batchOf10" },
    },
  ];

  for (const { pattern, step } of actionPatterns) {
    const match = pattern.exec(description);
    if (match) {
      matchedActions.push({ index: match.index, step });
    }
  }

  matchedActions.sort((a, b) => a.index - b.index);
  const actions = matchedActions.map((m) => m.step);

  if (actions.length === 0) {
    const words = description.split(/\s+/);
    for (const word of words) {
      const matches = findNodesByIntent(word);
      if (matches.length > 0 && matches[0].category !== "trigger") {
        const firstConfig = Object.keys(matches[0].commonConfigs)[0];
        actions.push({
          intent: word,
          nodeType: matches[0].type,
          config: firstConfig,
        });
        break;
      }
    }
  }

  return actions;
}

function resolveNode(
  step: WorkflowStep
): { blueprint: NodeBlueprint; configKey?: string } | null {
  if (step.nodeType) {
    const blueprint = getNodeByType(step.nodeType);
    if (blueprint) {
      return { blueprint, configKey: step.config };
    }
  }

  const matches = findNodesByIntent(step.intent);
  if (matches.length > 0) {
    return { blueprint: matches[0] };
  }

  return null;
}

function isTriggerNode(type: string): boolean {
  return (
    type.includes("Trigger") ||
    type.includes("trigger") ||
    type.includes("webhook") ||
    type.includes("Webhook")
  );
}

function generateNodeName(baseName: string, existingNodes: N8nNode[]): string {
  const existing = existingNodes.filter((n) =>
    n.name.startsWith(baseName)
  );
  if (existing.length === 0) return baseName;
  return `${baseName} ${existing.length + 1}`;
}

function generateWorkflowName(description: string): string {
  const words = description
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 5);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function getAvailableCategories(): string[] {
  return [...new Set(nodeCatalog.map((n) => n.category))];
}

export function getCatalogSummary(): string {
  const categories = new Map<string, number>();
  for (const node of nodeCatalog) {
    categories.set(node.category, (categories.get(node.category) ?? 0) + 1);
  }

  const lines = [`${nodeCatalog.length} node types available:`];
  for (const [cat, count] of categories.entries()) {
    const nodes = nodeCatalog
      .filter((n) => n.category === cat)
      .map((n) => n.displayName)
      .join(", ");
    lines.push(`  ${cat} (${count}): ${nodes}`);
  }

  return lines.join("\n");
}
