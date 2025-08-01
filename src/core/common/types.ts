/**
 * Common type definitions used across the Cortex AI system
 */

/**
 * Role interface representing an AI collaboration role
 */
export interface Role {
  name: string;
  description: string;
  keywords: string[];
  capabilities: string[];
  discoveryKeywords?: string[];
}

/**
 * Project knowledge interface for storing project-specific information
 */
export interface ProjectKnowledge {
  patterns: string[];
  conventions: string[];
  preferences: string[];
  codingPatterns?: any[];
  architecture?: any[];
}

/**
 * MCP Workflow interface
 */
export interface MCPWorkflow {
  executeTool(_toolName: string, _params: Record<string, any>): Promise<any>;
  registerTool?(
    _toolName: string,
    _handler: (_params: Record<string, any>) => Promise<any>,
  ): void;
  getAvailableTools?(): string[];
}

/**
 * Thinking Step interface
 */
export interface ThinkingStep {
  id: string;
  name: string;
  content: string;
  status: "pending" | "completed" | "skipped";
}

/**
 * Message Processor type
 */
export type MessageProcessor = (
  _message: string,
  _context?: Record<string, any>,
) => Promise<string>;

/**
 * CortexMCPWorkflow alias for backward compatibility
 */
export type CortexMCPWorkflow = MCPWorkflow;
