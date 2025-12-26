/**
 * CI Pipeline Handler
 *
 * Handles CI/CD build and pipeline awareness operations
 */

import { MCPTool } from "../../decorators/index.js";
import { CIPipelineService } from "../../services/ci-pipeline-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

/**
 * MCP handler for CI/CD pipeline awareness tools.
 *
 * Provides tools to check build status, analyze test failures,
 * view build history, and validate changes against CI failure patterns.
 */
export class CIPipelineHandler {
  private ciService: CIPipelineService;

  /**
   * @param projectRoot - Root directory of the project to analyze
   */
  constructor(private projectRoot: string) {
    this.ciService = new CIPipelineService(projectRoot);
  }

  /**
   * Get current CI status
   */
  @MCPTool({
    name: "ci-status",
    description:
      "Get current CI/CD build status from GitHub Actions (workflow runs, success rate, failures)",
    inputSchema: {
      type: "object",
      properties: {
        branch: {
          type: "string",
          description: "Branch to check (default: current branch)",
        },
        limit: {
          type: "number",
          description: "Number of recent runs to analyze (default: 10)",
        },
      },
    },
  })
  async handleGetStatus(args: {
    branch?: string;
    limit?: number;
  }): Promise<MCPToolResult> {
    try {
      const status = await this.ciService.getStatus(args);

      const sections: string[] = [];

      // Header
      sections.push(`## CI/CD Status: ${status.repository}`);
      sections.push(`\n**Branch:** ${status.branch}`);

      // Overall status with emoji
      const statusEmoji = this.getStatusEmoji(status.overallStatus);
      sections.push(
        `**Overall Status:** ${statusEmoji} ${status.overallStatus.toUpperCase()}`
      );

      // Metrics
      sections.push(`\n### Metrics`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Success Rate | ${status.successRate}% |`);
      sections.push(
        `| Avg Duration | ${this.formatDuration(status.avgDuration)} |`
      );
      sections.push(`| Recent Runs | ${status.recentRuns.length} |`);

      // Failing workflows
      if (status.failingWorkflows.length > 0) {
        sections.push(`\n### Failing Workflows`);
        for (const workflow of status.failingWorkflows) {
          sections.push(`- ${workflow}`);
        }
      }

      // Pending workflows
      if (status.pendingWorkflows.length > 0) {
        sections.push(`\n### Pending Workflows`);
        for (const workflow of status.pendingWorkflows) {
          sections.push(`- ${workflow}`);
        }
      }

      // Last run details
      if (status.lastRun) {
        const run = status.lastRun;
        const runEmoji = this.getStatusEmoji(
          run.conclusion === "success" ? "success" : "failure"
        );
        sections.push(`\n### Last Run`);
        sections.push(`**${run.name}** ${runEmoji}`);
        sections.push(`- Commit: \`${run.commit.substring(0, 7)}\` - ${run.commitMessage}`);
        sections.push(`- Author: ${run.author}`);
        sections.push(`- Started: ${new Date(run.startedAt).toLocaleString()}`);
        if (run.duration) {
          sections.push(`- Duration: ${this.formatDuration(run.duration)}`);
        }
        sections.push(`- [View on GitHub](${run.url})`);
      }

      // Recent runs summary
      if (status.recentRuns.length > 1) {
        sections.push(`\n### Recent Runs`);
        for (const run of status.recentRuns.slice(0, 5)) {
          const emoji = this.getStatusEmoji(
            run.conclusion === "success" ? "success" : "failure"
          );
          sections.push(
            `${emoji} **${run.name}** - ${run.commit.substring(0, 7)} (${run.author})`
          );
        }
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: status.overallStatus === "failure",
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get CI status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get failing tests
   */
  @MCPTool({
    name: "ci-failures",
    description:
      "Show failing tests from recent CI runs (test names, error messages, stack traces)",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of failed runs to analyze (default: 5)",
        },
      },
    },
  })
  async handleGetFailures(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const failures = await this.ciService.getFailures(args);

      const sections: string[] = [];

      sections.push(`## CI Test Failures`);

      if (failures.length === 0) {
        sections.push(`\n All tests passing! No failures found in recent runs.`);
        return {
          content: [{ type: "text", text: sections.join("\n") }],
        };
      }

      sections.push(`\n**Found ${failures.length} failing test(s)**`);

      // Group by test file
      const byFile = new Map<string, typeof failures>();
      for (const failure of failures) {
        if (!byFile.has(failure.testFile)) {
          byFile.set(failure.testFile, []);
        }
        byFile.get(failure.testFile)!.push(failure);
      }

      for (const [file, fileFailures] of byFile) {
        sections.push(`\n### ${file}`);

        for (const failure of fileFailures) {
          sections.push(`\n**Test:** ${failure.testName}`);
          sections.push(`- Job: ${failure.jobName}`);
          sections.push(`- Run ID: ${failure.workflowRunId}`);

          if (failure.errorMessage) {
            sections.push(`\n**Error:**`);
            sections.push("```");
            sections.push(failure.errorMessage.slice(0, 500));
            sections.push("```");
          }

          if (failure.stackTrace) {
            sections.push(`\n**Stack Trace (truncated):**`);
            sections.push("```");
            sections.push(failure.stackTrace.slice(0, 300));
            if (failure.stackTrace.length > 300) {
              sections.push("...");
            }
            sections.push("```");
          }
        }
      }

      // Suggestions
      sections.push(`\n### Next Steps`);
      sections.push(`1. Run failing tests locally: \`npm test -- --grep "${failures[0]?.testName || "failing"}"\``);
      sections.push(`2. Check test file: \`${failures[0]?.testFile || "unknown"}\``);
      sections.push(`3. Review recent changes to affected files`);

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: failures.length > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get CI failures: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get build history for files
   */
  @MCPTool({
    name: "ci-history",
    description:
      "Get build history for specific files (shows which builds touched these files and their outcomes)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to check history for (empty for all recent builds)",
        },
        limit: {
          type: "number",
          description: "Number of builds to check (default: 20)",
        },
      },
    },
  })
  async handleGetHistory(args: {
    files?: string[];
    limit?: number;
  }): Promise<MCPToolResult> {
    try {
      const files = args.files || [];
      const history = await this.ciService.getHistory(files, args);

      const sections: string[] = [];

      sections.push(`## CI Build History`);

      if (files.length > 0) {
        sections.push(`\n**Files:** ${files.join(", ")}`);
      }

      if (history.length === 0) {
        sections.push(`\nNo build history found for the specified files.`);
        return {
          content: [{ type: "text", text: sections.join("\n") }],
        };
      }

      sections.push(`\n**Found ${history.length} relevant build(s)**`);

      // Summary statistics
      const successCount = history.filter((h) => h.conclusion === "success").length;
      const failureCount = history.filter((h) => h.conclusion === "failure").length;
      const successRate = Math.round((successCount / history.length) * 100);

      sections.push(`\n### Summary`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Total Builds | ${history.length} |`);
      sections.push(`| Successful | ${successCount} |`);
      sections.push(`| Failed | ${failureCount} |`);
      sections.push(`| Success Rate | ${successRate}% |`);

      // Build list
      sections.push(`\n### Build History`);
      sections.push(`| Status | Workflow | Commit | Author | Time |`);
      sections.push(`|--------|----------|--------|--------|------|`);

      for (const build of history.slice(0, 15)) {
        const emoji = this.getStatusEmoji(
          build.conclusion === "success" ? "success" : "failure"
        );
        const time = new Date(build.timestamp).toLocaleDateString();
        const message = build.commitMessage.slice(0, 30) + (build.commitMessage.length > 30 ? "..." : "");
        sections.push(
          `| ${emoji} | ${build.workflowName} | \`${build.commit}\` ${message} | ${build.author} | ${time} |`
        );
      }

      if (history.length > 15) {
        sections.push(`\n*Showing 15 of ${history.length} builds*`);
      }

      // Failure patterns
      if (failureCount > 0) {
        sections.push(`\n### Recent Failures`);
        const failures = history.filter((h) => h.conclusion === "failure").slice(0, 5);
        for (const failure of failures) {
          sections.push(
            `- **${failure.workflowName}** - ${failure.commit} (${failure.author})`
          );
        }
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get CI history: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Validate changes against CI history
   */
  @MCPTool({
    name: "ci-validate",
    description:
      "Pre-validate changes against CI history (identifies risky changes based on past failures)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files you plan to modify",
        },
      },
      required: ["files"],
    },
  })
  async handleValidateChanges(args: { files: string[] }): Promise<MCPToolResult> {
    try {
      const result = await this.ciService.validateChanges(args.files);

      const sections: string[] = [];

      // Header with risk level
      const riskEmoji = this.getRiskEmoji(result.riskLevel);
      sections.push(`## CI Change Validation`);
      sections.push(`\n**Risk Level:** ${riskEmoji} ${result.riskLevel.toUpperCase()}`);
      sections.push(`**Files:** ${args.files.length}`);

      // Validation result
      if (result.isValid) {
        sections.push(`\n Low risk changes - proceed with caution`);
      } else {
        sections.push(`\n High risk detected - review carefully before pushing`);
      }

      // Warnings
      if (result.warnings.length > 0) {
        sections.push(`\n### Warnings`);
        for (const warning of result.warnings) {
          sections.push(`- ${warning}`);
        }
      }

      // Related failures
      if (result.relatedFailures.length > 0) {
        sections.push(`\n### Related CI Failures`);
        sections.push(
          `These files have caused failures in the past:`
        );

        for (const failure of result.relatedFailures.slice(0, 5)) {
          sections.push(
            `- **${failure.workflowName}** - ${failure.commit} (${new Date(failure.timestamp).toLocaleDateString()})`
          );
          sections.push(`  "${failure.commitMessage.slice(0, 60)}..."`);
        }
      }

      // Affected workflows
      if (result.affectedWorkflows.length > 0) {
        sections.push(`\n### Affected Workflows`);
        sections.push(
          `These workflows may be impacted by your changes:`
        );
        for (const workflow of result.affectedWorkflows) {
          sections.push(`- ${workflow}`);
        }
      }

      // Suggestions
      if (result.suggestions.length > 0) {
        sections.push(`\n### Suggestions`);
        for (const suggestion of result.suggestions) {
          sections.push(`- ${suggestion}`);
        }
      }

      // Summary
      sections.push(`\n### Summary`);
      if (result.riskLevel === "low") {
        sections.push(
          `No significant CI risks detected. You can proceed with confidence.`
        );
      } else if (result.riskLevel === "medium") {
        sections.push(
          `Some CI risks detected. Consider running tests locally before pushing.`
        );
      } else {
        sections.push(
          `High CI risk detected. Strongly recommend running full test suite locally.`
        );
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: !result.isValid,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to validate changes: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case "success":
        return "✅";
      case "failure":
        return "❌";
      case "pending":
        return "⏳";
      case "cancelled":
        return "⚪";
      case "skipped":
        return "⏭️";
      default:
        return "❓";
    }
  }

  /**
   * Get risk emoji
   */
  private getRiskEmoji(risk: string): string {
    switch (risk) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🔴";
      default:
        return "⚪";
    }
  }

  /**
   * Format duration in seconds to human readable
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}
