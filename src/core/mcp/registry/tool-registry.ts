/**
 * MCP Tool Registry
 *
 * Central registry for discovering and managing MCP tools defined via decorators
 */

import "reflect-metadata";
import {
  TOOL_METADATA_KEY,
  PARAM_METADATA_KEY,
  type ToolMetadata,
  type ParamMetadata,
} from "../decorators/metadata.js";
import type { MCPToolResult } from "../types/mcp-types.js";

/**
 * JSON Schema type definitions
 */
interface JSONSchemaProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  items?: unknown;
  default?: unknown;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

interface JSONSchema {
  type: string;
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

/**
 * MCP Tool Definition (as returned by ListTools)
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

/**
 * Internal tool registration
 */
interface ToolRegistration {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: unknown;
  methodName: string;
}

/**
 * MCP Tool Registry
 *
 * Discovers decorated methods in handler classes and auto-generates tool schemas
 */
export class MCPToolRegistry {
  private tools = new Map<string, ToolRegistration>();

  /**
   * Register a handler instance
   *
   * Scans the handler for @MCPTool decorated methods and registers them
   */
  registerHandler(handler: object): void {
    const prototype = Object.getPrototypeOf(handler);
    const methodNames = Object.getOwnPropertyNames(prototype);

    for (const methodName of methodNames) {
      // Skip constructor and non-methods
      if (
        methodName === "constructor" ||
        typeof prototype[methodName] !== "function"
      ) {
        continue;
      }

      // Check if method has @MCPTool metadata
      const toolMetadata: ToolMetadata | undefined = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        prototype,
        methodName
      );

      if (!toolMetadata) {
        continue;
      }

      // Use manual schema if provided, otherwise generate from method signature
      const inputSchema = toolMetadata.inputSchema
        ? (toolMetadata.inputSchema as JSONSchema)
        : this.generateSchema(prototype, methodName);

      // Register tool
      this.tools.set(toolMetadata.name, {
        name: toolMetadata.name,
        description: toolMetadata.description,
        inputSchema,
        handler,
        methodName,
      });
    }
  }

  /**
   * Get all registered tool definitions (for ListTools handler)
   */
  getToolDefinitions(): MCPToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Execute a tool by name (for CallTool handler)
   */
  async executeTool(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any
  ): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: `Tool not found: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (tool.handler as any)[tool.methodName](args);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get count of registered tools
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Generate JSON Schema from method signature
   *
   * For now, this returns a basic object schema. The handler methods
   * use TypeScript types which provide compile-time safety.
   * Future enhancement: Use TypeScript compiler API to extract detailed schema
   */
  private generateSchema(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    methodName: string
  ): JSONSchema {
    // Get parameter metadata if any
    const paramMetadata: ParamMetadata[] | undefined = Reflect.getMetadata(
      PARAM_METADATA_KEY,
      target,
      methodName
    );

    // Basic schema structure
    // For now, all handlers accept an args object
    const schema: JSONSchema = {
      type: "object",
      properties: {},
      required: [],
    };

    // If we have parameter metadata, use it
    if (paramMetadata && paramMetadata.length > 0) {
      for (const param of paramMetadata) {
        const property: JSONSchemaProperty = {
          type: this.inferType(param.type),
          description: param.description,
        };

        if (param.enum) {
          property.enum = param.enum;
        }
        if (param.items) {
          property.items = param.items;
        }
        if (param.default !== undefined) {
          property.default = param.default;
        }

        schema.properties[param.name] = property;

        if (param.required !== false) {
          schema.required?.push(param.name);
        }
      }
    }

    // Clean up empty required array
    if (schema.required?.length === 0) {
      delete schema.required;
    }

    return schema;
  }

  /**
   * Infer JSON Schema type from TypeScript type
   */
  private inferType(type: unknown): string {
    if (!type) return "object";

    if (type === String) return "string";
    if (type === Number) return "number";
    if (type === Boolean) return "boolean";
    if (type === Array) return "array";
    if (type === Object) return "object";

    return "object";
  }
}
