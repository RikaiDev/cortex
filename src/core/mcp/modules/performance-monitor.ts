/**
 * Performance Monitor - Monitors MCP server performance and metrics
 *
 * This module collects, analyzes, and reports performance metrics
 */

import { Logger } from "../types.js";

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

export interface PerformanceMonitorConfig {
  collectionInterval?: number;
  enableDetailedMetrics?: boolean;
  enableMemoryTracking?: boolean;
  enableCPUTracking?: boolean;
  metricsRetention?: number;
}

export class PerformanceMonitor {
  private metrics!: PerformanceMetrics;
  private logger: Logger;
  private config: PerformanceMonitorConfig;
  private collectionTimer?: NodeJS.Timeout;
  private startTime: Date;
  private requestTimes: number[] = [];
  private errorCount = 0;
  private requestCount = 0;

  constructor(logger: Logger, config: PerformanceMonitorConfig = {}) {
    this.logger = logger;
    this.config = {
      collectionInterval: 10000, // 10 seconds
      enableDetailedMetrics: true,
      enableMemoryTracking: true,
      enableCPUTracking: true,
      metricsRetention: 3600000, // 1 hour
      ...config,
    };

    this.startTime = new Date();
    this.initializeMetrics();
    this.startCollection();
  }

  /**
   * Record a request
   */
  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.requestTimes.push(responseTime);

