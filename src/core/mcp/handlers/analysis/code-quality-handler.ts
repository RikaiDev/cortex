/**
 * Code Quality Handler
 *
 * Handles code quality analysis and smell detection operations
 */

import { MCPTool } from "../../decorators/index.js";
import { CodeQualityService } from "../../services/code-quality-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { SmellSeverity } from "../../types/code-quality.js";

export class CodeQualityHandler {
  private qualityService: CodeQualityService;

  constructor(private projectRoot: string) {
    this.qualityService = new CodeQualityService(projectRoot);
  }

  /**
   * Analyze code quality
   */
  @MCPTool({
    name: "quality-analyze",
    description:
      "Analyze code quality and detect code smells (long methods, god objects, high complexity)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to analyze (empty for all)",
        },
        minSeverity: {
          type: "string",
          enum: ["info", "minor", "major", "critical"],
          description: "Minimum severity to report (default: minor)",
        },
        maxSmells: {
          type: "number",
          description: "Maximum smells to report (default: 50)",
        },
      },
    },
  })
  async handleAnalyze(args: {
    files?: string[];
    minSeverity?: SmellSeverity;
    maxSmells?: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.qualityService.analyzeQuality({
        files: args.files,
        minSeverity: args.minSeverity || "minor",
        maxSmells: args.maxSmells || 50,
        includeMetrics: true,
      });

      const sections: string[] = [];

      // Header
      const gradeEmoji = this.getGradeEmoji(result.grade);
      sections.push(`## Code Quality Analysis ${gradeEmoji}`);
      sections.push(`\n**Grade: ${result.grade}** | Score: ${result.overallScore}/100`);
      sections.push(`\n${result.summary}`);

      // Statistics
      sections.push(`\n### Overview`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Analyzed | ${result.filesAnalyzed} |`);
      sections.push(`| Total Lines | ${result.totalLinesOfCode} |`);
      sections.push(`| Total Smells | ${result.smells.length} |`);

      // Smells by severity
      if (result.smells.length > 0) {
        sections.push(`\n### Smells by Severity`);
        sections.push(`| Severity | Count |`);
        sections.push(`|----------|-------|`);
        sections.push(`| 🔴 Critical | ${result.smellsBySeverity.critical} |`);
        sections.push(`| 🟠 Major | ${result.smellsBySeverity.major} |`);
        sections.push(`| 🟡 Minor | ${result.smellsBySeverity.minor} |`);
        sections.push(`| ⚪ Info | ${result.smellsBySeverity.info} |`);

        // Smells by type (only show non-zero)
        const activeTypes = Object.entries(result.smellsByType)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);

        if (activeTypes.length > 0) {
          sections.push(`\n### Smells by Type`);
          sections.push(`| Type | Count |`);
          sections.push(`|------|-------|`);
          for (const [type, count] of activeTypes.slice(0, 10)) {
            sections.push(`| ${this.formatSmellType(type)} | ${count} |`);
          }
        }
      }

      // Top complex functions
      if (result.topComplexFunctions.length > 0) {
        sections.push(`\n### Most Complex Functions`);
        sections.push(`| Function | File | Complexity | Lines | Rating |`);
        sections.push(`|----------|------|------------|-------|--------|`);

        for (const func of result.topComplexFunctions.slice(0, 10)) {
          const ratingEmoji = this.getRatingEmoji(func.rating);
          sections.push(
            `| ${func.name} | ${func.file}:${func.startLine} | ${func.cyclomaticComplexity} | ${func.linesOfCode} | ${ratingEmoji} ${func.rating} |`
          );
        }
      }

      // God objects
      const godObjects = result.classMetrics.filter((c) => c.isGodObject);
      if (godObjects.length > 0) {
        sections.push(`\n### God Objects Detected`);
        for (const cls of godObjects) {
          sections.push(`- **${cls.name}** (${cls.file}:${cls.startLine})`);
          sections.push(`  - Methods: ${cls.methodCount}, Lines: ${cls.linesOfCode}`);
        }
      }

      // Detailed smells
      if (result.smells.length > 0) {
        sections.push(`\n### Code Smells`);

        // Group by file
        const byFile = new Map<string, typeof result.smells>();
        for (const smell of result.smells) {
          if (!byFile.has(smell.file)) {
            byFile.set(smell.file, []);
          }
          byFile.get(smell.file)!.push(smell);
        }

        let shown = 0;
        for (const [file, smells] of byFile) {
          if (shown >= 30) break;
          sections.push(`\n**${file}**`);

          for (const smell of smells) {
            if (shown >= 30) break;
            const emoji = this.getSeverityEmoji(smell.severity);
            sections.push(
              `- ${emoji} **${this.formatSmellType(smell.type)}** (${smell.entityName}:${smell.startLine})`
            );
            sections.push(`  - ${smell.description}`);
            sections.push(`  - 💡 ${smell.suggestion}`);
            shown++;
          }
        }

        if (result.smells.length > 30) {
          sections.push(`\n*...and ${result.smells.length - 30} more smells*`);
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.grade === "A" || result.grade === "B") {
        sections.push(`- ✅ Code quality is good. Maintain current standards.`);
      } else {
        if (result.smellsBySeverity.critical > 0) {
          sections.push(`- 🚨 Address ${result.smellsBySeverity.critical} critical smell(s) immediately`);
        }
        if (godObjects.length > 0) {
          sections.push(`- 📦 Refactor ${godObjects.length} god object(s) into smaller classes`);
        }
        if (result.topComplexFunctions.some((f) => f.cyclomaticComplexity > 20)) {
          sections.push(`- 🔄 Simplify highly complex functions (complexity > 20)`);
        }
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.grade === "F",
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze quality: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Calculate complexity metrics
   */
  @MCPTool({
    name: "quality-complexity",
    description:
      "Calculate cyclomatic and cognitive complexity for functions",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to analyze (empty for all)",
        },
        threshold: {
          type: "number",
          description: "Complexity threshold for highlighting (default: 10)",
        },
      },
    },
  })
  async handleComplexity(args: {
    files?: string[];
    threshold?: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.qualityService.analyzeComplexity({
        files: args.files,
        complexityThreshold: args.threshold,
      });

      const sections: string[] = [];

      // Header
      sections.push(`## Complexity Analysis`);
      sections.push(`\n${result.summary}`);

      // Statistics
      sections.push(`\n### Statistics`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Analyzed | ${result.filesAnalyzed} |`);
      sections.push(`| Total Functions | ${result.totalFunctions} |`);
      sections.push(`| Average Complexity | ${result.averageComplexity} |`);
      sections.push(`| Median Complexity | ${result.medianComplexity} |`);
      sections.push(`| Maximum Complexity | ${result.maxComplexity} |`);

      // Rating distribution
      sections.push(`\n### Complexity Rating Distribution`);
      sections.push(`| Rating | Count | Description |`);
      sections.push(`|--------|-------|-------------|`);
      sections.push(`| 🟢 A | ${result.byRating.A} | Simple (1-5) |`);
      sections.push(`| 🔵 B | ${result.byRating.B} | Moderate (6-10) |`);
      sections.push(`| 🟡 C | ${result.byRating.C} | Complex (11-20) |`);
      sections.push(`| 🟠 D | ${result.byRating.D} | High (21-30) |`);
      sections.push(`| 🔴 F | ${result.byRating.F} | Very High (30+) |`);

      // High complexity functions
      if (result.highComplexityFunctions.length > 0) {
        sections.push(`\n### High Complexity Functions`);
        sections.push(`| Function | File | Cyclomatic | Cognitive | Nesting | Lines |`);
        sections.push(`|----------|------|------------|-----------|---------|-------|`);

        for (const func of result.highComplexityFunctions.slice(0, 20)) {
          sections.push(
            `| ${func.name} | ${func.file}:${func.startLine} | ${func.cyclomaticComplexity} | ${func.cognitiveComplexity} | ${func.maxNestingDepth} | ${func.linesOfCode} |`
          );
        }

        if (result.highComplexityFunctions.length > 20) {
          sections.push(
            `\n*...and ${result.highComplexityFunctions.length - 20} more high-complexity functions*`
          );
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.highComplexityFunctions.length === 0) {
        sections.push(`- ✅ All functions are within acceptable complexity limits`);
      } else {
        sections.push(
          `- 🔄 Refactor ${result.highComplexityFunctions.length} function(s) exceeding threshold`
        );
        sections.push(`- Consider extracting helper functions`);
        sections.push(`- Use early returns to reduce nesting`);
        sections.push(`- Replace complex conditionals with strategy pattern`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.highComplexityFunctions.length > 10,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze complexity: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Find duplicate code
   */
  @MCPTool({
    name: "quality-duplicates",
    description: "Find duplicated code blocks across the codebase",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to analyze (empty for all)",
        },
      },
    },
  })
  async handleDuplicates(args: { files?: string[] }): Promise<MCPToolResult> {
    try {
      const result = await this.qualityService.findDuplicates({
        files: args.files,
      });

      const sections: string[] = [];

      // Header
      const statusEmoji = result.duplicationPercentage < 5 ? "✅" : "⚠️";
      sections.push(`## Code Duplication Analysis ${statusEmoji}`);
      sections.push(`\n${result.summary}`);

      // Statistics
      sections.push(`\n### Statistics`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Analyzed | ${result.filesAnalyzed} |`);
      sections.push(`| Total Lines | ${result.totalLines} |`);
      sections.push(`| Duplicated Lines | ${result.duplicatedLines} |`);
      sections.push(`| Duplication % | ${result.duplicationPercentage}% |`);
      sections.push(`| Duplicate Blocks | ${result.duplicateBlockCount} |`);

      // Top duplicated files
      if (result.topDuplicatedFiles.length > 0) {
        sections.push(`\n### Files with Most Duplication`);
        sections.push(`| File | Duplicated Lines | Percentage |`);
        sections.push(`|------|------------------|------------|`);

        for (const file of result.topDuplicatedFiles.slice(0, 10)) {
          sections.push(
            `| ${file.file} | ${file.duplicatedLines} | ${file.percentage.toFixed(1)}% |`
          );
        }
      }

      // Duplicate blocks
      if (result.duplicates.length > 0) {
        sections.push(`\n### Duplicate Blocks`);

        for (const dup of result.duplicates.slice(0, 15)) {
          sections.push(`\n**${dup.lines} lines duplicated** (${dup.similarity}% similar)`);
          sections.push(`- Location 1: \`${dup.first.file}:${dup.first.startLine}-${dup.first.endLine}\``);
          sections.push(`- Location 2: \`${dup.second.file}:${dup.second.startLine}-${dup.second.endLine}\``);
          sections.push("```");
          sections.push(dup.snippet);
          sections.push("```");
        }

        if (result.duplicates.length > 15) {
          sections.push(
            `\n*...and ${result.duplicates.length - 15} more duplicate blocks*`
          );
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.duplicationPercentage < 3) {
        sections.push(`- ✅ Code duplication is minimal (< 3%)`);
      } else if (result.duplicationPercentage < 10) {
        sections.push(`- ⚠️ Consider extracting duplicated code into shared utilities`);
      } else {
        sections.push(`- 🚨 High duplication detected - refactoring recommended`);
        sections.push(`- Extract common code into reusable functions/modules`);
        sections.push(`- Use inheritance or composition for shared behavior`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.duplicationPercentage > 15,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to find duplicates: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Suggest refactorings
   */
  @MCPTool({
    name: "quality-refactor",
    description:
      "Suggest refactoring opportunities based on code smells and complexity",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to analyze (empty for all)",
        },
      },
    },
  })
  async handleRefactor(args: { files?: string[] }): Promise<MCPToolResult> {
    try {
      const result = await this.qualityService.suggestRefactorings({
        files: args.files,
      });

      const sections: string[] = [];

      // Header
      sections.push(`## Refactoring Suggestions`);
      sections.push(`\n${result.summary}`);

      // Statistics
      sections.push(`\n### Overview`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Analyzed | ${result.filesAnalyzed} |`);
      sections.push(`| Total Suggestions | ${result.totalSuggestions} |`);
      sections.push(`| Estimated Debt | ${result.estimatedDebtHours} hours |`);

      // By effort
      sections.push(`\n### By Effort Level`);
      sections.push(`| Effort | Count |`);
      sections.push(`|--------|-------|`);
      sections.push(`| 🟢 Low | ${result.byEffort.low} |`);
      sections.push(`| 🟡 Medium | ${result.byEffort.medium} |`);
      sections.push(`| 🔴 High | ${result.byEffort.high} |`);

      // By type (non-zero only)
      const activeTypes = Object.entries(result.byType)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

      if (activeTypes.length > 0) {
        sections.push(`\n### By Refactoring Type`);
        sections.push(`| Type | Count |`);
        sections.push(`|------|-------|`);
        for (const [type, count] of activeTypes.slice(0, 10)) {
          sections.push(`| ${this.formatRefactoringType(type)} | ${count} |`);
        }
      }

      // Top priority suggestions
      if (result.topPriority.length > 0) {
        sections.push(`\n### Top Priority Refactorings`);

        for (const suggestion of result.topPriority.slice(0, 10)) {
          const effortEmoji = this.getEffortEmoji(suggestion.effort);
          sections.push(
            `\n**${suggestion.priority}. ${this.formatRefactoringType(suggestion.type)}** ${effortEmoji}`
          );
          sections.push(`- 📍 ${suggestion.entityName} (${suggestion.file}:${suggestion.startLine})`);
          sections.push(`- 📝 ${suggestion.description}`);
          sections.push(`- 💡 Reason: ${suggestion.reason}`);
          sections.push(`- ✨ Expected: ${suggestion.expectedImprovement}`);
        }
      }

      // Recommendations
      sections.push(`\n### Action Plan`);
      if (result.totalSuggestions === 0) {
        sections.push(`- ✅ No immediate refactoring needed`);
      } else {
        sections.push(`1. Start with low-effort, high-impact refactorings`);
        sections.push(`2. Address critical smells first (god objects, high complexity)`);
        sections.push(`3. Allocate ~${result.estimatedDebtHours} hours for technical debt reduction`);

        if (result.byType["extract-method"] > 5) {
          sections.push(
            `4. Consider a focused "Extract Method" sprint (${result.byType["extract-method"]} opportunities)`
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
            text: `Failed to suggest refactorings: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get grade emoji
   */
  private getGradeEmoji(grade: string): string {
    switch (grade) {
      case "A":
        return "🏆";
      case "B":
        return "✅";
      case "C":
        return "⚠️";
      case "D":
        return "🟠";
      case "F":
        return "🔴";
      default:
        return "❓";
    }
  }

  /**
   * Get rating emoji
   */
  private getRatingEmoji(rating: string): string {
    switch (rating) {
      case "A":
        return "🟢";
      case "B":
        return "🔵";
      case "C":
        return "🟡";
      case "D":
        return "🟠";
      case "F":
        return "🔴";
      default:
        return "⚪";
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: SmellSeverity): string {
    switch (severity) {
      case "critical":
        return "🔴";
      case "major":
        return "🟠";
      case "minor":
        return "🟡";
      case "info":
        return "⚪";
      default:
        return "❓";
    }
  }

  /**
   * Get effort emoji
   */
  private getEffortEmoji(effort: string): string {
    switch (effort) {
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
   * Format smell type
   */
  private formatSmellType(type: string): string {
    return type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Format refactoring type
   */
  private formatRefactoringType(type: string): string {
    return type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
}
