/**
 * MCP Modules Index - Exports all modular components
 *
 * This module provides a centralized export point for all MCP modules
 */

// Core modules
export { ToolManager, ToolManagerConfig } from "./tool-manager.js";
export { SessionManager, SessionManagerConfig } from "./session-manager.js";
export { ConfigManager, ConfigSchema } from "./config-manager.js";
export {
  PerformanceMonitor,
  PerformanceMonitorConfig,
} from "./performance-monitor.js";

// Dependency injection
export {
  DIContainer,
  ServiceDefinition,
  ServiceInstance,
  Service,
  Inject,
  MCPServiceFactory,
  ServiceLocator,
} from "../dependency-injection.js";

// Types
export * from "../types.js";

// Enhanced server
export {
  EnhancedCortexMCPServer,
  createEnhancedCortexMCPServer,
} from "../enhanced-server.js";
