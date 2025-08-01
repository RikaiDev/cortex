#!/usr/bin/env node

/**
 * MCP Protocol Server
 *
 * This module implements the standard MCP protocol for integration with Cursor.
 * Based on official MCP specification: https://modelcontextprotocol.io/
 */

import { MCPWorkflow } from "./mcp-workflow.js";
import { createCoTEmulation } from "../thinking/cot-emulation.js";
import { createMCPThinkingTools } from "./mcp-thinking-tools.js";

/**
 * MCP Protocol Server
 */
export class MCPProtocolServer {
  private mcpWorkflow: MCPWorkflow;
  private cotEmulation: ReturnType<typeof createCoTEmulation>;
  private isInitialized: boolean = false;
  private protocolVersion: string = "2025-06-18";

  constructor(projectRoot: string) {
    this.mcpWorkflow = new MCPWorkflow(projectRoot);
    this.cotEmulation = createCoTEmulation(this.mcpWorkflow, {
      enableAutoThinking: true,
      enhancePrompts: true,
      debugMode: false,
    });
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.cotEmulation.initialize();
    createMCPThinkingTools(this.mcpWorkflow);
    this.isInitialized = true;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): any[] {
    const tools = this.mcpWorkflow.getAvailableTools();
    return tools.map((tool) => ({
      name: tool,
      title: `${tool.charAt(0).toUpperCase() + tool.slice(1).replace(/-/g, " ")}`,
      description: `Execute ${tool} tool`,
      inputSchema: {
        type: "object",
        properties: {
          params: {
            type: "object",
            description: "Tool parameters",
          },
        },
      },
    }));
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    arguments_: Record<string, any>,
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.mcpWorkflow.executeTool(toolName, arguments_);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool ${toolName}: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    await this.initialize();

    // Handle stdin for JSON-RPC requests
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", async (data) => {
      try {
        const lines = data.toString().trim().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            const request = JSON.parse(line);
            await this.handleRequest(request);
          }
        }
      } catch (error) {
        console.error("Error parsing request:", error);
      }
    });

    console.error(
      "MCP Server started with tools:",
      this.getAvailableTools().map((t) => t.name),
    );
  }

  /**
   * Handle JSON-RPC request
   */
  private async handleRequest(request: any): Promise<void> {
    const { id, method, params } = request;

    try {
      let result;
      switch (method) {
        case "initialize":
          result = {
            protocolVersion: this.protocolVersion,
            capabilities: {
              tools: {
                listChanged: true,
              },
            },
            serverInfo: {
              name: "cortex-mcp-server",
              version: "0.6.1",
            },
          };
          break;

        case "tools/list":
          result = {
            tools: this.getAvailableTools(),
          };
          break;

        case "tools/call": {
          // Extract params from arguments structure if available
          const toolParams = params.arguments?.params || params.arguments || {};
          console.error(
            `Executing tool ${params.name} with params:`,
            JSON.stringify(toolParams),
          );
          result = await this.executeTool(params.name, toolParams);
          break;
        }

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      this.sendMessage({
        jsonrpc: "2.0",
        id,
        result,
      });
    } catch (error) {
      this.sendMessage({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: String(error),
        },
      });
    }
  }

  /**
   * Send a message to stdout
   */
  private sendMessage(message: any): void {
    console.log(JSON.stringify(message));
  }
}

/**
 * Create MCP protocol server
 */
export function createMCPProtocolServer(
  projectRoot: string,
): MCPProtocolServer {
  return new MCPProtocolServer(projectRoot);
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createMCPProtocolServer(process.cwd());
  server.start().catch(console.error);
}
