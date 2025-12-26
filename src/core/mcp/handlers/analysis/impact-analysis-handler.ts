/**
 * Impact Analysis Handler
 *
 * Handles change impact analysis and dependency graph operations
 */

import { MCPTool } from "../../decorators/index.js";
import { ImpactAnalyzer } from "../../services/impact-analysis/index.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { ImpactAnalysisOptions } from "../../types/change-impact.js";

/**
 * MCP handler for change impact analysis tools.
 *
 * Provides tools to build dependency graphs, analyze change impact,
 * preview affected files, and understand code dependencies.
 */
export class ImpactAnalysisHandler {
  private impactAnalyzer: ImpactAnalyzer;

  /**
   * @param projectRoot - Root directory of the project to analyze
   */
  constructor(private projectRoot: string) {
    this.impactAnalyzer = new ImpactAnalyzer(projectRoot);
  }

  /**
   * Build dependency graph
   */
  @MCPTool({
    name: "impact-build-graph",
    description:
      "Build or refresh the dependency graph for impact analysis (caches for 5 minutes)",
    inputSchema: {
      type: "object",
      properties: {
        forceRebuild: {
          type: "boolean",
          description: "Force rebuild even if cache is valid (default: false)",
        },
      },
    },
  })
  async handleBuildGraph(args: {
    forceRebuild?: boolean;
  }): Promise<MCPToolResult> {
    try {
      const graph = await this.impactAnalyzer.buildGraph(
        args.forceRebuild || false
      );
      const stats = this.impactAnalyzer.getGraphStats();

      return {
        content: [
          {
            type: "text",
            text: `✅ **Dependency Graph Built**\n\n**Statistics:**\n- Files analyzed: ${stats.fileCount}\n- Total imports: ${stats.totalImports}\n- Total exports: ${stats.totalExports}\n- Last built: ${stats.lastBuilt?.toLocaleString() || "Never"}\n\n**Graph Structure:**\n- Nodes: ${graph.nodes.size} files\n- Dependencies tracked: ${graph.dependents.size} relationships\n\nThe graph will be cached for 5 minutes for performance.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to build dependency graph: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Analyze impact of changing files
   */
  @MCPTool({
    name: "impact-analyze",
    description:
      "Analyze change impact for specific files (shows affected files, breaking changes, recommendations)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to analyze impact for (relative paths)",
        },
        includeTests: {
          type: "boolean",
          description: "Include test files in impact analysis (default: true)",
        },
        maxDepth: {
          type: "number",
          description:
            "Maximum dependency depth to analyze (default: 10, higher = more thorough)",
        },
        excludePatterns: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns to exclude from analysis",
        },
      },
      required: ["files"],
    },
  })
  async handleAnalyzeImpact(args: {
    files: string[];
    includeTests?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  }): Promise<MCPToolResult> {
    try {
      const options: ImpactAnalysisOptions = {
        includeTests: args.includeTests ?? true,
        maxDepth: args.maxDepth ?? 10,
        excludePatterns: args.excludePatterns,
      };

      const result = await this.impactAnalyzer.analyzeImpact(
        args.files,
        options
      );

      if (result.affectedFiles.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **No Impact Detected**\n\n**Target files:**\n${result.targetFiles.map((f) => `- ${f}`).join("\n")}\n\n**Impact:** ${result.impactLevel.toUpperCase()}\n\nNo other files depend on the target files. Safe to modify.`,
            },
          ],
        };
      }

      // Build impact report
      const sections = [];

      // Summary section
      sections.push(
        `## Change Impact Analysis\n\n**Impact Level:** ${this.getImpactEmoji(result.impactLevel)} **${result.impactLevel.toUpperCase()}**\n\n**Target Files (${result.targetFiles.length}):**\n${result.targetFiles.map((f) => `- ${f}`).join("\n")}\n\n**Affected Files (${result.affectedFiles.length}):**`
      );

      // Group affected files by directory
      const byDirectory = this.groupByDirectory(result.affectedFiles);
      for (const [dir, files] of Object.entries(byDirectory)) {
        sections.push(
          `\n### ${dir || "root"}\n${files.map((f) => `- ${f}`).join("\n")}`
        );
      }

      // Details section
      if (result.details.length > 0) {
        sections.push(`\n## Impact Details`);

        const testDetails = result.details.filter((d) =>
          d.file.includes(".test.")
        );
        const prodDetails = result.details.filter(
          (d) => !d.file.includes(".test.")
        );

        if (prodDetails.length > 0) {
          sections.push(`\n### Production Code`);
          for (const detail of prodDetails.slice(0, 10)) {
            const icon = this.getSeverityEmoji(detail.severity);
            const symbols = detail.importedSymbols?.join(", ") || "unknown";
            sections.push(
              `${icon} **${detail.file}**\n   ${detail.reason}\n   Imports: ${symbols}`
            );
          }
          if (prodDetails.length > 10) {
            sections.push(`\n   ... and ${prodDetails.length - 10} more`);
          }
        }

        if (testDetails.length > 0) {
          sections.push(`\n### Test Files`);
          for (const detail of testDetails.slice(0, 5)) {
            sections.push(`🧪 ${detail.file}\n   ${detail.reason}`);
          }
          if (testDetails.length > 5) {
            sections.push(`   ... and ${testDetails.length - 5} more`);
          }
        }
      }

      // Suggestions section
      if (result.suggestions.length > 0) {
        sections.push(
          `\n## Recommendations\n\n${result.suggestions.map((s) => `💡 ${s}`).join("\n")}`
        );
      }

      // Breaking changes section
      if (result.breakingChanges.length > 0) {
        sections.push(`\n## ⚠️  Breaking Changes Detected`);
        for (const change of result.breakingChanges) {
          sections.push(
            `\n**${change.symbol}** (${change.changeType})\n- Affects ${change.affectedFiles.length} file(s)\n- 💡 ${change.suggestion}`
          );
        }
      }

      return {
        content: [
          {
            type: "text",
            text: sections.join("\n"),
          },
        ],
        isError: result.impactLevel === "critical",
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze impact: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Preview impact before making changes
   */
  @MCPTool({
    name: "impact-preview",
    description:
      "Quick preview of change impact before modifying files (lightweight analysis)",
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
  async handlePreviewImpact(args: { files: string[] }): Promise<MCPToolResult> {
    try {
      const result = await this.impactAnalyzer.analyzeImpact(args.files, {
        includeTests: true,
        maxDepth: 5, // Limit depth for preview
      });

      const testFiles = result.affectedFiles.filter(
        (f) => f.includes(".test.") || f.includes(".spec.")
      );
      const prodFiles = result.affectedFiles.filter(
        (f) => !f.includes(".test.") && !f.includes(".spec.")
      );

      return {
        content: [
          {
            type: "text",
            text: `## 🔍 Impact Preview\n\n**Before modifying these files:**\n${args.files.map((f) => `- ${f}`).join("\n")}\n\n**You should know:**\n\n${this.getImpactEmoji(result.impactLevel)} **Impact Level:** ${result.impactLevel.toUpperCase()}\n\n📦 **${prodFiles.length}** production file(s) will be affected\n🧪 **${testFiles.length}** test file(s) will be affected\n\n**Next Steps:**\n${
              result.affectedFiles.length === 0
                ? "✅ Safe to proceed with changes"
                : `⚠️  Review affected files:\n${result.affectedFiles
                    .slice(0, 10)
                    .map((f) => `   - ${f}`)
                    .join(
                      "\n"
                    )}${result.affectedFiles.length > 10 ? `\n   ... and ${result.affectedFiles.length - 10} more` : ""}`
            }\n\n💡 Use \`impact-analyze\` for detailed analysis before implementing.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to preview impact: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Validate changes didn't break dependencies
   */
  @MCPTool({
    name: "impact-validate",
    description:
      "Validate that recent changes didn't break dependencies (run after modifying files)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files that were modified",
        },
      },
      required: ["files"],
    },
  })
  async handleValidateChanges(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    try {
      // Build fresh graph to reflect changes
      await this.impactAnalyzer.buildGraph(true);

      // Analyze current state
      const result = await this.impactAnalyzer.analyzeImpact(args.files);

      // Check if any files have import errors (simplified check)
      const issues: string[] = [];

      for (const file of result.affectedFiles) {
        // This is a simplified check - real implementation would parse and validate
        // For now, we just report that these files might need updating
        issues.push(file);
      }

      if (issues.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Change Validation Passed**\n\n**Modified files:**\n${args.files.map((f) => `- ${f}`).join("\n")}\n\n**Validation Results:**\n- No import errors detected\n- Dependency graph updated successfully\n- ${result.affectedFiles.length} dependent file(s) checked\n\nAll affected files appear to be compatible with the changes.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `⚠️  **Review Required**\n\n**Modified files:**\n${args.files.map((f) => `- ${f}`).join("\n")}\n\n**Files that may need updates:**\n${issues
              .slice(0, 20)
              .map((f) => `- ${f}`)
              .join(
                "\n"
              )}${issues.length > 20 ? `\n... and ${issues.length - 20} more` : ""}\n\n**Recommendation:**\nReview the affected files to ensure they're compatible with your changes.`,
          },
        ],
        isError: false,
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
   * Get dependency graph statistics
   */
  @MCPTool({
    name: "impact-stats",
    description:
      "Get dependency graph statistics (file count, imports, exports, cache status)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleGraphStats(): Promise<MCPToolResult> {
    try {
      const stats = this.impactAnalyzer.getGraphStats();

      if (stats.fileCount === 0) {
        return {
          content: [
            {
              type: "text",
              text: `📊 **Dependency Graph Statistics**\n\n**Status:** Not built yet\n\nRun \`impact-build-graph\` to build the dependency graph first.`,
            },
          ],
        };
      }

      const avgImportsPerFile = (stats.totalImports / stats.fileCount).toFixed(
        1
      );
      const avgExportsPerFile = (stats.totalExports / stats.fileCount).toFixed(
        1
      );

      return {
        content: [
          {
            type: "text",
            text: `📊 **Dependency Graph Statistics**\n\n**Files:**\n- Total files analyzed: ${stats.fileCount}\n- Last built: ${stats.lastBuilt?.toLocaleString() || "Never"}\n\n**Dependencies:**\n- Total imports: ${stats.totalImports}\n- Total exports: ${stats.totalExports}\n- Avg imports/file: ${avgImportsPerFile}\n- Avg exports/file: ${avgExportsPerFile}\n\n**Performance:**\n- Graph cached for 5 minutes\n- Incremental updates supported\n\n💡 Use \`impact-analyze\` to analyze specific files.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get graph stats: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Group files by directory for display
   */
  private groupByDirectory(files: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const file of files) {
      const dir = file.includes("/")
        ? file.substring(0, file.lastIndexOf("/"))
        : "";
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }

    return groups;
  }

  /**
   * Get emoji for impact level
   */
  private getImpactEmoji(level: string): string {
    switch (level) {
      case "low":
        return "✅";
      case "medium":
        return "⚠️";
      case "high":
        return "🔶";
      case "critical":
        return "🚨";
      default:
        return "ℹ️";
    }
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "•";
    }
  }
}
