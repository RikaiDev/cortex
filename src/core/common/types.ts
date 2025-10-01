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
 * Tool execution result with type-safe data handling
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Specific result types for different tools
 */
export interface ExperienceRecorderResult {
  recorded: boolean;
}

export interface ConfigResult {
  [key: string]: unknown;
}

/**
 * Union type for all possible tool results
 */
export type ToolResultData =
  | ExperienceRecorderResult
  | ConfigResult
  | string
  | number
  | boolean
  | null;

/**
 * Generic tool result for backward compatibility
 */
export type AnyToolResult = ToolResult<ToolResultData>;

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
