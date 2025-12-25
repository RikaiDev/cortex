/**
 * Metadata keys and types for MCP tool decorators
 */

export const TOOL_METADATA_KEY = Symbol("mcp:tool");
export const PARAM_METADATA_KEY = Symbol("mcp:param");

export interface ToolMetadata {
  name: string;
  description: string;
  category?: string;
  inputSchema?: unknown; // Optional manual schema definition
}

export interface ParamMetadata {
  index: number;
  name: string;
  description: string;
  type?: unknown;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  items?: unknown;
}