    // Keep only recent request times for average calculation
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-500);
    }
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Record tool execution
   */
  recordToolExecution(
    toolName: string,
    executionTime: number,
    success: boolean
  ): void {
    const tools = this.metrics.tools;

    // Update execution count
    const currentCount = tools.executionCount.get(toolName) || 0;
    tools.executionCount.set(toolName, currentCount + 1);

    // Update average execution time
    const currentAvg = tools.averageExecutionTime.get(toolName) || 0;
    const newAvg = (currentAvg + executionTime) / 2;
    tools.averageExecutionTime.set(toolName, newAvg);

    // Update error rate
    if (!success) {
      const currentErrors = tools.errorRate.get(toolName) || 0;
      tools.errorRate.set(toolName, currentErrors + 1);
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(toolName: string): void {
    const currentHits = this.metrics.tools.cacheHitRate.get(toolName) || 0;
    this.metrics.tools.cacheHitRate.set(toolName, currentHits + 1);
  }

  /**
   * Update session metrics
   */
  updateSessionMetrics(
    activeSessions: number,
    totalSessions: number,
    averageDuration: number
  ): void {
    this.metrics.sessions.activeSessions = activeSessions;
    this.metrics.sessions.totalSessions = totalSessions;
    this.metrics.sessions.averageSessionDuration = averageDuration;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateServerMetrics();
    return this.cloneMetrics();
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    uptime: string;
    requestsPerSecond: number;
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: string;
    topTools: Array<{ name: string; count: number; avgTime: number }>;
  } {
    this.updateServerMetrics();

    const uptime = Date.now() - this.startTime.getTime();
    const requestsPerSecond = this.requestCount / (uptime / 1000);
    const errorRate =
      this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const averageResponseTime =
      this.requestTimes.length > 0
        ? this.requestTimes.reduce((sum, time) => sum + time, 0) /
          this.requestTimes.length
        : 0;

    // Get top 5 tools by execution count
    const topTools = Array.from(this.metrics.tools.executionCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        avgTime: this.metrics.tools.averageExecutionTime.get(name) || 0,
      }));

    return {
      uptime: this.formatDuration(uptime),
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      memoryUsage: this.formatBytes(this.metrics.server.memoryUsage),
      topTools,
    };
  }

  /**
   * Export metrics in different formats
   */
  exportMetrics(format: "json" | "prometheus" | "summary"): string {
    switch (format) {
      case "json":
        return JSON.stringify(this.getMetrics(), null, 2);

      case "prometheus":
        return this.exportPrometheusMetrics();

      case "summary":
        return this.exportSummaryMetrics();

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): void {
    this.metrics = {
      server: {
        uptime: 0,
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
      tools: {
        executionCount: new Map(),
        averageExecutionTime: new Map(),
        errorRate: new Map(),
        cacheHitRate: new Map(),
      },
      sessions: {
        activeSessions: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
      },
    };
  }

  /**
   * Update server metrics
   */
  private updateServerMetrics(): void {
    this.metrics.server.uptime = Date.now() - this.startTime.getTime();
    this.metrics.server.requestCount = this.requestCount;
    this.metrics.server.errorCount = this.errorCount;
    this.metrics.server.averageResponseTime =
      this.requestTimes.length > 0
        ? this.requestTimes.reduce((sum, time) => sum + time, 0) /
          this.requestTimes.length
        : 0;

    if (this.config.enableMemoryTracking) {
      this.metrics.server.memoryUsage = process.memoryUsage().heapUsed;
    }

    if (this.config.enableCPUTracking) {
      this.metrics.server.cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds
    }
  }

  /**
   * Start metrics collection
   */
  private startCollection(): void {
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);

    this.logger.info("Performance monitoring started");
  }

  /**
   * Collect and log metrics
   */
  private collectMetrics(): void {
    this.updateServerMetrics();

    if (this.config.enableDetailedMetrics) {
      this.logger.debug("Performance metrics collected", {
        uptime: this.formatDuration(this.metrics.server.uptime),
        requests: this.metrics.server.requestCount,
        errors: this.metrics.server.errorCount,
        avgResponseTime: `${this.metrics.server.averageResponseTime}ms`,
        memoryUsage: this.formatBytes(this.metrics.server.memoryUsage),
      });
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  private exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Server metrics
    lines.push(
      `# HELP cortex_mcp_server_uptime_seconds Server uptime in seconds`
    );
    lines.push(`# TYPE cortex_mcp_server_uptime_seconds counter`);
    lines.push(
      `cortex_mcp_server_uptime_seconds ${this.metrics.server.uptime / 1000}`
    );

    lines.push(
      `# HELP cortex_mcp_server_requests_total Total number of requests`
    );
    lines.push(`# TYPE cortex_mcp_server_requests_total counter`);
    lines.push(
      `cortex_mcp_server_requests_total ${this.metrics.server.requestCount}`
    );

    lines.push(`# HELP cortex_mcp_server_errors_total Total number of errors`);
    lines.push(`# TYPE cortex_mcp_server_errors_total counter`);
    lines.push(
      `cortex_mcp_server_errors_total ${this.metrics.server.errorCount}`
    );

    lines.push(
      `# HELP cortex_mcp_server_response_time_seconds Average response time in seconds`
    );
    lines.push(`# TYPE cortex_mcp_server_response_time_seconds gauge`);
    lines.push(
      `cortex_mcp_server_response_time_seconds ${this.metrics.server.averageResponseTime / 1000}`
    );

    // Tool metrics
    for (const [toolName, count] of this.metrics.tools.executionCount) {
      lines.push(
        `# HELP cortex_mcp_tool_executions_total Total tool executions`
      );
      lines.push(`# TYPE cortex_mcp_tool_executions_total counter`);
      lines.push(
        `cortex_mcp_tool_executions_total{tool="${toolName}"} ${count}`
      );
    }

    return lines.join("\n");
  }

  /**
   * Export metrics summary
   */
  private exportSummaryMetrics(): string {
    const summary = this.getMetricsSummary();

    return `
Cortex MCP Server Performance Summary
=====================================

Server Status:
  Uptime: ${summary.uptime}
  Requests/sec: ${summary.requestsPerSecond}
  Error Rate: ${summary.errorRate}%
  Avg Response Time: ${summary.averageResponseTime}ms
  Memory Usage: ${summary.memoryUsage}

Top Tools:
${summary.topTools
  .map(
    (tool) => `  ${tool.name}: ${tool.count} executions, ${tool.avgTime}ms avg`
  )
  .join("\n")}

Active Sessions: ${this.metrics.sessions.activeSessions}
Total Sessions: ${this.metrics.sessions.totalSessions}
`.trim();
  }

  /**
   * Clone metrics to prevent external modification
   */
  private cloneMetrics(): PerformanceMetrics {
    return {
      server: { ...this.metrics.server },
      tools: {
        executionCount: new Map(this.metrics.tools.executionCount),
        averageExecutionTime: new Map(this.metrics.tools.averageExecutionTime),
        errorRate: new Map(this.metrics.tools.errorRate),
        cacheHitRate: new Map(this.metrics.tools.cacheHitRate),
      },
      sessions: { ...this.metrics.sessions },
    };
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Format bytes in human-readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }
    this.logger.info("Performance monitor destroyed");
  }
}
