import type { N8nNode, N8nConnection } from "../lib/types.js";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: {
    nodes: N8nNode[];
    connections: Record<string, Record<string, N8nConnection[][]>>;
    settings?: Record<string, unknown>;
  };
}

export const templates: WorkflowTemplate[] = [
  {
    id: "email-to-slack",
    name: "Email to Slack Notification",
    description:
      "Forward important emails to a Slack channel with sender, subject, and preview",
    category: "communication",
    workflow: {
      nodes: [
        {
          id: "trigger",
          name: "Email Trigger",
          type: "n8n-nodes-base.emailReadImap",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            mailbox: "INBOX",
            options: {},
          },
        },
        {
          id: "slack",
          name: "Send to Slack",
          type: "n8n-nodes-base.slack",
          typeVersion: 2,
          position: [500, 300],
          parameters: {
            resource: "message",
            operation: "post",
            channel: "",
            text: '=New email from {{$json["from"]}}\nSubject: {{$json["subject"]}}',
          },
        },
      ],
      connections: {
        "Email Trigger": {
          main: [[{ node: "Send to Slack", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "webhook-to-supabase",
    name: "Webhook to Supabase",
    description:
      "Receive webhook data and insert it into a Supabase table",
    category: "data",
    workflow: {
      nodes: [
        {
          id: "webhook",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            path: "incoming-data",
            httpMethod: "POST",
          },
        },
        {
          id: "supabase",
          name: "Insert to Supabase",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [500, 300],
          parameters: {
            resource: "row",
            operation: "create",
            tableId: "",
          },
        },
      ],
      connections: {
        Webhook: {
          main: [
            [{ node: "Insert to Supabase", type: "main", index: 0 }],
          ],
        },
      },
    },
  },
  {
    id: "scheduled-report",
    name: "Scheduled Daily Report",
    description:
      "Run a daily schedule, fetch data from an API, and send a summary email",
    category: "reporting",
    workflow: {
      nodes: [
        {
          id: "schedule",
          name: "Daily Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [{ field: "cronExpression", expression: "0 9 * * *" }],
            },
          },
        },
        {
          id: "http",
          name: "Fetch Data",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4,
          position: [500, 300],
          parameters: {
            method: "GET",
            url: "",
          },
        },
        {
          id: "email",
          name: "Send Report",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            fromEmail: "",
            toEmail: "",
            subject: "Daily Report",
            text: '={{$json["data"]}}',
          },
        },
      ],
      connections: {
        "Daily Schedule": {
          main: [[{ node: "Fetch Data", type: "main", index: 0 }]],
        },
        "Fetch Data": {
          main: [[{ node: "Send Report", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "lead-capture",
    name: "Lead Capture to Sheets and Slack",
    description:
      "Receive form data via webhook, save the lead to Google Sheets, and post a Slack notification",
    category: "leads",
    workflow: {
      nodes: [
        {
          id: "lead-webhook",
          name: "Lead Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            path: "lead-capture",
            httpMethod: "POST",
          },
        },
        {
          id: "lead-sheets",
          name: "Save to Google Sheets",
          type: "n8n-nodes-base.googleSheets",
          typeVersion: 4,
          position: [500, 300],
          parameters: {
            resource: "sheet",
            operation: "appendOrUpdate",
            documentId: "",
            sheetName: "Leads",
            columns: {
              mappingMode: "autoMapInputData",
            },
          },
        },
        {
          id: "lead-slack",
          name: "Notify Slack",
          type: "n8n-nodes-base.slack",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            resource: "message",
            operation: "post",
            channel: "",
            text: '=New lead: {{$json["name"]}} ({{$json["email"]}})',
          },
        },
      ],
      connections: {
        "Lead Webhook": {
          main: [[{ node: "Save to Google Sheets", type: "main", index: 0 }]],
        },
        "Save to Google Sheets": {
          main: [[{ node: "Notify Slack", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "daily-slack-standup",
    name: "Daily Slack Standup Summary",
    description:
      "Trigger at 9 AM, fetch team data from an API, and post a standup summary to Slack",
    category: "communication",
    workflow: {
      nodes: [
        {
          id: "standup-schedule",
          name: "9 AM Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [{ field: "cronExpression", expression: "0 9 * * 1-5" }],
            },
          },
        },
        {
          id: "standup-http",
          name: "Fetch Team Data",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4,
          position: [500, 300],
          parameters: {
            method: "GET",
            url: "",
          },
        },
        {
          id: "standup-slack",
          name: "Post Standup to Slack",
          type: "n8n-nodes-base.slack",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            resource: "message",
            operation: "post",
            channel: "",
            text: '=Good morning! Here is your daily summary:\n{{$json["summary"]}}',
          },
        },
      ],
      connections: {
        "9 AM Schedule": {
          main: [[{ node: "Fetch Team Data", type: "main", index: 0 }]],
        },
        "Fetch Team Data": {
          main: [[{ node: "Post Standup to Slack", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "stripe-payment-alert",
    name: "Stripe Payment Alert via Telegram",
    description:
      "Receive a Stripe webhook event and send a Telegram message when a payment exceeds a threshold",
    category: "payments",
    workflow: {
      nodes: [
        {
          id: "stripe-webhook",
          name: "Stripe Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            path: "stripe-events",
            httpMethod: "POST",
          },
        },
        {
          id: "stripe-if",
          name: "Payment Above Threshold",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [500, 300],
          parameters: {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
              conditions: [
                {
                  leftValue: '={{$json["data"]["object"]["amount"]}}',
                  rightValue: 10000,
                  operator: { type: "number", operation: "gte" },
                },
              ],
              combinator: "and",
            },
          },
        },
        {
          id: "stripe-telegram",
          name: "Send Telegram Alert",
          type: "n8n-nodes-base.telegram",
          typeVersion: 1,
          position: [750, 300],
          parameters: {
            resource: "message",
            operation: "sendMessage",
            chatId: "",
            text: '=Payment received: ${{= ($json["data"]["object"]["amount"] / 100).toFixed(2) }} from {{$json["data"]["object"]["billing_details"]["email"]}}',
          },
        },
      ],
      connections: {
        "Stripe Webhook": {
          main: [[{ node: "Payment Above Threshold", type: "main", index: 0 }]],
        },
        "Payment Above Threshold": {
          main: [[{ node: "Send Telegram Alert", type: "main", index: 0 }], []],
        },
      },
    },
  },
  {
    id: "rss-to-email",
    name: "RSS Feed to Email Digest",
    description:
      "Fetch an RSS feed on a schedule and send a digest email with the latest articles",
    category: "content",
    workflow: {
      nodes: [
        {
          id: "rss-schedule",
          name: "RSS Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [{ field: "cronExpression", expression: "0 8 * * *" }],
            },
          },
        },
        {
          id: "rss-http",
          name: "Fetch RSS Feed",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4,
          position: [500, 300],
          parameters: {
            method: "GET",
            url: "",
            options: {
              response: { response: { responseFormat: "text" } },
            },
          },
        },
        {
          id: "rss-email",
          name: "Send Digest Email",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            fromEmail: "",
            toEmail: "",
            subject: "Your Daily RSS Digest",
            text: '={{$json["data"]}}',
          },
        },
      ],
      connections: {
        "RSS Schedule": {
          main: [[{ node: "Fetch RSS Feed", type: "main", index: 0 }]],
        },
        "Fetch RSS Feed": {
          main: [[{ node: "Send Digest Email", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "form-to-supabase",
    name: "Form Submission to Supabase",
    description:
      "Receive a form submission via webhook, clean the fields, and insert the record into Supabase",
    category: "data",
    workflow: {
      nodes: [
        {
          id: "form-webhook",
          name: "Form Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            path: "form-submission",
            httpMethod: "POST",
          },
        },
        {
          id: "form-edit-fields",
          name: "Clean Form Data",
          type: "n8n-nodes-base.set",
          typeVersion: 3,
          position: [500, 300],
          parameters: {
            mode: "manual",
            duplicateItem: false,
            assignments: {
              assignments: [
                {
                  id: "field-name",
                  name: "name",
                  value: '={{$json["name"].trim()}}',
                  type: "string",
                },
                {
                  id: "field-email",
                  name: "email",
                  value: '={{$json["email"].toLowerCase().trim()}}',
                  type: "string",
                },
                {
                  id: "field-message",
                  name: "message",
                  value: '={{$json["message"]}}',
                  type: "string",
                },
              ],
            },
          },
        },
        {
          id: "form-supabase",
          name: "Insert to Supabase",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [750, 300],
          parameters: {
            resource: "row",
            operation: "create",
            tableId: "",
          },
        },
      ],
      connections: {
        "Form Webhook": {
          main: [[{ node: "Clean Form Data", type: "main", index: 0 }]],
        },
        "Clean Form Data": {
          main: [[{ node: "Insert to Supabase", type: "main", index: 0 }]],
        },
      },
    },
  },
  {
    id: "error-monitor",
    name: "Health Check Error Monitor",
    description:
      "Poll a health endpoint every 5 minutes and send a Slack alert when the status is not 200",
    category: "monitoring",
    workflow: {
      nodes: [
        {
          id: "monitor-schedule",
          name: "Every 5 Minutes",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [{ field: "minutes", minutesInterval: 5 }],
            },
          },
        },
        {
          id: "monitor-http",
          name: "Health Check Request",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4,
          position: [500, 300],
          parameters: {
            method: "GET",
            url: "",
            options: {
              response: { response: { fullResponse: true } },
            },
          },
        },
        {
          id: "monitor-if",
          name: "Check Status Code",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            conditions: {
              options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
              conditions: [
                {
                  leftValue: '={{$json["statusCode"]}}',
                  rightValue: 200,
                  operator: { type: "number", operation: "notEquals" },
                },
              ],
              combinator: "and",
            },
          },
        },
        {
          id: "monitor-slack",
          name: "Send Error Alert",
          type: "n8n-nodes-base.slack",
          typeVersion: 2,
          position: [1000, 300],
          parameters: {
            resource: "message",
            operation: "post",
            channel: "",
            text: '=Health check FAILED. Status: {{$json["statusCode"]}} at {{$now}}',
          },
        },
      ],
      connections: {
        "Every 5 Minutes": {
          main: [[{ node: "Health Check Request", type: "main", index: 0 }]],
        },
        "Health Check Request": {
          main: [[{ node: "Check Status Code", type: "main", index: 0 }]],
        },
        "Check Status Code": {
          main: [[{ node: "Send Error Alert", type: "main", index: 0 }], []],
        },
      },
    },
  },
  {
    id: "new-user-onboarding",
    name: "New User Onboarding",
    description:
      "Receive a signup webhook, insert the user into Supabase, and send a welcome email",
    category: "onboarding",
    workflow: {
      nodes: [
        {
          id: "onboard-webhook",
          name: "Signup Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [250, 300],
          parameters: {
            path: "new-user",
            httpMethod: "POST",
          },
        },
        {
          id: "onboard-supabase",
          name: "Insert User to Supabase",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [500, 300],
          parameters: {
            resource: "row",
            operation: "create",
            tableId: "users",
          },
        },
        {
          id: "onboard-email",
          name: "Send Welcome Email",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2,
          position: [750, 300],
          parameters: {
            fromEmail: "",
            toEmail: '={{$json["email"]}}',
            subject: "Welcome aboard!",
            text: "=Hi {{$json[\"name\"]}},\n\nWelcome! We're thrilled to have you.",
          },
        },
      ],
      connections: {
        "Signup Webhook": {
          main: [[{ node: "Insert User to Supabase", type: "main", index: 0 }]],
        },
        "Insert User to Supabase": {
          main: [[{ node: "Send Welcome Email", type: "main", index: 0 }]],
        },
      },
    },
  },
];
