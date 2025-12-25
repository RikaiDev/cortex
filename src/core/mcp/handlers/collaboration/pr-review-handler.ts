/**
 * PR Review Handler
 *
 * Handles PR review automation operations
 */

import { MCPTool } from "../../decorators/index.js";
import { PRReviewService } from "../../services/pr-review-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { ReviewSeverity } from "../../types/pr-review.js";

export class PRReviewHandler {
  private reviewService: PRReviewService;

  constructor(private projectRoot: string) {
    this.reviewService = new PRReviewService(projectRoot);
  }

  /**
   * Auto-review a PR against team patterns
   */
  @MCPTool({
    name: "pr-auto-review",
    description:
      "Auto-review a PR against team patterns and code quality standards",
    inputSchema: {
      type: "object",
      properties: {
        prNumber: {
          type: "number",
          description: "PR number to review",
        },
        useTeamPatterns: {
          type: "boolean",
          description: "Apply team patterns from previous reviews (default: true)",
        },
        includeSuggestions: {
          type: "boolean",
          description: "Include improvement suggestions (default: false)",
        },
        minSeverity: {
          type: "string",
          enum: ["info", "suggestion", "warning", "critical"],
          description: "Minimum severity to report (default: warning)",
        },
        maxFindings: {
          type: "number",
          description: "Maximum findings to report (default: 20)",
        },
      },
      required: ["prNumber"],
    },
  })
  async handleAutoReview(args: {
    prNumber: number;
    useTeamPatterns?: boolean;
    includeSuggestions?: boolean;
    minSeverity?: ReviewSeverity;
    maxFindings?: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.reviewService.reviewPR(args.prNumber, {
        useTeamPatterns: args.useTeamPatterns,
        includeSuggestions: args.includeSuggestions,
        minSeverity: args.minSeverity || "warning",
        maxFindings: args.maxFindings || 20,
      });

      const sections: string[] = [];

      // Header
      const verdictEmoji = this.getVerdictEmoji(result.verdict);
      sections.push(`## PR Review: #${result.pr.number} ${verdictEmoji}`);
      sections.push(`**${result.pr.title}**`);
      sections.push(`\nBy @${result.pr.author} | ${result.pr.headBranch} -> ${result.pr.baseBranch}`);

      // Verdict
      sections.push(`\n### Verdict: ${this.formatVerdict(result.verdict)}`);
      sections.push(result.summary);

      // Statistics
      sections.push(`\n### Statistics`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Reviewed | ${result.stats.filesReviewed} |`);
      sections.push(`| Lines Changed | ${result.stats.linesReviewed} |`);
      sections.push(`| Total Findings | ${result.stats.totalFindings} |`);
      sections.push(`| Patterns Matched | ${result.stats.patternsMatched} |`);

      // Findings by severity
      if (result.findings.length > 0) {
        sections.push(`\n### Findings by Severity`);
        sections.push(`| Severity | Count |`);
        sections.push(`|----------|-------|`);
        sections.push(`| 🔴 Critical | ${result.stats.bySeverity.critical} |`);
        sections.push(`| 🟡 Warning | ${result.stats.bySeverity.warning} |`);
        sections.push(`| 🔵 Suggestion | ${result.stats.bySeverity.suggestion} |`);
        sections.push(`| ⚪ Info | ${result.stats.bySeverity.info} |`);
      }

      // Detailed findings
      if (result.findings.length > 0) {
        sections.push(`\n### Findings`);

        // Group by file
        const byFile = new Map<string, typeof result.findings>();
        for (const finding of result.findings) {
          if (!byFile.has(finding.file)) {
            byFile.set(finding.file, []);
          }
          byFile.get(finding.file)!.push(finding);
        }

        for (const [file, findings] of byFile) {
          sections.push(`\n**${file}**`);
          for (const finding of findings) {
            const emoji = this.getSeverityEmoji(finding.severity);
            const line = finding.line ? `:${finding.line}` : "";
            sections.push(`- ${emoji} **${finding.category}**${line}: ${finding.message}`);
            sections.push(`  - Suggestion: ${finding.suggestion}`);
          }
        }
      }

      // Applied patterns
      if (result.appliedPatterns.length > 0) {
        sections.push(`\n### Applied Team Patterns`);
        for (const pattern of result.appliedPatterns) {
          sections.push(`- **${pattern.pattern}**: ${pattern.description}`);
          sections.push(`  - Frequency: ${pattern.frequency} | Reviewers: ${pattern.reviewers.join(", ")}`);
        }
      }

      // Action items
      sections.push(`\n### Recommended Actions`);
      if (result.verdict === "approve") {
        sections.push(`- ✅ This PR looks good and can be merged`);
      } else if (result.verdict === "comment") {
        sections.push(`- 💬 Review the warnings and address where appropriate`);
        sections.push(`- Consider the suggestions for code quality improvements`);
      } else {
        sections.push(`- 🔴 Address critical issues before merging`);
        sections.push(`- Review all findings and update the PR`);
      }

      sections.push(`\n[View PR](${result.pr.url})`);

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.verdict === "request-changes",
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to review PR: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Suggest reviewers based on CODEOWNERS
   */
  @MCPTool({
    name: "pr-suggest-reviewers",
    description:
      "Suggest reviewers for a PR based on CODEOWNERS and file ownership",
    inputSchema: {
      type: "object",
      properties: {
        prNumber: {
          type: "number",
          description: "PR number to suggest reviewers for",
        },
      },
      required: ["prNumber"],
    },
  })
  async handleSuggestReviewers(args: {
    prNumber: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.reviewService.suggestReviewers(args.prNumber);

      const sections: string[] = [];

      // Header
      sections.push(`## Suggested Reviewers: PR #${result.pr.number}`);
      sections.push(`**${result.pr.title}**`);
      sections.push(`\nFiles changed: ${result.pr.files.length}`);

      // Suggested reviewers
      if (result.suggestions.length > 0) {
        sections.push(`\n### Recommended Reviewers`);
        sections.push(`| Priority | Reviewer | Type | Owned Files | Reason |`);
        sections.push(`|----------|----------|------|-------------|--------|`);

        for (const suggestion of result.suggestions.slice(0, 10)) {
          const type = suggestion.isTeam ? "Team" : "User";
          sections.push(
            `| ${suggestion.priority} | @${suggestion.username} | ${type} | ${suggestion.ownedFiles.length} | ${suggestion.reason} |`
          );
        }
      } else {
        sections.push(`\n### No Suggested Reviewers`);
        sections.push(`No code owners found for the changed files.`);
      }

      // Files by owner
      if (result.suggestions.length > 0) {
        sections.push(`\n### File Ownership`);
        for (const suggestion of result.suggestions.slice(0, 5)) {
          sections.push(`\n**@${suggestion.username}** (${suggestion.ownedFiles.length} files)`);
          for (const file of suggestion.ownedFiles.slice(0, 5)) {
            sections.push(`- ${file}`);
          }
          if (suggestion.ownedFiles.length > 5) {
            sections.push(`- *...and ${suggestion.ownedFiles.length - 5} more*`);
          }
        }
      }

      // Unowned files
      if (result.unownedFiles.length > 0) {
        sections.push(`\n### Files Without Owners`);
        sections.push(`These files have no CODEOWNERS entries:`);
        for (const file of result.unownedFiles.slice(0, 10)) {
          sections.push(`- ${file}`);
        }
        if (result.unownedFiles.length > 10) {
          sections.push(`- *...and ${result.unownedFiles.length - 10} more*`);
        }
      }

      // CODEOWNERS info
      if (result.codeOwners.length > 0) {
        sections.push(`\n### CODEOWNERS Configuration`);
        sections.push(`Found ${result.codeOwners.length} ownership rule(s).`);
      } else {
        sections.push(`\n### CODEOWNERS Not Found`);
        sections.push(`Consider adding a CODEOWNERS file to define code ownership.`);
        sections.push(`Common locations: \`CODEOWNERS\`, \`.github/CODEOWNERS\`, \`docs/CODEOWNERS\``);
      }

      // Quick action
      if (result.suggestions.length > 0) {
        const topReviewers = result.suggestions
          .slice(0, 3)
          .map((s) => s.username)
          .join(",");
        sections.push(`\n### Quick Add Reviewers`);
        sections.push("```bash");
        sections.push(`gh pr edit ${result.pr.number} --add-reviewer ${topReviewers}`);
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
            text: `Failed to suggest reviewers: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate review checklist
   */
  @MCPTool({
    name: "pr-checklist",
    description:
      "Generate a review checklist for a PR based on team patterns and file types",
    inputSchema: {
      type: "object",
      properties: {
        prNumber: {
          type: "number",
          description: "PR number to generate checklist for",
        },
      },
      required: ["prNumber"],
    },
  })
  async handleChecklist(args: { prNumber: number }): Promise<MCPToolResult> {
    try {
      const result = await this.reviewService.generateChecklist(args.prNumber);

      const sections: string[] = [];

      // Header
      const readyEmoji = result.readyForReview ? "✅" : "⚠️";
      sections.push(`## Review Checklist: PR #${result.pr.number} ${readyEmoji}`);
      sections.push(`**${result.pr.title}**`);

      // Readiness status
      sections.push(`\n### Readiness: ${result.readyForReview ? "Ready for Review" : "Needs Attention"}`);

      if (result.blockingItems.length > 0) {
        sections.push(`\n**Blocking Items:**`);
        for (const item of result.blockingItems) {
          sections.push(`- ❌ ${item}`);
        }
      }

      // Checklist by category
      const byCategory = new Map<string, typeof result.items>();
      for (const item of result.items) {
        if (!byCategory.has(item.category)) {
          byCategory.set(item.category, []);
        }
        byCategory.get(item.category)!.push(item);
      }

      sections.push(`\n### Checklist`);

      for (const [category, items] of byCategory) {
        sections.push(`\n**${this.formatCategory(category)}**`);

        for (const item of items) {
          const checkbox = this.getChecklistIcon(item.status, item.required);
          const required = item.required ? " *(required)*" : "";
          sections.push(`- ${checkbox} ${item.description}${required}`);
          if (item.details) {
            sections.push(`  - ${item.details}`);
          }
        }
      }

      // Based on
      sections.push(`\n### Generated Based On`);
      for (const source of result.basedOn) {
        sections.push(`- ${source}`);
      }

      // PR info
      sections.push(`\n### PR Info`);
      sections.push(`| Field | Value |`);
      sections.push(`|-------|-------|`);
      sections.push(`| Files Changed | ${result.pr.files.length} |`);
      sections.push(`| Additions | +${result.pr.additions} |`);
      sections.push(`| Deletions | -${result.pr.deletions} |`);
      sections.push(`| Commits | ${result.pr.commits} |`);
      sections.push(`| Author | @${result.pr.author} |`);

      // Changed files
      sections.push(`\n### Changed Files`);
      for (const file of result.pr.files.slice(0, 10)) {
        const status = this.getFileStatusIcon(file.status);
        sections.push(`- ${status} ${file.path} (+${file.additions}/-${file.deletions})`);
      }
      if (result.pr.files.length > 10) {
        sections.push(`- *...and ${result.pr.files.length - 10} more files*`);
      }

      sections.push(`\n[View PR](${result.pr.url})`);

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: !result.readyForReview,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to generate checklist: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get verdict emoji
   */
  private getVerdictEmoji(verdict: string): string {
    switch (verdict) {
      case "approve":
        return "✅";
      case "comment":
        return "💬";
      case "request-changes":
        return "❌";
      default:
        return "❓";
    }
  }

  /**
   * Format verdict
   */
  private formatVerdict(verdict: string): string {
    switch (verdict) {
      case "approve":
        return "APPROVED";
      case "comment":
        return "COMMENT";
      case "request-changes":
        return "CHANGES REQUESTED";
      default:
        return verdict.toUpperCase();
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: ReviewSeverity): string {
    switch (severity) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟡";
      case "suggestion":
        return "🔵";
      case "info":
        return "⚪";
      default:
        return "❓";
    }
  }

  /**
   * Format category
   */
  private formatCategory(category: string): string {
    return category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Get checklist icon
   */
  private getChecklistIcon(
    status: string | undefined,
    required: boolean
  ): string {
    switch (status) {
      case "pass":
        return "✅";
      case "fail":
        return required ? "❌" : "⚠️";
      case "warning":
        return "⚠️";
      case "skip":
        return "⏭️";
      default:
        return "⬜";
    }
  }

  /**
   * Get file status icon
   */
  private getFileStatusIcon(status: string): string {
    switch (status) {
      case "added":
        return "➕";
      case "modified":
        return "📝";
      case "deleted":
        return "➖";
      case "renamed":
        return "📋";
      default:
        return "📄";
    }
  }
}
