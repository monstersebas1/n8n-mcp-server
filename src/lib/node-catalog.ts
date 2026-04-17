export interface NodeBlueprint {
  type: string;
  displayName: string;
  category: string;
  description: string;
  typeVersion: number;
  commonConfigs: Record<string, NodeConfig>;
}

export interface NodeConfig {
  description: string;
  parameters: Record<string, unknown>;
  credentials?: string;
}

export const nodeCatalog: NodeBlueprint[] = [
  // --- TRIGGERS ---
  {
    type: "n8n-nodes-base.webhook",
    displayName: "Webhook",
    category: "trigger",
    description: "Receives HTTP requests and starts the workflow",
    typeVersion: 2,
    commonConfigs: {
      postEndpoint: {
        description: "Receive POST requests at a custom path",
        parameters: { httpMethod: "POST", path: "incoming", responseMode: "onReceived" },
      },
      getEndpoint: {
        description: "Receive GET requests",
        parameters: { httpMethod: "GET", path: "status", responseMode: "onReceived" },
      },
    },
  },
  {
    type: "n8n-nodes-base.scheduleTrigger",
    displayName: "Schedule Trigger",
    category: "trigger",
    description: "Starts the workflow on a schedule (cron, interval, or specific times)",
    typeVersion: 1,
    commonConfigs: {
      everyMorning: {
        description: "Run every day at 9 AM",
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 9 * * *" }] } },
      },
      everyHour: {
        description: "Run every hour",
        parameters: { rule: { interval: [{ field: "hours", hoursInterval: 1 }] } },
      },
      everyFiveMinutes: {
        description: "Run every 5 minutes",
        parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 5 }] } },
      },
    },
  },
  {
    type: "n8n-nodes-base.manualTrigger",
    displayName: "Manual Trigger",
    category: "trigger",
    description: "Start workflow manually for testing",
    typeVersion: 1,
    commonConfigs: {
      default: {
        description: "Standard manual trigger",
        parameters: {},
      },
    },
  },
  {
    type: "n8n-nodes-base.emailReadImap",
    displayName: "Email Trigger (IMAP)",
    category: "trigger",
    description: "Triggers when a new email arrives in an IMAP mailbox",
    typeVersion: 2,
    commonConfigs: {
      inbox: {
        description: "Watch inbox for new emails",
        parameters: { mailbox: "INBOX", options: {} },
        credentials: "imap",
      },
    },
  },

  // --- COMMUNICATION ---
  {
    type: "n8n-nodes-base.slack",
    displayName: "Slack",
    category: "communication",
    description: "Send messages, manage channels, and interact with Slack",
    typeVersion: 2,
    commonConfigs: {
      sendMessage: {
        description: "Send a message to a Slack channel",
        parameters: { resource: "message", operation: "post", channel: "", text: "" },
        credentials: "slackApi",
      },
      sendDM: {
        description: "Send a direct message to a user",
        parameters: { resource: "message", operation: "post", channel: "", text: "" },
        credentials: "slackApi",
      },
    },
  },
  {
    type: "n8n-nodes-base.emailSend",
    displayName: "Send Email",
    category: "communication",
    description: "Send emails via SMTP",
    typeVersion: 2,
    commonConfigs: {
      sendEmail: {
        description: "Send a plain text email",
        parameters: { fromEmail: "", toEmail: "", subject: "", text: "" },
        credentials: "smtp",
      },
      sendHtml: {
        description: "Send an HTML email",
        parameters: { fromEmail: "", toEmail: "", subject: "", html: "" },
        credentials: "smtp",
      },
    },
  },
  {
    type: "n8n-nodes-base.discord",
    displayName: "Discord",
    category: "communication",
    description: "Send messages to Discord channels via webhooks",
    typeVersion: 2,
    commonConfigs: {
      sendWebhook: {
        description: "Send a message via Discord webhook",
        parameters: { webhookUri: "", text: "" },
      },
    },
  },
  {
    type: "n8n-nodes-base.telegram",
    displayName: "Telegram",
    category: "communication",
    description: "Send messages and media via Telegram bot",
    typeVersion: 1,
    commonConfigs: {
      sendMessage: {
        description: "Send a text message",
        parameters: { resource: "message", operation: "sendMessage", chatId: "", text: "" },
        credentials: "telegramApi",
      },
    },
  },

  // --- DATA / DATABASE ---
  {
    type: "n8n-nodes-base.supabase",
    displayName: "Supabase",
    category: "database",
    description: "Read, insert, update, and delete rows in Supabase tables",
    typeVersion: 1,
    commonConfigs: {
      insertRow: {
        description: "Insert a new row into a table",
        parameters: { resource: "row", operation: "create", tableId: "" },
        credentials: "supabaseApi",
      },
      getRows: {
        description: "Get all rows from a table",
        parameters: { resource: "row", operation: "getAll", tableId: "", returnAll: true },
        credentials: "supabaseApi",
      },
      updateRow: {
        description: "Update a row by ID",
        parameters: { resource: "row", operation: "update", tableId: "" },
        credentials: "supabaseApi",
      },
    },
  },
  {
    type: "n8n-nodes-base.postgres",
    displayName: "Postgres",
    category: "database",
    description: "Execute SQL queries against a PostgreSQL database",
    typeVersion: 2,
    commonConfigs: {
      query: {
        description: "Execute a custom SQL query",
        parameters: { operation: "executeQuery", query: "" },
        credentials: "postgres",
      },
      insertRow: {
        description: "Insert a row into a table",
        parameters: { operation: "insert", table: "", columns: "" },
        credentials: "postgres",
      },
    },
  },

  // --- HTTP / API ---
  {
    type: "n8n-nodes-base.httpRequest",
    displayName: "HTTP Request",
    category: "http",
    description: "Make HTTP requests to any API or URL",
    typeVersion: 4,
    commonConfigs: {
      getRequest: {
        description: "Make a GET request",
        parameters: { method: "GET", url: "", options: {} },
      },
      postJson: {
        description: "Make a POST request with JSON body",
        parameters: { method: "POST", url: "", sendBody: true, bodyParameters: { parameters: [] }, options: {} },
      },
      postForm: {
        description: "Make a POST request with form data",
        parameters: { method: "POST", url: "", contentType: "multipart-form-data", options: {} },
      },
      withAuth: {
        description: "Make an authenticated request with headers",
        parameters: { method: "GET", url: "", sendHeaders: true, headerParameters: { parameters: [] }, options: {} },
      },
    },
  },

  // --- DATA TRANSFORMATION ---
  {
    type: "n8n-nodes-base.set",
    displayName: "Edit Fields (Set)",
    category: "transform",
    description: "Set, rename, or remove fields in the data",
    typeVersion: 3,
    commonConfigs: {
      setFields: {
        description: "Set specific field values",
        parameters: { mode: "manual", fields: { values: [] }, options: {} },
      },
    },
  },
  {
    type: "n8n-nodes-base.if",
    displayName: "If",
    category: "flow",
    description: "Route data based on conditions (true/false branches)",
    typeVersion: 2,
    commonConfigs: {
      stringEquals: {
        description: "Check if a string field equals a value",
        parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "strict" } } },
      },
    },
  },
  {
    type: "n8n-nodes-base.switch",
    displayName: "Switch",
    category: "flow",
    description: "Route data to different outputs based on multiple conditions",
    typeVersion: 3,
    commonConfigs: {
      multiRoute: {
        description: "Route to multiple outputs based on field value",
        parameters: { mode: "rules", rules: { values: [] } },
      },
    },
  },
  {
    type: "n8n-nodes-base.merge",
    displayName: "Merge",
    category: "transform",
    description: "Combine data from multiple inputs",
    typeVersion: 3,
    commonConfigs: {
      append: {
        description: "Append items from both inputs",
        parameters: { mode: "append" },
      },
      mergeByKey: {
        description: "Merge by matching a key field",
        parameters: { mode: "combine", mergeByFields: { values: [{ field1: "", field2: "" }] }, joinMode: "keepMatches" },
      },
    },
  },
  {
    type: "n8n-nodes-base.code",
    displayName: "Code",
    category: "transform",
    description: "Run custom JavaScript or Python code",
    typeVersion: 2,
    commonConfigs: {
      javascript: {
        description: "Run custom JavaScript",
        parameters: { mode: "runOnceForAllItems", jsCode: "// Process all items\nreturn items;" },
      },
      python: {
        description: "Run custom Python",
        parameters: { mode: "runOnceForAllItems", language: "python", pythonCode: "return items" },
      },
    },
  },
  {
    type: "n8n-nodes-base.splitInBatches",
    displayName: "Loop Over Items",
    category: "flow",
    description: "Process items in batches",
    typeVersion: 3,
    commonConfigs: {
      batchOf10: {
        description: "Process 10 items at a time",
        parameters: { batchSize: 10, options: {} },
      },
    },
  },
  {
    type: "n8n-nodes-base.filter",
    displayName: "Filter",
    category: "transform",
    description: "Filter items based on conditions, removing non-matching items",
    typeVersion: 2,
    commonConfigs: {
      filterByField: {
        description: "Keep items where a field matches a condition",
        parameters: { conditions: { options: { caseSensitive: true } } },
      },
    },
  },

  // --- CRM ---
  {
    type: "n8n-nodes-base.hubspot",
    displayName: "HubSpot",
    category: "crm",
    description: "Manage contacts, deals, and companies in HubSpot",
    typeVersion: 2,
    commonConfigs: {
      createContact: {
        description: "Create a new contact",
        parameters: { resource: "contact", operation: "create" },
        credentials: "hubspotApi",
      },
      getDeal: {
        description: "Get deal details",
        parameters: { resource: "deal", operation: "get" },
        credentials: "hubspotApi",
      },
    },
  },

  // --- PRODUCTIVITY ---
  {
    type: "n8n-nodes-base.googleSheets",
    displayName: "Google Sheets",
    category: "productivity",
    description: "Read, write, and update Google Sheets spreadsheets",
    typeVersion: 4,
    commonConfigs: {
      appendRow: {
        description: "Append a row to a sheet",
        parameters: { resource: "sheet", operation: "append", documentId: "", sheetName: "" },
        credentials: "googleSheetsOAuth2Api",
      },
      readSheet: {
        description: "Read all rows from a sheet",
        parameters: { resource: "sheet", operation: "read", documentId: "", sheetName: "" },
        credentials: "googleSheetsOAuth2Api",
      },
    },
  },
  {
    type: "n8n-nodes-base.notion",
    displayName: "Notion",
    category: "productivity",
    description: "Create, read, and update Notion databases and pages",
    typeVersion: 2,
    commonConfigs: {
      createPage: {
        description: "Create a new page in a database",
        parameters: { resource: "page", operation: "create", databaseId: "" },
        credentials: "notionApi",
      },
      getPages: {
        description: "Get all pages from a database",
        parameters: { resource: "page", operation: "getAll", databaseId: "", returnAll: true },
        credentials: "notionApi",
      },
    },
  },
  {
    type: "n8n-nodes-base.airtable",
    displayName: "Airtable",
    category: "productivity",
    description: "Read, write, and manage Airtable bases",
    typeVersion: 2,
    commonConfigs: {
      listRecords: {
        description: "List all records from a table",
        parameters: { operation: "list" },
        credentials: "airtableTokenApi",
      },
      createRecord: {
        description: "Create a new record",
        parameters: { operation: "create" },
        credentials: "airtableTokenApi",
      },
    },
  },

  // --- FLOW ---
  {
    type: "n8n-nodes-base.wait",
    displayName: "Wait",
    category: "flow",
    description: "Pause workflow execution for a specified time",
    typeVersion: 1,
    commonConfigs: {
      fiveMinutes: {
        description: "Wait for 5 minutes",
        parameters: { amount: 5, unit: "minutes" },
      },
      oneHour: {
        description: "Wait for 1 hour",
        parameters: { amount: 1, unit: "hours" },
      },
      oneDay: {
        description: "Wait for 1 day",
        parameters: { amount: 1, unit: "days" },
      },
    },
  },

  // --- AI ---
  {
    type: "@n8n/n8n-nodes-langchain.openAi",
    displayName: "OpenAI",
    category: "ai",
    description: "Generate text, chat completions, and embeddings with OpenAI",
    typeVersion: 1,
    commonConfigs: {
      chatCompletion: {
        description: "Generate a chat completion",
        parameters: { resource: "chat", operation: "complete", model: "gpt-4o", messages: [] },
        credentials: "openAiApi",
      },
    },
  },

  // --- STRIPE ---
  {
    type: "n8n-nodes-base.stripe",
    displayName: "Stripe",
    category: "payment",
    description: "Manage customers, charges, subscriptions, and invoices in Stripe",
    typeVersion: 1,
    commonConfigs: {
      createCustomer: {
        description: "Create a new Stripe customer",
        parameters: { resource: "customer", operation: "create" },
        credentials: "stripeApi",
      },
      listCharges: {
        description: "List all charges",
        parameters: { resource: "charge", operation: "getAll", returnAll: true },
        credentials: "stripeApi",
      },
    },
  },
];

export function findNodesByIntent(intent: string): NodeBlueprint[] {
  const lower = intent.toLowerCase();
  const keywords = lower.split(/\s+/);

  return nodeCatalog
    .map((node) => {
      let score = 0;
      const searchText =
        `${node.displayName} ${node.description} ${node.category}`.toLowerCase();

      for (const keyword of keywords) {
        if (searchText.includes(keyword)) score += 1;
        if (node.displayName.toLowerCase().includes(keyword)) score += 2;
        if (node.category.toLowerCase() === keyword) score += 3;
      }

      return { node, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.node);
}

export function getTriggerNodes(): NodeBlueprint[] {
  return nodeCatalog.filter((n) => n.category === "trigger");
}

export function getNodeByType(type: string): NodeBlueprint | undefined {
  return nodeCatalog.find((n) => n.type === type);
}
