import { describe, it, expect, beforeEach } from "vitest";
import "reflect-metadata";
import { MCPToolRegistry } from "../../../../src/core/mcp/registry/tool-registry.js";
import { MCPTool } from "../../../../src/core/mcp/decorators/mcp-tool.js";

// Test handler class with decorated methods
class TestHandler {
  @MCPTool({
    name: "test-tool",
    description: "A test tool for unit testing",
  })
  async handleTestTool(args: { message: string }): Promise<{ content: { type: string; text: string }[] }> {
    return {
      content: [{ type: "text", text: `Received: ${args.message}` }],
    };
  }

  @MCPTool({
    name: "another-tool",
    description: "Another test tool",
  })
  async handleAnotherTool(): Promise<{ content: { type: string; text: string }[] }> {
    return {
      content: [{ type: "text", text: "Another tool executed" }],
    };
  }

  // Method without decorator - should not be registered
  async undecorated(): Promise<void> {
    // Not a tool
  }
}

describe("MCPToolRegistry", () => {
  let registry: MCPToolRegistry;

  beforeEach(() => {
    registry = new MCPToolRegistry();
  });

  describe("constructor", () => {
    it("should create empty registry", () => {
      expect(registry).toBeInstanceOf(MCPToolRegistry);
      expect(registry.getToolDefinitions()).toHaveLength(0);
    });
  });

  describe("registerHandler", () => {
    it("should register decorated methods as tools", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const tools = registry.getToolDefinitions();
      expect(tools.length).toBe(2);
    });

    it("should not register undecorated methods", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const tools = registry.getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("test-tool");
      expect(toolNames).toContain("another-tool");
      expect(toolNames).not.toContain("undecorated");
    });

    it("should extract tool metadata correctly", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const tools = registry.getToolDefinitions();
      const testTool = tools.find((t) => t.name === "test-tool");

      expect(testTool).toBeDefined();
      expect(testTool?.description).toBe("A test tool for unit testing");
    });
  });

  describe("hasTool", () => {
    it("should return true for registered tools", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      expect(registry.hasTool("test-tool")).toBe(true);
      expect(registry.hasTool("another-tool")).toBe(true);
    });

    it("should return false for unregistered tools", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      expect(registry.hasTool("nonexistent-tool")).toBe(false);
      expect(registry.hasTool("undecorated")).toBe(false);
    });
  });

  describe("executeTool", () => {
    it("should execute registered tool and return result", async () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const result = await registry.executeTool("test-tool", {
        message: "Hello",
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toBe("Received: Hello");
    });

    it("should return error for unregistered tool", async () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const result = await registry.executeTool("nonexistent-tool", {});

      // Registry returns error response instead of throwing
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Tool not found");
    });
  });

  describe("getToolDefinitions", () => {
    it("should return all registered tools", () => {
      const handler = new TestHandler();
      registry.registerHandler(handler);

      const tools = registry.getToolDefinitions();

      expect(tools).toHaveLength(2);
      expect(tools[0]).toHaveProperty("name");
      expect(tools[0]).toHaveProperty("description");
      expect(tools[0]).toHaveProperty("inputSchema");
    });

    it("should return empty array for empty registry", () => {
      const tools = registry.getToolDefinitions();
      expect(tools).toEqual([]);
    });
  });

  describe("multiple handlers", () => {
    it("should register tools from multiple handlers", () => {
      class Handler1 {
        @MCPTool({ name: "tool-1", description: "Tool 1" })
        async handle1(): Promise<{ content: { type: string; text: string }[] }> {
          return { content: [{ type: "text", text: "1" }] };
        }
      }

      class Handler2 {
        @MCPTool({ name: "tool-2", description: "Tool 2" })
        async handle2(): Promise<{ content: { type: string; text: string }[] }> {
          return { content: [{ type: "text", text: "2" }] };
        }
      }

      registry.registerHandler(new Handler1());
      registry.registerHandler(new Handler2());

      const tools = registry.getToolDefinitions();
      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toContain("tool-1");
      expect(tools.map((t) => t.name)).toContain("tool-2");
    });
  });
});
