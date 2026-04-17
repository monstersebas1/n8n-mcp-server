import { describe, it, expect } from "vitest";
import {
  nodeCatalog,
  findNodesByIntent,
  getNodeByType,
  getTriggerNodes,
} from "../../src/lib/node-catalog.js";

describe("nodeCatalog integrity", () => {
  it("has no duplicate node types", () => {
    const types = nodeCatalog.map((n) => n.type);
    const unique = new Set(types);

    expect(unique.size).toBe(types.length);
  });

  it("every node has at least one commonConfig", () => {
    for (const node of nodeCatalog) {
      expect(
        Object.keys(node.commonConfigs).length,
        `${node.type} has no commonConfigs`
      ).toBeGreaterThan(0);
    }
  });

  it("every node has a non-empty displayName", () => {
    for (const node of nodeCatalog) {
      expect(node.displayName.trim().length, `${node.type} missing displayName`).toBeGreaterThan(0);
    }
  });

  it("every node has a non-empty description", () => {
    for (const node of nodeCatalog) {
      expect(node.description.trim().length, `${node.type} missing description`).toBeGreaterThan(0);
    }
  });

  it("every node has a typeVersion of at least 1", () => {
    for (const node of nodeCatalog) {
      expect(node.typeVersion, `${node.type} has invalid typeVersion`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getTriggerNodes", () => {
  it("returns only nodes with category trigger", () => {
    const triggers = getTriggerNodes();

    expect(triggers.length).toBeGreaterThan(0);
    for (const node of triggers) {
      expect(node.category).toBe("trigger");
    }
  });

  it("includes the webhook trigger", () => {
    const triggers = getTriggerNodes();
    const types = triggers.map((n) => n.type);

    expect(types).toContain("n8n-nodes-base.webhook");
  });

  it("includes the schedule trigger", () => {
    const triggers = getTriggerNodes();
    const types = triggers.map((n) => n.type);

    expect(types).toContain("n8n-nodes-base.scheduleTrigger");
  });

  it("does not include non-trigger nodes", () => {
    const triggers = getTriggerNodes();
    const types = triggers.map((n) => n.type);

    expect(types).not.toContain("n8n-nodes-base.slack");
    expect(types).not.toContain("n8n-nodes-base.httpRequest");
  });
});

describe("getNodeByType", () => {
  it("returns the node matching an exact type string", () => {
    const node = getNodeByType("n8n-nodes-base.slack");

    expect(node).toBeDefined();
    expect(node!.type).toBe("n8n-nodes-base.slack");
  });

  it("returns the node for a langchain-namespaced type", () => {
    const node = getNodeByType("@n8n/n8n-nodes-langchain.openAi");

    expect(node).toBeDefined();
    expect(node!.displayName).toBe("OpenAI");
  });

  it("returns undefined for a type that does not exist", () => {
    const node = getNodeByType("n8n-nodes-base.doesNotExist");

    expect(node).toBeUndefined();
  });

  it("is case-sensitive and returns undefined for wrong casing", () => {
    const node = getNodeByType("n8n-nodes-base.SLACK");

    expect(node).toBeUndefined();
  });
});

describe("findNodesByIntent", () => {
  it("returns relevant nodes for the search term slack", () => {
    const results = findNodesByIntent("slack");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe("n8n-nodes-base.slack");
  });

  it("returns relevant nodes for the search term email", () => {
    const results = findNodesByIntent("email");

    expect(results.length).toBeGreaterThan(0);
    const types = results.map((n) => n.type);
    expect(
      types.some((t) => t.includes("email") || t.includes("Email"))
    ).toBe(true);
  });

  it("returns relevant nodes for the search term database", () => {
    const results = findNodesByIntent("database");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("database");
  });

  it("returns relevant nodes for the search term schedule", () => {
    const results = findNodesByIntent("schedule");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe("n8n-nodes-base.scheduleTrigger");
  });

  it("returns relevant nodes for the search term http", () => {
    const results = findNodesByIntent("http");

    expect(results.length).toBeGreaterThan(0);
    const types = results.map((n) => n.type);
    expect(types).toContain("n8n-nodes-base.httpRequest");
  });

  it("returns relevant nodes for the search term webhook", () => {
    const results = findNodesByIntent("webhook");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("ranks higher-scoring nodes before lower-scoring nodes", () => {
    // "slack" should score higher on the Slack node than on any other node
    const results = findNodesByIntent("slack");

    expect(results[0].type).toBe("n8n-nodes-base.slack");
  });

  it("returns an empty array for a term that matches nothing", () => {
    const results = findNodesByIntent("xyzzy_nonexistent_term_12345");

    expect(results).toEqual([]);
  });

  it("is case-insensitive for the search term", () => {
    const lower = findNodesByIntent("slack");
    const upper = findNodesByIntent("SLACK");

    expect(lower.map((n) => n.type)).toEqual(upper.map((n) => n.type));
  });
});
