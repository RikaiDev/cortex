/**
 * Test Coverage Handler
 *
 * Handles test coverage analysis and quality operations
 */

import { MCPTool } from "../../decorators/index.js";
import { TestCoverageService } from "../../services/test-coverage/index.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { TestAnalysisOptions } from "../../types/test-coverage.js";

export class TestCoverageHandler {
  private testCoverageService: TestCoverageService;

  constructor(private projectRoot: string) {
    this.testCoverageService = new TestCoverageService(projectRoot);
  }

  /**
   * Analyze test coverage
   */
  @MCPTool({
    name: "test-analyze",
    description:
      "Analyze test coverage for the project (test files, metrics, mappings to source code)",
    inputSchema: {
      type: "object",
      properties: {
        frameworks: {
          type: "array",
          items: {
            type: "string",
            enum: ["jest", "vitest", "mocha", "playwright"],
          },
          description: "Filter by test frameworks (default: all)",
        },
        analyzeSmells: {
          type: "boolean",
          description: "Include test smell detection (default: true)",
        },
        findUntested: {
          type: "boolean",
          description: "Find untested code (default: true)",
        },
      },
    },
  })
  async handleAnalyzeTests(args: TestAnalysisOptions): Promise<MCPToolResult> {
    try {
      const result = await this.testCoverageService.analyzeTests(args);

      const sections: string[] = [];

      // Header
      sections.push(`## Test Coverage Analysis`);
      sections.push(
        `\n**Framework:** ${result.framework === "unknown" ? "Not detected" : result.framework}`
      );
      sections.push(`**Analyzed at:** ${result.analyzedAt}`);

      // Metrics section
      sections.push(`\n### Coverage Metrics`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(
        `| Source Files | ${result.metrics.totalSourceFiles} |`
      );
      sections.push(
        `| Files with Tests | ${result.metrics.testedFiles} (${result.metrics.fileCoveragePercent}%) |`
      );
      sections.push(
        `| Files without Tests | ${result.metrics.untestedFiles} |`
      );
      sections.push(`| Total Tests | ${result.metrics.totalTests} |`);
      sections.push(
        `| Total Assertions | ${result.metrics.totalAssertions} |`
      );
      sections.push(
        `| Avg Assertions/Test | ${result.metrics.avgAssertionsPerTest} |`
      );
      sections.push(
        `| Test-to-Code Ratio | ${result.metrics.testToCodeRatio} |`
      );

      // Test files summary
      if (result.testFiles.length > 0) {
        sections.push(`\n### Test Files (${result.testFiles.length})`);

        const topFiles = result.testFiles
          .sort((a, b) => b.totalTests - a.totalTests)
          .slice(0, 10);

        for (const file of topFiles) {
          const skipInfo =
            file.skippedTests > 0 ? ` (${file.skippedTests} skipped)` : "";
          const focusInfo =
            file.focusedTests > 0
              ? ` ⚠️ ${file.focusedTests} focused`
              : "";
          sections.push(
            `- **${file.path}**: ${file.totalTests} tests, ${file.totalAssertions} assertions${skipInfo}${focusInfo}`
          );
        }

        if (result.testFiles.length > 10) {
          sections.push(`\n... and ${result.testFiles.length - 10} more`);
        }
      }

      // Smells section
      if (result.smells.length > 0) {
        sections.push(`\n### Test Smells (${result.smells.length})`);

        const errorSmells = result.smells.filter(
          (s) => s.severity === "error"
        );
        const warningSmells = result.smells.filter(
          (s) => s.severity === "warning"
        );

        if (errorSmells.length > 0) {
          sections.push(`\n**Errors (${errorSmells.length}):**`);
          for (const smell of errorSmells.slice(0, 5)) {
            sections.push(
              `- ❌ ${smell.file}:${smell.line} - ${smell.description}`
            );
          }
        }

        if (warningSmells.length > 0) {
          sections.push(`\n**Warnings (${warningSmells.length}):**`);
          for (const smell of warningSmells.slice(0, 5)) {
            sections.push(
              `- ⚠️ ${smell.file}:${smell.line} - ${smell.description}`
            );
          }
        }
      }

      // Untested code summary
      if (result.untestedCode.length > 0) {
        const highPriority = result.untestedCode.filter(
          (u) => u.priority === "high"
        );
        sections.push(
          `\n### Untested Code (${result.untestedCode.length} items, ${highPriority.length} high priority)`
        );
        sections.push(`\nUse \`test-untested\` for full details.`);
      }

      // Overall assessment
      sections.push(`\n### Assessment`);
      if (result.metrics.fileCoveragePercent >= 80) {
        sections.push(`✅ **Good coverage** - ${result.metrics.fileCoveragePercent}% of files have tests`);
      } else if (result.metrics.fileCoveragePercent >= 50) {
        sections.push(`⚠️ **Moderate coverage** - ${result.metrics.fileCoveragePercent}% of files have tests`);
      } else {
        sections.push(`❌ **Low coverage** - Only ${result.metrics.fileCoveragePercent}% of files have tests`);
      }

      if (result.metrics.avgAssertionsPerTest < 1) {
        sections.push(`⚠️ Tests have very few assertions (${result.metrics.avgAssertionsPerTest} avg)`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.metrics.fileCoveragePercent < 20,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze tests: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Suggest tests for a file
   */
  @MCPTool({
    name: "test-suggest",
    description:
      "Suggest tests for a source file (identifies untested functions and recommends test cases)",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Source file to suggest tests for (relative path)",
        },
      },
      required: ["file"],
    },
  })
  async handleSuggestTests(args: { file: string }): Promise<MCPToolResult> {
    try {
      const suggestion = await this.testCoverageService.suggestTests(args.file);
      const sections: string[] = [];

      sections.push(`## Test Suggestions for ${args.file}`);
      sections.push(`\n**Suggested test file:** \`${suggestion.suggestedTestFile}\``);
      sections.push(`**Reason:** ${suggestion.reason}`);

      if (suggestion.testCases.length === 0) {
        sections.push(`\n✅ All functions appear to be tested!`);
      } else {
        sections.push(`\n### Suggested Test Cases (${suggestion.testCases.length})`);

        const unitTests = suggestion.testCases.filter(
          (t) => t.type === "unit"
        );
        const edgeCases = suggestion.testCases.filter(
          (t) => t.type === "edge-case"
        );
        const integrationTests = suggestion.testCases.filter(
          (t) => t.type === "integration"
        );

        if (unitTests.length > 0) {
          sections.push(`\n**Unit Tests:**`);
          for (const tc of unitTests) {
            sections.push(`- \`${tc.name}\``);
            sections.push(`  ${tc.description}`);
          }
        }

        if (edgeCases.length > 0) {
          sections.push(`\n**Edge Cases:**`);
          for (const tc of edgeCases) {
            sections.push(`- \`${tc.name}\``);
            sections.push(`  ${tc.description}`);
          }
        }

        if (integrationTests.length > 0) {
          sections.push(`\n**Integration Tests:**`);
          for (const tc of integrationTests) {
            sections.push(`- \`${tc.name}\``);
            sections.push(`  ${tc.description}`);
          }
        }

        // Template
        sections.push(`\n### Test Template`);
        sections.push("```typescript");
        sections.push(`import { ${this.extractModuleName(args.file)} } from './${this.getImportPath(args.file)}';`);
        sections.push(``);
        sections.push(`describe('${this.extractModuleName(args.file)}', () => {`);
        for (const tc of suggestion.testCases.slice(0, 3)) {
          sections.push(`  it('${tc.name}', () => {`);
          sections.push(`    // ${tc.description}`);
          sections.push(`    expect(true).toBe(true); // TODO: implement`);
          sections.push(`  });`);
          sections.push(``);
        }
        sections.push(`});`);
        sections.push("```");
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to suggest tests: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check test quality
   */
  @MCPTool({
    name: "test-quality",
    description:
      "Check test quality for a specific test file (detects smells, scores quality)",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Test file to check (relative path)",
        },
      },
      required: ["file"],
    },
  })
  async handleCheckQuality(args: { file: string }): Promise<MCPToolResult> {
    try {
      const result = await this.testCoverageService.checkQuality(args.file);
      const sections: string[] = [];

      // Score with emoji
      let scoreEmoji: string;
      if (result.score >= 90) {
        scoreEmoji = "🏆";
      } else if (result.score >= 70) {
        scoreEmoji = "✅";
      } else if (result.score >= 50) {
        scoreEmoji = "⚠️";
      } else {
        scoreEmoji = "❌";
      }

      sections.push(`## Test Quality Report: ${args.file}`);
      sections.push(`\n### Score: ${scoreEmoji} ${result.score}/100`);
      sections.push(`**${result.summary}**`);

      if (result.issues.length === 0) {
        sections.push(`\n✅ No issues detected - excellent test quality!`);
      } else {
        sections.push(`\n### Issues Found (${result.issues.length})`);

        const byCategory = new Map<string, typeof result.issues>();
        for (const issue of result.issues) {
          if (!byCategory.has(issue.category)) {
            byCategory.set(issue.category, []);
          }
          byCategory.get(issue.category)!.push(issue);
        }

        for (const [category, issues] of byCategory) {
          const icon = this.getSeverityIcon(issues[0].severity);
          sections.push(
            `\n**${icon} ${this.formatCategory(category)}** (${issues.length})`
          );

          for (const issue of issues.slice(0, 3)) {
            sections.push(`- Line ${issue.line}: ${issue.description}`);
            sections.push(`  💡 ${issue.suggestion}`);
          }

          if (issues.length > 3) {
            sections.push(`  ... and ${issues.length - 3} more`);
          }
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.score < 70) {
        sections.push(
          `1. Address the ${result.issues.filter((i) => i.severity === "error").length} error(s) first`
        );
        sections.push(`2. Add more assertions to empty tests`);
        sections.push(`3. Use descriptive test names`);
      } else if (result.score < 90) {
        sections.push(`1. Consider adding edge case tests`);
        sections.push(`2. Review warnings for potential improvements`);
      } else {
        sections.push(`Great job! Consider:`);
        sections.push(`- Adding integration tests if not present`);
        sections.push(`- Reviewing test coverage for edge cases`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.score < 50,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to check quality: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Find untested code
   */
  @MCPTool({
    name: "test-untested",
    description:
      "Find untested code in the project (files and functions without tests)",
    inputSchema: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["all", "high", "medium", "low"],
          description: "Filter by priority level (default: all)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
        },
      },
    },
  })
  async handleFindUntested(args: {
    priority?: string;
    limit?: number;
  }): Promise<MCPToolResult> {
    try {
      let untested = await this.testCoverageService.findUntested();

      // Filter by priority
      if (args.priority && args.priority !== "all") {
        untested = untested.filter((u) => u.priority === args.priority);
      }

      // Apply limit
      const limit = args.limit || 20;
      const total = untested.length;
      untested = untested.slice(0, limit);

      const sections: string[] = [];

      sections.push(`## Untested Code Report`);
      sections.push(`\n**Found ${total} untested items**`);

      if (untested.length === 0) {
        sections.push(`\n✅ No untested code found matching criteria!`);
      } else {
        // Group by priority
        const highPriority = untested.filter((u) => u.priority === "high");
        const mediumPriority = untested.filter((u) => u.priority === "medium");
        const lowPriority = untested.filter((u) => u.priority === "low");

        if (highPriority.length > 0) {
          sections.push(`\n### 🔴 High Priority (${highPriority.length})`);
          for (const item of highPriority) {
            sections.push(
              `\n**${item.type === "file" ? "📄" : "⚡"} ${item.name}**`
            );
            sections.push(`- File: \`${item.file}:${item.line}\``);
            if (item.exportedSymbols.length > 0) {
              sections.push(
                `- Exports: ${item.exportedSymbols.slice(0, 5).join(", ")}${item.exportedSymbols.length > 5 ? "..." : ""}`
              );
            }
            sections.push(`- 💡 ${item.suggestion}`);
          }
        }

        if (mediumPriority.length > 0) {
          sections.push(`\n### 🟡 Medium Priority (${mediumPriority.length})`);
          for (const item of mediumPriority.slice(0, 10)) {
            sections.push(
              `- **${item.name}** (\`${item.file}:${item.line}\`)`
            );
          }
          if (mediumPriority.length > 10) {
            sections.push(`  ... and ${mediumPriority.length - 10} more`);
          }
        }

        if (lowPriority.length > 0) {
          sections.push(`\n### 🟢 Low Priority (${lowPriority.length})`);
          for (const item of lowPriority.slice(0, 5)) {
            sections.push(`- ${item.name} (\`${item.file}\`)`);
          }
          if (lowPriority.length > 5) {
            sections.push(`  ... and ${lowPriority.length - 5} more`);
          }
        }

        if (total > limit) {
          sections.push(`\n*Showing ${limit} of ${total} results*`);
        }

        // Summary
        sections.push(`\n### Next Steps`);
        sections.push(
          `1. Start with high-priority items in core/services directories`
        );
        sections.push(`2. Use \`test-suggest\` to get test templates`);
        sections.push(`3. Run \`test-analyze\` after adding tests to track progress`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: untested.filter((u) => u.priority === "high").length > 10,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to find untested code: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case "error":
        return "❌";
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
  private formatCategory(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Extract module name from file path
   */
  private extractModuleName(filePath: string): string {
    const base = filePath.split("/").pop() || filePath;
    return base
      .replace(/\.(ts|tsx|js|jsx)$/, "")
      .split("-")
      .map((part, i) =>
        i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join("");
  }

  /**
   * Get import path from file path
   */
  private getImportPath(filePath: string): string {
    return filePath.replace(/\.(ts|tsx|js|jsx)$/, "");
  }
}
