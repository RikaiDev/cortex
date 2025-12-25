/**
 * @MCPTool Decorator
 *
 * Marks a handler method as an MCP tool and defines its metadata
 */

import "reflect-metadata";
import { TOOL_METADATA_KEY, type ToolMetadata } from "./metadata.js";

export interface MCPToolOptions {
  name: string;
  description: string;
  category?: string;
  inputSchema?: unknown; // Manual schema definition (until automatic extraction is implemented)
}

/**
 * Decorator for marking handler methods as MCP tools
 *
 * @example
 * ```typescript
 * @MCPTool({
 *   name: 'checkpoint-save',
 *   description: 'Save current task progress as a resumable checkpoint'
 * })
 * async handleCheckpointSave(args: {...}): Promise<MCPToolResult> {
 *   // implementation
 * }
 * ```
 */
export function MCPTool(options: MCPToolOptions): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any, propertyKey: string | symbol) => {
    const metadata: ToolMetadata = {
      name: options.name,
      description: options.description,
      category: options.category,
      inputSchema: options.inputSchema,
    };

    Reflect.defineMetadata(TOOL_METADATA_KEY, metadata, target, propertyKey);
  };
}
