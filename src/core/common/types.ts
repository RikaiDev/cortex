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
 * Core system role configuration based on Linus Torvalds' philosophy
 */
export const LINUS_TORVALDS_ROLE: Role = {
  name: "Linus Torvalds",
  description:
    "Creator and chief architect of the Linux kernel, 30 years of kernel maintenance experience, reviewed millions of lines of code. Focuses on pragmatism, pursues code quality and system stability.",
  keywords: [
    "pragmatism",
    "code quality",
    "system architecture",
    "backward compatibility",
    "simplicity",
    "Linux",
    "kernel",
    "open source",
  ],
  capabilities: [
    "code quality review",
    "system architecture design",
    "complexity analysis",
    "backward compatibility assurance",
    "pragmatic decision making",
    "root cause problem analysis",
  ],
  discoveryKeywords: [
    "code quality",
    "architecture design",
    "performance issues",
    "complexity",
    "backward compatibility",
    "pragmatism",
    "simplicity",
    "kernel thinking",
  ],
};

/**
 * Core philosophy constants derived from Linus Torvalds
 */
export const LINUS_PHILOSOPHY = {
  GOOD_TASTE: "Good Taste - Making complex problems simple",
  NEVER_BREAK_USERSPACE:
    "Never break userspace - Backward compatibility is iron law",
  PRACTICALITY: "Pragmatism above all, theory serves practice",
  SIMPLICITY: "If you exceed 3 levels of indentation, redesign",
  DATA_STRUCTURES:
    "Bad programmers worry about the code. Good programmers worry about data structures",
} as const;

/**
 * Project knowledge interface for storing project-specific information
 */
export interface ProjectKnowledge {
  patterns: string[];
  conventions: string[];
  preferences: string[];
  codingPatterns?: CodingPattern[];
  architecture?: ArchitecturePattern[];
}

/**
 * Coding pattern interface
 */
export interface CodingPattern {
  name: string;
  description: string;
  examples: string[];
  category:
    | "error-handling"
    | "async-patterns"
    | "component-structure"
    | "other";
}

/**
 * Architecture pattern interface
 */
export interface ArchitecturePattern {
  name: string;
  type: "component" | "service" | "data-flow" | "state-management";
  description: string;
  technologies: string[];
}

/**
 * Tool execution parameters
 */
export interface ToolParameters {
  [key: string]: string | number | boolean | null | ToolParameters;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * MCP Workflow interface
 */
export interface MCPWorkflow {
  executeTool(toolName: string, params: ToolParameters): Promise<ToolResult>;
  registerTool?(
    toolName: string,
    handler: (params: ToolParameters) => Promise<ToolResult>
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
  timestamp: Date;
}

/**
 * Message Processor type
 */
export type MessageProcessor = (
  message: string,
  context?: Record<string, unknown>
) => Promise<string>;

/**
 * CortexMCPWorkflow alias for backward compatibility
 */
export type CortexMCPWorkflow = MCPWorkflow;
