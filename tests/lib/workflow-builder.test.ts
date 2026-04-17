import { describe, it, expect } from "vitest";
import {
  suggestWorkflow,
  buildWorkflow,
  type WorkflowPlan,
} from "../../src/lib/workflow-builder.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFromDescription(description: string) {
  const plan = suggestWorkflow(description);
  return { plan, workflow: buildWorkflow(plan) };
}

// ---------------------------------------------------------------------------
// suggestWorkflow — trigger detection
// ---------------------------------------------------------------------------

describe("suggestWorkflow — trigger detection", () => {
  it("detects a schedule trigger from 'every day'", () => {
    const plan = suggestWorkflow("every day send a report");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.scheduleTrigger");
  });

  it("detects a schedule trigger from 'daily'", () => {
    const plan = suggestWorkflow("daily sync my contacts");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.scheduleTrigger");
  });

  it("detects a schedule trigger from 'hourly'", () => {
    const plan = suggestWorkflow("hourly check for new orders");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.scheduleTrigger");
  });

  it("detects a webhook trigger from 'webhook'", () => {
    const plan = suggestWorkflow("when a webhook arrives save to supabase");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.webhook");
  });

  it("detects a webhook trigger from 'http request comes'", () => {
    const plan = suggestWorkflow("when an http request comes in process the data");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.webhook");
  });

  it("detects an email trigger from 'new email'", () => {
    const plan = suggestWorkflow("when a new email arrives forward it to slack");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.emailReadImap");
  });

  it("detects an email trigger from 'email arrives'", () => {
    const plan = suggestWorkflow("when email arrives send a slack notification");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.emailReadImap");
  });

  it("detects a manual trigger from 'manual'", () => {
    const plan = suggestWorkflow("manual test of this workflow");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.manualTrigger");
  });

  it("falls back to webhook trigger when no trigger pattern matches", () => {
    const plan = suggestWorkflow("send a slack message");

    expect(plan.steps[0].nodeType).toBe("n8n-nodes-base.webhook");
  });
});

// ---------------------------------------------------------------------------
// suggestWorkflow — action detection
// ---------------------------------------------------------------------------

describe("suggestWorkflow — action detection", () => {
  it("detects send slack action", () => {
    const plan = suggestWorkflow("daily send slack message to the team");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.slack");
  });

  it("detects send email action", () => {
    const plan = suggestWorkflow("webhook comes in send email notification");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.emailSend");
  });

  it("detects save to supabase action", () => {
    const plan = suggestWorkflow("webhook arrives save to supabase table");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.supabase");
  });

  it("detects save to google sheets action", () => {
    const plan = suggestWorkflow("daily save to google sheets");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.googleSheets");
  });

  it("detects http request action", () => {
    const plan = suggestWorkflow("every hour fetch data from api and store it");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.httpRequest");
  });

  it("detects openai action", () => {
    const plan = suggestWorkflow("webhook arrives then openai generate a summary");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("@n8n/n8n-nodes-langchain.openAi");
  });

  it("detects filter action", () => {
    const plan = suggestWorkflow("webhook arrives then filter items by status");
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.filter");
  });

  it("detects multiple actions from a rich description", () => {
    const plan = suggestWorkflow(
      "every day fetch data from api then filter and send slack message"
    );
    const types = plan.steps.map((s) => s.nodeType);

    expect(types).toContain("n8n-nodes-base.httpRequest");
    expect(types).toContain("n8n-nodes-base.filter");
    expect(types).toContain("n8n-nodes-base.slack");
  });

  it("actions appear in the order they occur in the description", () => {
    const plan = suggestWorkflow(
      "every day fetch data from api then save to google sheets then send slack message"
    );
    // steps[0] is trigger, then actions follow in text order
    const actionTypes = plan.steps.slice(1).map((s) => s.nodeType);
    const httpIndex = actionTypes.indexOf("n8n-nodes-base.httpRequest");
    const sheetsIndex = actionTypes.indexOf("n8n-nodes-base.googleSheets");
    const slackIndex = actionTypes.indexOf("n8n-nodes-base.slack");

    expect(httpIndex).toBeLessThan(sheetsIndex);
    expect(sheetsIndex).toBeLessThan(slackIndex);
  });
});

// ---------------------------------------------------------------------------
// suggestWorkflow — fallback for empty/nonsense input
// ---------------------------------------------------------------------------

