/**
 * Performance Analysis Handler
 *
 * Handles performance anti-pattern detection
 */

import { MCPTool } from "../../decorators/index.js";
import { PerformanceAnalyzer } from "../../services/performance-analyzer.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type {
  PerformancePattern,
  PerformanceCategory,
} from "../../types/performance.js";

export class PerformanceAnalysisHandler {
  private performanceAnalyzer: PerformanceAnalyzer;

  constructor(private projectRoot: string) {
    this.performanceAnalyzer = new PerformanceAnalyzer(projectRoot);
  }

  /**
   * Analyze files for performance issues
   */
  @MCPTool({
    name: "performance-analyze",
    description:
      "Analyze files for performance anti-patterns (N+1 queries, missing cleanup, blocking operations, resource leaks)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to analyze for performance issues",
        },
      },
      required: ["files"],
    },
  })
  async handleAnalyzePerformance(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    try {
      const result = await this.performanceAnalyzer.analyzeFiles(args.files);

      if (!result.hasIssues) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **No Performance Issues Detected**\n\n**Files analyzed:** ${args.files.length}\n\n**Patterns checked:**\n- Database N+1 queries\n- Missing React cleanup functions\n- Blocking operations in async code\n- Resource leaks\n- Inefficient array operations\n\nAll files passed performance analysis.`,
            },
          ],
        };
      }

      // Build report
      const sections = [];

      // Summary
      sections.push(
        `## Performance Analysis Results\n\n**Files analyzed:** ${args.files.length}\n**Issues found:** ${result.issues.length}\n- 🚨 Critical: ${result.criticalCount}\n- ⚠️  Warnings: ${result.warningCount}\n- ℹ️  Info: ${result.infoCount}`
      );

      // Issues by category
      const categoriesWithIssues = Object.entries(
        result.issuesByCategory
      ).filter(([, issues]) => issues.length > 0);

      if (categoriesWithIssues.length > 0) {
        sections.push(`\n## Issues by Category`);

        for (const [category, issues] of categoriesWithIssues) {
          const categoryIcon = this.getCategoryIcon(
            category as keyof typeof result.issuesByCategory
          );
          sections.push(
            `\n### ${categoryIcon} ${this.formatCategoryName(category)} (${issues.length})`
          );

          for (const issue of issues.slice(0, 5)) {
            const severityIcon = this.getSeverityIcon(issue.severity);
            sections.push(
              `\n${severityIcon} **${issue.file}:${issue.line}** - ${issue.pattern}\n   ${issue.description}\n   Code: \`${issue.code}\`\n   💡 ${issue.suggestion}`
            );
          }

          if (issues.length > 5) {
            sections.push(`\n   ... and ${issues.length - 5} more`);
          }
        }
      }

      // Top issues
      const criticalIssues = result.issues.filter(
        (i) => i.severity === "error"
      );
      if (criticalIssues.length > 0) {
        sections.push(
          `\n## 🚨 Critical Issues Requiring Immediate Attention\n\n${criticalIssues
            .slice(0, 3)
            .map(
              (issue) =>
                `**${issue.file}:${issue.line}**\n- Pattern: ${issue.pattern}\n- ${issue.description}\n- 💡 ${issue.suggestion}`
            )
            .join("\n\n")}`
        );
      }

      return {
        content: [
          {
            type: "text",
            text: sections.join("\n"),
          },
        ],
        isError: result.criticalCount > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * List all performance patterns
   */
  @MCPTool({
    name: "performance-list-patterns",
    description: "List all performance analysis patterns (built-in and custom)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleListPatterns(): Promise<MCPToolResult> {
    try {
      const patterns = this.performanceAnalyzer.getPatterns();

      const byCategory: Record<string, PerformancePattern[]> = {};
      for (const pattern of patterns) {
        if (!byCategory[pattern.category]) {
          byCategory[pattern.category] = [];
        }
        byCategory[pattern.category].push(pattern);
      }

      const sections = [];
      sections.push(
        `## Performance Analysis Patterns\n\n**Total patterns:** ${patterns.length}`
      );

      for (const [category, categoryPatterns] of Object.entries(byCategory)) {
        const icon = this.getCategoryIcon(category);
        sections.push(
          `\n### ${icon} ${this.formatCategoryName(category)} (${categoryPatterns.length})`
        );

        for (const pattern of categoryPatterns) {
          const severityIcon = this.getSeverityIcon(pattern.severity);
          sections.push(
            `\n${severityIcon} **${pattern.name}**\n   ${pattern.description}\n   💡 ${pattern.suggestion}`
          );
        }
      }

      sections.push(
        `\n## Custom Patterns\n\nUse \`performance-add-pattern\` to add project-specific patterns.`
      );

      return {
        content: [
          {
            type: "text",
            text: sections.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list patterns: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Add custom pattern
   */
  @MCPTool({
    name: "performance-add-pattern",
    description: "Add a custom performance anti-pattern to detect",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Unique pattern name",
        },
        category: {
          type: "string",
          enum: [
            "database",
            "async",
            "memory",
            "rendering",
            "computation",
            "io",
            "resource-leak",
          ],
          description: "Pattern category",
        },
        description: {
          type: "string",
          description: "What this pattern detects",
        },
        regex: {
          type: "string",
          description: "Regex pattern to match (JavaScript regex syntax)",
        },
        contextRegex: {
          type: "string",
          description:
            "Optional regex for surrounding context that must also match",
        },
        severity: {
          type: "string",
          enum: ["info", "warning", "error"],
          description: "How critical is this pattern",
        },
        suggestion: {
          type: "string",
          description: "How to fix this issue",
        },
        filePatterns: {
          type: "array",
          items: { type: "string" },
          description:
            "Glob patterns for files to check (e.g., ['**/*.ts', '**/*.tsx'])",
        },
      },
      required: [
        "name",
        "category",
        "description",
        "regex",
        "severity",
        "suggestion",
      ],
    },
  })
  async handleAddPattern(args: {
    name: string;
    category: PerformanceCategory;
    description: string;
    regex: string;
    contextRegex?: string;
    severity: "info" | "warning" | "error";
    suggestion: string;
    filePatterns?: string[];
  }): Promise<MCPToolResult> {
    try {
      const pattern: PerformancePattern = {
        name: args.name,
        category: args.category,
        description: args.description,
        regex: args.regex,
        contextRegex: args.contextRegex,
        severity: args.severity,
        suggestion: args.suggestion,
        filePatterns: args.filePatterns,
      };

      await this.performanceAnalyzer.addCustomPattern(pattern);

      return {
        content: [
          {
            type: "text",
            text: `✅ **Custom Pattern Added**\n\n**Name:** ${pattern.name}\n**Category:** ${pattern.category}\n**Severity:** ${pattern.severity}\n**Description:** ${pattern.description}\n\nThe pattern will now be checked during performance analysis.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to add pattern: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Disable a pattern
   */
  @MCPTool({
    name: "performance-disable-pattern",
    description: "Disable a performance pattern (stops checking for it)",
    inputSchema: {
      type: "object",
      properties: {
        patternName: {
          type: "string",
          description: "Name of the pattern to disable",
        },
      },
      required: ["patternName"],
    },
  })
  async handleDisablePattern(args: {
    patternName: string;
  }): Promise<MCPToolResult> {
    try {
      await this.performanceAnalyzer.disablePattern(args.patternName);

      return {
        content: [
          {
            type: "text",
            text: `✅ **Pattern Disabled**\n\n**Pattern:** ${args.patternName}\n\nThis pattern will no longer be checked during analysis.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to disable pattern: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Enable a pattern
   */
  @MCPTool({
    name: "performance-enable-pattern",
    description: "Re-enable a previously disabled performance pattern",
    inputSchema: {
      type: "object",
      properties: {
        patternName: {
          type: "string",
          description: "Name of the pattern to enable",
        },
      },
      required: ["patternName"],
    },
  })
  async handleEnablePattern(args: {
    patternName: string;
  }): Promise<MCPToolResult> {
    try {
      await this.performanceAnalyzer.enablePattern(args.patternName);

      return {
        content: [
          {
            type: "text",
            text: `✅ **Pattern Enabled**\n\n**Pattern:** ${args.patternName}\n\nThis pattern will now be checked during analysis.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to enable pattern: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(category: PerformanceCategory | string): string {
    const icons: Record<string, string> = {
      database: "🗄️",
      async: "⚡",
      memory: "💾",
      rendering: "🎨",
      computation: "⚙️",
      io: "📁",
      "resource-leak": "💧",
    };
    return icons[category] || "•";
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "•";
    }
  }

  /**
   * Format category name
   */
  private formatCategoryName(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
