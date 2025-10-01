/**
 * MCP Types - Common type definitions for MCP modules
 *
 * This module contains shared interfaces and types used across MCP components
 */

// Logger interface
export interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

// Tool-related types
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (
    args: unknown,
    context: ToolExecutionContext
  ) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  executionTime?: number;
  timestamp?: string;
}

export interface ToolExecutionContext {
  sessionId?: string;
  userId?: string;
  projectRoot?: string;
  metadata?: Record<string, unknown>;
}

// Error types
export enum ErrorType {
  TOOL_EXECUTION_ERROR = "tool_execution_error",
  CONFIGURATION_ERROR = "configuration_error",
  NETWORK_ERROR = "network_error",
  RESOURCE_ERROR = "resource_error",
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  AUTHORIZATION_ERROR = "authorization_error",
  TIMEOUT_ERROR = "timeout_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
}

export interface MCPError extends Error {
  type: ErrorType;
  code?: string;
  context?: Record<string, unknown>;
  recoverable?: boolean;
}

export interface ErrorContext {
  sessionId?: string;
  toolName?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorResult {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
  errorType: ErrorType;
  recoverable: boolean;
  context?: ErrorContext;
}

// Configuration types
export interface MCPServerConfig {
  projectRoot?: string;
  logLevel?: "debug" | "info" | "warn" | "error";
  enableDebugMode?: boolean;
  maxExecutionTime?: number;
  timeout?: number;
  port?: number;
  maxConnections?: number;
  enableMetrics?: boolean;
}

// Session types
export interface Session {
  id: string;
  clientId: string;
  startTime: Date;
  lastActivity: Date;
  state: SessionState;
  metadata: Record<string, unknown>;
}

export interface SessionState {
  currentWorkflow?: string;
  activeTools: string[];
  userPreferences: Record<string, unknown>;
  context: Record<string, unknown>;
}

// Performance types
export interface PerformanceMetrics {
  server: {
    uptime: number;
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  tools: {
    executionCount: Map<string, number>;
    averageExecutionTime: Map<string, number>;
    errorRate: Map<string, number>;
    cacheHitRate: Map<string, number>;
  };
  sessions: {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
}

// Workflow types
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  toolName: string;
  inputSchema: Record<string, unknown>;
  dependencies: string[];
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
}

// Cache types
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  enablePersistence?: boolean;
  persistencePath?: string;
}

// Event types
export interface MCPEvent {
  type: string;
  timestamp: Date;
  data: Record<string, unknown>;
  sessionId?: string;
}

export interface EventListener {
  (event: MCPEvent): void | Promise<void>;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Rate limiting types
export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  windowSize: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Security types
export interface SecurityConfig {
  enableSandbox: boolean;
  allowedOrigins: string[];
  rateLimiting: RateLimitConfig;
  authentication?: AuthenticationConfig;
}

export interface AuthenticationConfig {
  enabled: boolean;
  method: "token" | "oauth" | "api-key";
  config: Record<string, unknown>;
}

// Health check types
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  duration?: number;
}

// Metrics export types
export type MetricsFormat = "json" | "prometheus" | "summary";

// Module initialization types
export interface ModuleConfig {
  enabled: boolean;
  config: Record<string, unknown>;
  dependencies: string[];
}

export interface ModuleStatus {
  name: string;
  initialized: boolean;
  healthy: boolean;
  lastError?: string;
  uptime: number;
}
