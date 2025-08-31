/**
 * MCP Types - Common types used in the MCP system
 */

/**
 * LLM Request interface
 */
export interface LLMRequest {
  query: string;
  context?: Record<string, unknown>;
  projectId?: string;
}

/**
 * LLM Response interface
 */
export interface LLMResponse {
  content: string;
  context?: Record<string, unknown>;
  diagnostic?: Record<string, unknown>;
  experiences?: Experience[];
}

/**
 * Experience interface
 */
export interface Experience {
  userInput: string;
  response: string;
  timestamp: string;
  tags?: string[];
  category?: string;
  relevance?: number;
}

/**
 * Context Enhancement Options
 */
export interface ContextEnhancementOptions {
  maxExperiences?: number;
  timeFilter?: number; // days
  semanticFilter?: boolean;
  categoryFilter?: string[];
  minRelevance?: number;
}
