/**
 * Documentation Handler
 *
 * MCP handler for documentation analysis and generation tools
 */

import { MCPTool } from "../../decorators/mcp-tool.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import { DocumentationService } from "../../services/documentation-service.js";
import type { DocAnalysisOptions } from "../../types/documentation.js";

export class DocumentationHandler {
  private service: DocumentationService;

  constructor(projectRoot: string) {
    this.service = new DocumentationService(projectRoot);
  }

  @MCPTool({
    name: "doc-analyze",
    description:
      "Analyze documentation coverage and quality across the codebase. Returns coverage metrics, quality scores, and identified issues.",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to analyze (optional, analyzes all if not provided)",
        },
        includePrivate: {
          type: "boolean",
          description: "Include private/non-exported members (default: false)",
        },
        minCoverage: {
          type: "number",
          description: "Minimum coverage threshold to pass (0-100)",
        },
      },
    },
  })
  async handleDocAnalyze(args: {
    files?: string[];
    includePrivate?: boolean;
    minCoverage?: number;
  }): Promise<MCPToolResult> {
    try {
      const options: DocAnalysisOptions = {
        files: args.files,
        includePrivate: args.includePrivate,
      };

      const result = await this.service.analyzeDocumentation(options);

      // Check against threshold
      let status = "success";
      if (args.minCoverage && result.coverage.coverage < args.minCoverage) {
        status = "warning";
      }

      const output: string[] = [];
      output.push("# Documentation Analysis Report\n");
      output.push(`**Status:** ${status === "success" ? "✅ Passed" : "⚠️ Below threshold"}`);
      output.push(`**Analyzed:** ${result.filesAnalyzed} files`);
      output.push(`**Quality:** ${result.quality} (${result.qualityScore}/100)`);
      output.push("");

      output.push("## Coverage Summary\n");
      output.push(`- **Overall Coverage:** ${result.coverage.coverage}%`);
      output.push(`- **Documented:** ${result.coverage.documented}/${result.coverage.total} items`);
      if (result.coverage.partial > 0) {
        output.push(`- **Partially Documented:** ${result.coverage.partial} items`);
      }
      if (result.coverage.missing > 0) {
        output.push(`- **Missing Documentation:** ${result.coverage.missing} items`);
      }

      // Coverage by type
      output.push("\n## Coverage by Type\n");
      output.push("| Type | Total | Documented | Coverage |");
      output.push("|------|-------|------------|----------|");
      for (const [type, stats] of Object.entries(result.coverage.byType)) {
        if (stats.total > 0) {
          const pct = Math.round((stats.documented / stats.total) * 100);
          output.push(`| ${type} | ${stats.total} | ${stats.documented} | ${pct}% |`);
        }
      }

      // Top issues
      if (result.issues.length > 0) {
        output.push("\n## Issues Found\n");
        const topIssues = result.issues.slice(0, 10);
        for (const issue of topIssues) {
          const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
          output.push(`${icon} **${issue.file}:${issue.line}** - ${issue.description}`);
        }
        if (result.issues.length > 10) {
          output.push(`\n... and ${result.issues.length - 10} more issues`);
        }
      }

      // Files with low coverage
      const lowCoverageFiles = result.files
        .filter((f) => f.coverage.coverage < 50 && f.coverage.total > 0)
        .sort((a, b) => a.coverage.coverage - b.coverage.coverage)
        .slice(0, 5);

      if (lowCoverageFiles.length > 0) {
        output.push("\n## Files Needing Attention\n");
        for (const file of lowCoverageFiles) {
          output.push(`- **${file.file}**: ${file.coverage.coverage}% coverage (${file.coverage.missing} missing)`);
        }
      }

      return {
        content: [{ type: "text", text: output.join("\n") }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  @MCPTool({
    name: "doc-missing",
    description:
      "Find all undocumented or partially documented code in the codebase. Returns prioritized list of items needing documentation.",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to check (optional)",
        },
        includePrivate: {
          type: "boolean",
          description: "Include private/non-exported members (default: false)",
        },
        entityTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["class", "interface", "type", "enum", "function", "method", "property", "constant"],
          },
          description: "Filter by entity types",
        },
      },
    },
  })
  async handleDocMissing(args: {
    files?: string[];
    includePrivate?: boolean;
    entityTypes?: string[];
  }): Promise<MCPToolResult> {
    try {
      const options: DocAnalysisOptions = {
        files: args.files,
        includePrivate: args.includePrivate,
      };

      const result = await this.service.findMissingDocumentation(options);

      const output: string[] = [];
      output.push("# Missing Documentation Report\n");
      output.push(`**Total Missing:** ${result.totalMissing} items`);
      output.push(`**Files Analyzed:** ${result.filesAnalyzed}`);
      output.push("");

      // By type summary
      output.push("## Missing by Type\n");
      const typeEntries = Object.entries(result.byType).filter(([, count]) => count > 0);
      if (typeEntries.length > 0) {
        for (const [type, count] of typeEntries) {
          output.push(`- **${type}:** ${count}`);
        }
      } else {
        output.push("✅ No missing documentation found!");
      }

      // Priority items (public APIs)
      if (result.priorityItems.length > 0) {
        output.push("\n## Priority Items (Public APIs)\n");
        output.push("These exported items should be documented first:\n");
        for (const item of result.priorityItems.slice(0, 15)) {
          const status = item.status === "partial" ? "📝 Partial" : "❌ Missing";
          output.push(`${status} **${item.type}** \`${item.name}\` - ${item.file}:${item.startLine}`);
        }
        if (result.priorityItems.length > 15) {
          output.push(`\n... and ${result.priorityItems.length - 15} more priority items`);
        }
      }

      // By file
      if (result.byFile.length > 0) {
        output.push("\n## By File\n");
        for (const fileGroup of result.byFile.slice(0, 10)) {
          output.push(`### ${fileGroup.file} (${fileGroup.count} items)\n`);
          for (const item of fileGroup.items.slice(0, 5)) {
            output.push(`- ${item.type} \`${item.name}\` (line ${item.startLine})`);
          }
          if (fileGroup.items.length > 5) {
            output.push(`- ... and ${fileGroup.items.length - 5} more`);
          }
          output.push("");
        }
        if (result.byFile.length > 10) {
          output.push(`... and ${result.byFile.length - 10} more files`);
        }
      }

      return {
        content: [{ type: "text", text: output.join("\n") }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding missing documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  @MCPTool({
    name: "doc-validate",
    description:
      "Validate code examples in documentation. Checks for syntax errors and common issues in @example blocks.",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to validate (optional)",
        },
      },
    },
  })
  async handleDocValidate(args: { files?: string[] }): Promise<MCPToolResult> {
    try {
      const options: DocAnalysisOptions = {
        files: args.files,
        validateExamples: true,
      };

      const result = await this.service.validateDocumentation(options);

      const output: string[] = [];
      output.push("# Documentation Validation Report\n");
      output.push(`**Files Analyzed:** ${result.filesAnalyzed}`);
      output.push(`**Total Examples:** ${result.totalExamples}`);
      output.push("");

      if (result.totalExamples === 0) {
        output.push("ℹ️ No @example blocks found in the codebase.");
        output.push("\nConsider adding examples to your public APIs to improve documentation quality.");
      } else {
        // Summary
        const validPct = Math.round((result.validExamples / result.totalExamples) * 100);
        output.push("## Validation Summary\n");
        output.push(`- ✅ **Valid:** ${result.validExamples} (${validPct}%)`);
        output.push(`- ❌ **Invalid:** ${result.invalidExamples}`);

        // Invalid examples
        if (result.invalidExamples > 0) {
          output.push("\n## Invalid Examples\n");
          const invalidExamples = result.examples.filter((e) => !e.isValid);
          for (const example of invalidExamples) {
            output.push(`### ${example.file}:${example.line} - \`${example.entityName}\`\n`);
            output.push(`**Error:** ${example.error}`);
            output.push("\n```" + (example.language || "typescript"));
            output.push(example.code.slice(0, 200));
            if (example.code.length > 200) {
              output.push("...");
            }
            output.push("```\n");
          }
        }

        // Valid examples (show a few)
        if (result.validExamples > 0) {
          output.push("\n## Valid Examples\n");
          const validExamples = result.examples.filter((e) => e.isValid).slice(0, 5);
          for (const example of validExamples) {
            output.push(`- ✅ ${example.file}:${example.line} - \`${example.entityName}\``);
          }
          if (result.validExamples > 5) {
            output.push(`\n... and ${result.validExamples - 5} more valid examples`);
          }
        }
      }

      // Issues
      if (result.issues.length > 0) {
        output.push("\n## Issues\n");
        for (const issue of result.issues) {
          output.push(`⚠️ **${issue.file}:${issue.line}** - ${issue.description}`);
          output.push(`   Suggestion: ${issue.suggestion}`);
        }
      }

      return {
        content: [{ type: "text", text: output.join("\n") }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error validating documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  @MCPTool({
    name: "doc-generate",
    description:
      "Generate JSDoc/TSDoc templates for undocumented code. Creates ready-to-use documentation stubs.",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to generate docs for (optional)",
        },
        includePrivate: {
          type: "boolean",
          description: "Include private/non-exported members (default: false)",
        },
        maxTemplates: {
          type: "number",
          description: "Maximum number of templates to generate (default: 20)",
        },
      },
    },
  })
  async handleDocGenerate(args: {
    files?: string[];
    includePrivate?: boolean;
    maxTemplates?: number;
  }): Promise<MCPToolResult> {
    try {
      const options: DocAnalysisOptions = {
        files: args.files,
        includePrivate: args.includePrivate,
      };

      const result = await this.service.generateDocumentation(options);
      const maxTemplates = args.maxTemplates || 20;
      const templates = result.templates.slice(0, maxTemplates);

      const output: string[] = [];
      output.push("# Generated Documentation Templates\n");
      output.push(`**Files Processed:** ${result.filesProcessed}`);
      output.push(`**Templates Generated:** ${result.templatesGenerated}`);
      if (result.templatesGenerated > maxTemplates) {
        output.push(`**Showing:** ${maxTemplates} of ${result.templatesGenerated}`);
      }
      output.push("");

      if (templates.length === 0) {
        output.push("✅ No missing documentation found! All items are documented.");
      } else {
        // Group by file
        const byFile = new Map<string, typeof templates>();
        for (const template of templates) {
          const existing = byFile.get(template.file) || [];
          existing.push(template);
          byFile.set(template.file, existing);
        }

        for (const [file, fileTemplates] of byFile) {
          output.push(`## ${file}\n`);

          for (const template of fileTemplates) {
            output.push(`### ${template.entityType} \`${template.entityName}\` (line ${template.insertLine})\n`);
            output.push("```typescript");
            output.push(template.template);
            output.push("```\n");
          }
        }

        output.push("---\n");
        output.push("**Usage:** Copy the generated templates and paste them above the corresponding declarations.");
        output.push("Replace `TODO` placeholders with actual descriptions.");
      }

      return {
        content: [{ type: "text", text: output.join("\n") }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
}
