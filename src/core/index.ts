/**
 * Export all core modules
 */

// Experience modules
export * from "./experience/cortex-feedback.js";
export * from "./experience/experience-editor.js";
export * from "./experience/preference-collector.js";

// Common types - explicitly export to avoid conflicts
export {
  type ProjectKnowledge,
  type MCPWorkflow,
  type ThinkingStep,
  type MessageProcessor,
  type CortexMCPWorkflow,
  type Role as BaseRole, // Rename the common Role to avoid conflict
} from "./common/types.js";

// MCP modules
export { MCPWorkflow as MCPWorkflowInterface } from "./mcp/mcp-workflow.js";
export { MCPProtocolServer } from "./mcp/mcp-protocol-server.js";
export * from "./mcp/mcp-context-tools.js";

// Project modules
export * from "./project/project-analyzer.js";
// Explicitly export from role-manager and rename its Role to avoid conflict
export {
  RoleManager,
  type Role as ManagedRole,
  type RoleMapping,
  type RoleAssignmentResult,
  type RoleExecutionResult,
} from "./project/role-manager.js";
