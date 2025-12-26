/**
 * Architecture Handler
 *
 * Handles architecture validation and governance operations
 */

import { MCPTool } from "../../decorators/index.js";
import { ArchitectureService } from "../../services/architecture-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { ViolationSeverity } from "../../types/architecture.js";

/**
 * MCP handler for architecture validation and governance tools.
 *
 * Provides tools to validate code against architectural rules,
 * check layer dependencies, and suggest appropriate layers for new files.
 */
export class ArchitectureHandler {
  private archService: ArchitectureService;

  /**
   * @param projectRoot - Root directory of the project to analyze
   */
  constructor(private projectRoot: string) {
    this.archService = new ArchitectureService(projectRoot);
  }

  /**
   * Validate architecture rules
   */
  @MCPTool({
    name: "arch-validate",
    description:
      "Validate architecture rules across the project (layer boundaries, naming conventions, file organization)",
    inputSchema: {
      type: "object",
      properties: {
        layers: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific layers to validate (e.g., ['ui', 'core']). Empty for all layers.",
        },
        minSeverity: {
          type: "string",
          enum: ["info", "warning", "error"],
          description: "Minimum severity level to report (default: warning)",
        },
        maxViolations: {
          type: "number",
          description: "Maximum number of violations to report (default: 50)",
        },
      },
    },
  })
  async handleValidate(args: {
    layers?: string[];
    minSeverity?: ViolationSeverity;
    maxViolations?: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.archService.validateArchitecture({
        layers: args.layers,
        minSeverity: args.minSeverity || "warning",
        maxViolations: args.maxViolations || 50,
      });

      const sections: string[] = [];

      // Header with status
      const statusEmoji = result.isValid ? "✅" : "❌";
      sections.push(`## Architecture Validation ${statusEmoji}`);
      sections.push(`\n**Status:** ${result.isValid ? "PASSED" : "FAILED"}`);
      sections.push(
        `**Validated:** ${new Date(result.validatedAt).toLocaleString()}`
      );

      // Summary metrics
      sections.push(`\n### Summary`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Total Files | ${result.totalFiles} |`);
      sections.push(
        `| Files with Violations | ${result.filesWithViolations} |`
      );
      sections.push(`| Total Violations | ${result.violations.length} |`);

      // Violations by severity
      sections.push(`\n### By Severity`);
      sections.push(`| Severity | Count |`);
      sections.push(`|----------|-------|`);
      sections.push(`| 🔴 Error | ${result.bySeverity.error} |`);
      sections.push(`| 🟡 Warning | ${result.bySeverity.warning} |`);
      sections.push(`| 🔵 Info | ${result.bySeverity.info} |`);

      // Violations by type
      sections.push(`\n### By Type`);
      sections.push(`| Type | Count |`);
      sections.push(`|------|-------|`);
      for (const [type, count] of Object.entries(result.byType)) {
        if (count > 0) {
          sections.push(`| ${this.formatViolationType(type)} | ${count} |`);
        }
      }

      // Layer statistics
      if (result.layerStats.some((s) => s.fileCount > 0)) {
        sections.push(`\n### Layer Statistics`);
        sections.push(`| Layer | Files | Violations | Forbidden Imports |`);
        sections.push(`|-------|-------|------------|-------------------|`);
        for (const stat of result.layerStats) {
          if (stat.fileCount > 0) {
            sections.push(
              `| ${stat.layer} | ${stat.fileCount} | ${stat.violationCount} | ${stat.forbiddenImports} |`
            );
          }
        }
      }

      // Top violations (limited)
      if (result.violations.length > 0) {
        sections.push(`\n### Violations`);

        // Group by file
        const byFile = new Map<string, typeof result.violations>();
        for (const v of result.violations) {
          if (!byFile.has(v.file)) {
            byFile.set(v.file, []);
          }
          byFile.get(v.file)!.push(v);
        }

        let shownCount = 0;
        const maxToShow = 20;

        for (const [file, violations] of byFile) {
          if (shownCount >= maxToShow) break;

          sections.push(`\n**${file}**`);
          for (const v of violations) {
            if (shownCount >= maxToShow) break;
            const emoji = this.getSeverityEmoji(v.severity);
            const lineInfo = v.line ? `:${v.line}` : "";
            sections.push(`- ${emoji} ${v.message}${lineInfo}`);
            sections.push(`  - Rule: \`${v.rule}\``);
            sections.push(`  - Suggestion: ${v.suggestion}`);
            shownCount++;
          }
        }

        if (result.violations.length > maxToShow) {
          sections.push(
            `\n*...and ${result.violations.length - maxToShow} more violations*`
          );
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.bySeverity.error > 0) {
        sections.push(
          `1. **Critical:** Fix ${result.bySeverity.error} error(s) - these are layer boundary violations`
        );
      }
      if (result.byType["layer-violation"] > 0) {
        sections.push(
          `2. Review import statements that violate layer boundaries`
        );
      }
      if (result.byType["naming-convention"] > 0) {
        sections.push(
          `3. Rename ${result.byType["naming-convention"]} file(s) to follow naming conventions`
        );
      }
      if (result.isValid) {
        sections.push(
          `Architecture validation passed - no critical issues found.`
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
            text: `Failed to validate architecture: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check a single file
   */
  @MCPTool({
    name: "arch-check",
    description:
      "Check a specific file against architecture rules (layer, naming, organization)",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "File path to check",
        },
      },
      required: ["file"],
    },
  })
  async handleCheck(args: { file: string }): Promise<MCPToolResult> {
    try {
      const result = await this.archService.checkFile(args.file);

      const sections: string[] = [];

      // Header
      const statusEmoji = result.isValid ? "✅" : "❌";
      sections.push(`## Architecture Check: ${result.file} ${statusEmoji}`);

      // Basic info
      sections.push(`\n### File Info`);
      sections.push(`- **Layer:** ${result.layer || "Unknown"}`);
      sections.push(
        `- **Status:** ${result.isValid ? "Valid" : "Has violations"}`
      );
      sections.push(`- **Imports:** ${result.imports.length}`);

      // Naming status
      sections.push(`\n### Naming Convention`);
      if (result.namingStatus.isValid) {
        if (result.namingStatus.matchedConvention) {
          sections.push(
            `✅ Matches convention: \`${result.namingStatus.matchedConvention}\``
          );
        } else {
          sections.push(`✅ No specific naming rules apply`);
        }
      } else {
        sections.push(
          `❌ Should match pattern: \`${result.namingStatus.expectedPattern}\``
        );
      }

      // Organization status
      sections.push(`\n### File Organization`);
      if (result.organizationStatus.isValid) {
        if (result.organizationStatus.matchedRule) {
          sections.push(
            `✅ Correctly placed: \`${result.organizationStatus.matchedRule}\``
          );
        } else {
          sections.push(`✅ No specific placement rules apply`);
        }
      } else {
        sections.push(
          `❌ Should be in: \`${result.organizationStatus.expectedPath}\``
        );
      }

      // Imports analysis
      if (result.imports.length > 0) {
        sections.push(`\n### Imports Analysis`);
        sections.push(`| Line | Module | Layer | Status |`);
        sections.push(`|------|--------|-------|--------|`);

        for (const imp of result.imports.slice(0, 15)) {
          const layerInfo = imp.targetLayer || "external";
          const status = this.getImportStatus(result.layer, imp.targetLayer);
          sections.push(
            `| ${imp.line} | \`${this.truncate(imp.module, 30)}\` | ${layerInfo} | ${status} |`
          );
        }

        if (result.imports.length > 15) {
          sections.push(
            `\n*...and ${result.imports.length - 15} more imports*`
          );
        }
      }

      // Violations
      if (result.violations.length > 0) {
        sections.push(`\n### Violations Found`);
        for (const v of result.violations) {
          const emoji = this.getSeverityEmoji(v.severity);
          const lineInfo = v.line ? ` (line ${v.line})` : "";
          sections.push(`\n${emoji} **${v.type}**${lineInfo}`);
          sections.push(`- ${v.message}`);
          sections.push(`- Rule: \`${v.rule}\``);
          sections.push(`- Suggestion: ${v.suggestion}`);
        }
      } else {
        sections.push(`\n### Result`);
        sections.push(`No architecture violations found in this file.`);
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
            text: `Failed to check file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Suggest correct placement
   */
  @MCPTool({
    name: "arch-suggest",
    description:
      "Suggest correct placement for a file based on architecture rules",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "File path to get placement suggestion for",
        },
      },
      required: ["file"],
    },
  })
  async handleSuggest(args: { file: string }): Promise<MCPToolResult> {
    try {
      const suggestion = await this.archService.suggestPlacement(args.file);

      const sections: string[] = [];

      // Header
      const confidenceEmoji = this.getConfidenceEmoji(suggestion.confidence);
      sections.push(`## Placement Suggestion ${confidenceEmoji}`);

      // Current file info
      sections.push(`\n### Current Location`);
      sections.push(`- **File:** \`${suggestion.originalFile}\``);
      sections.push(`- **Detected Type:** ${suggestion.detectedType}`);

      // Suggestion
      sections.push(`\n### Recommendation`);
      sections.push(`- **Suggested Layer:** ${suggestion.suggestedLayer}`);
      sections.push(`- **Suggested Path:** \`${suggestion.suggestedPath}\``);
      sections.push(`- **Suggested Name:** \`${suggestion.suggestedName}\``);
      sections.push(
        `- **Confidence:** ${this.formatConfidence(suggestion.confidence)}`
      );

      // Reason
      sections.push(`\n### Reasoning`);
      sections.push(suggestion.reason);

      // Action
      sections.push(`\n### Suggested Action`);
      const currentName = suggestion.originalFile.split("/").pop() || "";
      if (suggestion.suggestedName !== currentName) {
        sections.push(`\`\`\`bash`);
        sections.push(
          `mv "${suggestion.originalFile}" "${suggestion.suggestedPath}/${suggestion.suggestedName}"`
        );
        sections.push(`\`\`\``);
      } else {
        sections.push(`\`\`\`bash`);
        sections.push(
          `mv "${suggestion.originalFile}" "${suggestion.suggestedPath}/"`
        );
        sections.push(`\`\`\``);
      }

      // Alternatives
      if (suggestion.alternatives.length > 0) {
        sections.push(`\n### Alternative Locations`);
        for (const alt of suggestion.alternatives) {
          sections.push(`- \`${alt.path}\`: ${alt.reason}`);
        }
      }

      // Notes
      sections.push(`\n### Notes`);
      sections.push(`- Ensure imports are updated after moving the file`);
      sections.push(
        `- Run \`arch-validate\` after moving to verify architecture compliance`
      );

      return {
        content: [{ type: "text", text: sections.join("\n") }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to suggest placement: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: ViolationSeverity): string {
    switch (severity) {
      case "error":
        return "🔴";
      case "warning":
        return "🟡";
      case "info":
        return "🔵";
      default:
        return "⚪";
    }
  }

  /**
   * Get confidence emoji
   */
  private getConfidenceEmoji(confidence: string): string {
    switch (confidence) {
      case "high":
        return "🎯";
      case "medium":
        return "🤔";
      case "low":
        return "❓";
      default:
        return "⚪";
    }
  }

  /**
   * Format confidence level
   */
  private formatConfidence(confidence: string): string {
    switch (confidence) {
      case "high":
        return "High - Strong match based on file patterns";
      case "medium":
        return "Medium - Reasonable match based on content analysis";
      case "low":
        return "Low - Best guess based on general patterns";
      default:
        return confidence;
    }
  }

  /**
   * Format violation type
   */
  private formatViolationType(type: string): string {
    return type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Get import status indicator
   */
  private getImportStatus(
    sourceLayer: string | null,
    targetLayer: string | null
  ): string {
    if (!targetLayer) return "✅ external";
    if (!sourceLayer) return "❓ unknown source";
    if (sourceLayer === targetLayer) return "✅ same layer";
    // Simplified check - real validation happens in service
    return "⚠️ cross-layer";
  }

  /**
   * Truncate string with ellipsis
   */
  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + "...";
  }
}
