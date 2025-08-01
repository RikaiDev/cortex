/**
 * Cortex Core Module Exports
 *
 * This module exports all the core functionality of the Cortex AI system.
 */

// Common types
export * from "./common/types.js";

// MCP modules
export { MCPWorkflow } from "./mcp/mcp-workflow.js";
export { MCPProtocolServer } from "./mcp/mcp-protocol-server.js";
export * from "./mcp/mcp-thinking-tools.js";

// Thinking modules
export * from "./thinking/prompt-injection.js";
export { createThinkingProcess } from "./thinking/thinking-process.js";
export * from "./thinking/thought-interceptor.js";
export { createCoTEmulation } from "./thinking/cot-emulation.js";

// Experience modules
export * from "./experience/cortex-feedback.js";
export * from "./experience/experience-editor.js";

// Project modules
export * from "./project/project-analyzer.js";
export {
  RoleManager,
  Role,
  RoleMapping,
  RoleAssignmentResult,
  RoleExecutionResult,
} from "./project/role-manager.js";