describe("suggestWorkflow — fallback behavior", () => {
  it("produces at least two steps for an empty description", () => {
    const plan = suggestWorkflow("");

    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
  });

  it("produces at least two steps for a nonsense description", () => {
    const plan = suggestWorkflow("xyzzy frobble blarg");

    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
  });

  it("injects a code fallback node when no actions are found", () => {
    // "manual" matches the manual trigger; "test" alone won't match any action
    const plan = suggestWorkflow("manual trigger only");
    const types = plan.steps.map((s) => s.nodeType);

    // Should have exactly 2 steps: trigger + fallback code node
    expect(plan.steps.length).toBe(2);
    expect(types[1]).toBe("n8n-nodes-base.code");
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — node structure
// ---------------------------------------------------------------------------

describe("buildWorkflow — node structure", () => {
  it("produces a nodes array with one node per resolvable step", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook", config: "postEndpoint" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack", config: "sendMessage" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.nodes.length).toBe(2);
  });

  it("assigns unique ids to every node", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
        { intent: "send email", nodeType: "n8n-nodes-base.emailSend" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const ids = workflow.nodes.map((n) => n.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sets node type from the blueprint", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook", config: "postEndpoint" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.nodes[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("merges customParameters into node parameters", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        {
          intent: "webhook trigger",
          nodeType: "n8n-nodes-base.webhook",
          config: "postEndpoint",
          customParameters: { path: "my-custom-path" },
        },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.nodes[0].parameters.path).toBe("my-custom-path");
  });

  it("skips steps that cannot be resolved and logs them in explanation", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "totally unknown node xyz", nodeType: "n8n-nodes-base.doesNotExist" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.nodes.length).toBe(2);
    expect(workflow.explanation.some((e) => e.includes("Skipped"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — unique node names
// ---------------------------------------------------------------------------

describe("buildWorkflow — unique node names", () => {
  it("generates unique names when the same node type appears twice", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "http get", nodeType: "n8n-nodes-base.httpRequest", config: "getRequest" },
        { intent: "http post", nodeType: "n8n-nodes-base.httpRequest", config: "postJson" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const names = workflow.nodes.map((n) => n.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("generates unique names when the same node type appears three times", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "http 1", nodeType: "n8n-nodes-base.httpRequest", config: "getRequest" },
        { intent: "http 2", nodeType: "n8n-nodes-base.httpRequest", config: "postJson" },
        { intent: "http 3", nodeType: "n8n-nodes-base.httpRequest", config: "withAuth" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const names = workflow.nodes.map((n) => n.name);

    expect(new Set(names).size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — connections
// ---------------------------------------------------------------------------

describe("buildWorkflow — connections", () => {
  it("wires nodes sequentially: node 0 connects to node 1", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const node0Name = workflow.nodes[0].name;
    const node1Name = workflow.nodes[1].name;

    expect(workflow.connections[node0Name]).toBeDefined();
    expect(workflow.connections[node0Name]["main"][0][0].node).toBe(node1Name);
  });

  it("wires three nodes as a chain: 0->1->2", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "filter", nodeType: "n8n-nodes-base.filter" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const [n0, n1, n2] = workflow.nodes.map((n) => n.name);

    expect(workflow.connections[n0]["main"][0][0].node).toBe(n1);
    expect(workflow.connections[n1]["main"][0][0].node).toBe(n2);
  });

  it("first node has no incoming connection entry", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const lastName = workflow.nodes[workflow.nodes.length - 1].name;

    // Last node should not be a key in connections (nothing connects from it)
    expect(workflow.connections[lastName]).toBeUndefined();
  });

  it("connection type is main", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const node0Name = workflow.nodes[0].name;
    const connection = workflow.connections[node0Name]["main"][0][0];

    expect(connection.type).toBe("main");
    expect(connection.index).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — positions
// ---------------------------------------------------------------------------

describe("buildWorkflow — positions", () => {
  it("each successive node is positioned further to the right", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "filter", nodeType: "n8n-nodes-base.filter" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);

    for (let i = 1; i < workflow.nodes.length; i++) {
      expect(workflow.nodes[i].position[0]).toBeGreaterThan(
        workflow.nodes[i - 1].position[0]
      );
    }
  });

  it("all nodes share the same Y position", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
        { intent: "send email", nodeType: "n8n-nodes-base.emailSend" },
      ],
    };

    const workflow = buildWorkflow(plan);
    const yValues = workflow.nodes.map((n) => n.position[1]);

    expect(new Set(yValues).size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — explanation
// ---------------------------------------------------------------------------

describe("buildWorkflow — explanation", () => {
  it("produces one explanation entry per successfully built node", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);

    // 2 nodes = 2 step explanations (no trigger warning here)
    expect(workflow.explanation.length).toBe(2);
  });

  it("prepends a note when the first node is not a trigger", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.explanation[0]).toMatch(/not a trigger/i);
  });

  it("does not prepend trigger warning when first node is a trigger", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
        { intent: "send slack", nodeType: "n8n-nodes-base.slack" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.explanation[0]).not.toMatch(/not a trigger/i);
  });
});

// ---------------------------------------------------------------------------
// buildWorkflow — settings
// ---------------------------------------------------------------------------

describe("buildWorkflow — settings", () => {
  it("includes executionOrder v1 in settings", () => {
    const plan: WorkflowPlan = {
      name: "Test",
      description: "test",
      steps: [
        { intent: "webhook trigger", nodeType: "n8n-nodes-base.webhook" },
      ],
    };

    const workflow = buildWorkflow(plan);

    expect(workflow.settings.executionOrder).toBe("v1");
  });
});

// ---------------------------------------------------------------------------
// suggestWorkflow — workflow name generation
// ---------------------------------------------------------------------------

describe("suggestWorkflow — workflow name", () => {
  it("generates a name from the description words", () => {
    const plan = suggestWorkflow("every day send a slack notification");

    expect(plan.name.length).toBeGreaterThan(0);
  });

  it("capitalizes the first letter of each word in the name", () => {
    const plan = suggestWorkflow("send slack message every day");
    const words = plan.name.split(" ");

    for (const word of words) {
      if (word.length > 0) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    }
  });

  it("stores the original description unchanged", () => {
    const description = "every day fetch data from api";
    const plan = suggestWorkflow(description);

    expect(plan.description).toBe(description);
  });
});
