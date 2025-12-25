/**
 * Team Knowledge Handler
 *
 * Handles team knowledge sharing and collaboration
 */

import { MCPTool } from "../../decorators/index.js";
import { TeamKnowledgeService } from "../../services/team-knowledge-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { TeamInsight } from "../../types/team-knowledge.js";

export class TeamKnowledgeHandler {
  private teamKnowledgeService: TeamKnowledgeService;

  constructor(private projectRoot: string) {
    this.teamKnowledgeService = new TeamKnowledgeService(projectRoot);
  }

  /**
   * Share an insight with the team
   */
  @MCPTool({
    name: "team-share-insight",
    description:
      "Share an insight, pattern, or decision with the team (stored in .cortex/team-knowledge.json)",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short title for the insight",
        },
        content: {
          type: "string",
          description: "Full description of the insight",
        },
        type: {
          type: "string",
          enum: ["learning", "pattern", "decision", "pr-review"],
          description: "Type of insight",
        },
        author: {
          type: "string",
          description: "Who is sharing this insight",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization",
        },
        scope: {
          type: "string",
          description:
            "Optional scope (e.g., 'authentication', 'database', 'api')",
        },
      },
      required: ["title", "content", "type", "author"],
    },
  })
  async handleShareInsight(args: {
    title: string;
    content: string;
    type: "learning" | "pattern" | "decision" | "pr-review";
    author: string;
    tags?: string[];
    scope?: string;
  }): Promise<MCPToolResult> {
    try {
      const id = await this.teamKnowledgeService.shareInsight({
        title: args.title,
        content: args.content,
        type: args.type,
        author: args.author,
        source: "manual",
        tags: args.tags || [],
        scope: args.scope,
        votes: 0,
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ **Insight Shared with Team**\n\n**ID:** ${id}\n**Title:** ${args.title}\n**Type:** ${args.type}\n**Author:** ${args.author}\n${args.scope ? `**Scope:** ${args.scope}\n` : ""}\n\nYour insight has been shared with the team and is now available in the team knowledge base.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to share insight: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * View team insights
   */
  @MCPTool({
    name: "team-view-insights",
    description: "View team insights (filter by author, type, or tags)",
    inputSchema: {
      type: "object",
      properties: {
        author: {
          type: "string",
          description: "Filter by author",
        },
        type: {
          type: "string",
          enum: ["learning", "pattern", "decision", "pr-review"],
          description: "Filter by type",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags (any match)",
        },
      },
    },
  })
  async handleViewInsights(args: {
    author?: string;
    type?: string;
    tags?: string[];
  }): Promise<MCPToolResult> {
    try {
      const insights = await this.teamKnowledgeService.getTeamInsights(args);

      if (insights.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `📚 **Team Knowledge Base**\n\nNo insights found${args.author ? ` for author: ${args.author}` : ""}${args.type ? ` of type: ${args.type}` : ""}.\n\nShare insights using \`team-share-insight\` to build the team knowledge base.`,
            },
          ],
        };
      }

      // Group by type
      const byType: Record<string, TeamInsight[]> = {};
      for (const insight of insights) {
        if (!byType[insight.type]) {
          byType[insight.type] = [];
        }
        byType[insight.type].push(insight);
      }

      const sections = [];
      sections.push(
        `## Team Knowledge Base\n\n**Total insights:** ${insights.length}`
      );

      for (const [type, typeInsights] of Object.entries(byType)) {
        sections.push(
          `\n### ${this.formatType(type)} (${typeInsights.length})`
        );

        for (const insight of typeInsights.slice(0, 5)) {
          const conflictIcon =
            insight.conflicts && insight.conflicts.length > 0 ? "⚠️  " : "";
          const scopeText = insight.scope ? ` [${insight.scope}]` : "";
          sections.push(
            `\n${conflictIcon}**${insight.title}**${scopeText}\n   Author: ${insight.author} | ${new Date(insight.timestamp).toLocaleDateString()}\n   ${insight.content.substring(0, 150)}${insight.content.length > 150 ? "..." : ""}\n   Tags: ${insight.tags.join(", ") || "none"}`
          );
        }

        if (typeInsights.length > 5) {
          sections.push(`\n   ... and ${typeInsights.length - 5} more`);
        }
      }

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
            text: `Failed to view insights: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Learn from PR reviews
   */
  @MCPTool({
    name: "team-learn-pr",
    description:
      "Extract review patterns from a PR to learn team preferences and standards",
    inputSchema: {
      type: "object",
      properties: {
        prNumber: {
          type: "number",
          description: "PR number to learn from",
        },
      },
      required: ["prNumber"],
    },
  })
  async handleLearnFromPR(args: { prNumber: number }): Promise<MCPToolResult> {
    try {
      const patterns = await this.teamKnowledgeService.extractPRPatterns(
        args.prNumber
      );

      if (patterns.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `ℹ️  **No Review Patterns Found**\n\nPR #${args.prNumber} has no review comments with recognizable patterns.`,
            },
          ],
        };
      }

      const patternsList = patterns
        .map((p) => {
          const reviewersList = p.reviewers.join(", ");
          return `**${p.pattern}**\n   ${p.description}\n   Frequency: ${p.frequency} | Reviewers: ${reviewersList}\n   Example: "${p.examples[0]}"`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `✅ **Learned from PR #${args.prNumber}**\n\n**Patterns Extracted:** ${patterns.length}\n\n${patternsList}\n\nThese patterns have been saved to the team knowledge base and will be applied in future reviews.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to learn from PR: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * View conflicts
   */
  @MCPTool({
    name: "team-view-conflicts",
    description:
      "View unresolved conflicts between team insights (contradicting patterns or decisions)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleViewConflicts(): Promise<MCPToolResult> {
    try {
      const conflicts = await this.teamKnowledgeService.getConflicts(false);

      if (conflicts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **No Team Conflicts**\n\nAll team insights are aligned. No conflicts detected.`,
            },
          ],
        };
      }

      const conflictsList = conflicts
        .map((c) => {
          const insightsList = c.insights
            .map((i) => `   - ${i.title} by ${i.author}`)
            .join("\n");
          const suggestionsList = c.suggestions
            .map((s) => `   💡 ${s}`)
            .join("\n");

          return `**${c.conflictId}** - ${c.type}\n${c.description}\n\n**Conflicting insights:**\n${insightsList}\n\n**Suggestions:**\n${suggestionsList}`;
        })
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text",
            text: `⚠️  **Team Conflicts Detected**\n\n**Unresolved conflicts:** ${conflicts.length}\n\n${conflictsList}\n\nUse \`team-resolve-conflict\` to resolve these conflicts.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to view conflicts: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Resolve a conflict
   */
  @MCPTool({
    name: "team-resolve-conflict",
    description:
      "Resolve a conflict between team insights by recording a decision",
    inputSchema: {
      type: "object",
      properties: {
        conflictId: {
          type: "string",
          description: "ID of the conflict to resolve",
        },
        resolution: {
          type: "string",
          description: "How the conflict was resolved (which approach to use)",
        },
      },
      required: ["conflictId", "resolution"],
    },
  })
  async handleResolveConflict(args: {
    conflictId: string;
    resolution: string;
  }): Promise<MCPToolResult> {
    try {
      await this.teamKnowledgeService.resolveConflict(
        args.conflictId,
        args.resolution
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ **Conflict Resolved**\n\n**Conflict ID:** ${args.conflictId}\n**Resolution:** ${args.resolution}\n\nThe conflict has been marked as resolved and the team decision has been recorded.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to resolve conflict: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Sync team knowledge
   */
  @MCPTool({
    name: "team-sync",
    description:
      "Sync team knowledge with git (push local insights or pull team updates)",
    inputSchema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["push", "pull"],
          description: "Push local insights or pull team updates",
        },
      },
      required: ["direction"],
    },
  })
  async handleSync(args: {
    direction: "push" | "pull";
  }): Promise<MCPToolResult> {
    try {
      if (args.direction === "push") {
        await this.teamKnowledgeService.syncToGit();
        return {
          content: [
            {
              type: "text",
              text: `✅ **Team Knowledge Synced**\n\nLocal insights have been committed and are ready to push to the team repository.`,
            },
          ],
        };
      } else {
        await this.teamKnowledgeService.pullFromGit();
        return {
          content: [
            {
              type: "text",
              text: `✅ **Team Knowledge Updated**\n\nLatest team insights have been pulled from the repository.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to sync: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get team knowledge statistics
   */
  @MCPTool({
    name: "team-stats",
    description:
      "Get team knowledge statistics (insights count, conflicts, contributors)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleGetStats(): Promise<MCPToolResult> {
    try {
      const stats = await this.teamKnowledgeService.getStats();

      const byAuthorList = Object.entries(stats.byAuthor)
        .sort((a, b) => b[1] - a[1])
        .map(([author, count]) => `   - ${author}: ${count} insights`)
        .join("\n");

      const byTypeList = Object.entries(stats.byType)
        .map(([type, count]) => `   - ${this.formatType(type)}: ${count}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📊 **Team Knowledge Statistics**\n\n**Overview:**\n- Total insights: ${stats.totalInsights}\n- PR patterns learned: ${stats.prPatterns}\n- Active conflicts: ${stats.conflicts}\n- Resolved conflicts: ${stats.resolvedConflicts}\n\n**By Author:**\n${byAuthorList || "   None yet"}\n\n**By Type:**\n${byTypeList || "   None yet"}\n\n**Team Health:**\n${stats.conflicts === 0 ? "✅ No conflicts - team is aligned" : `⚠️  ${stats.conflicts} conflicts need resolution`}\n${stats.totalInsights > 10 ? "🎯 Great knowledge sharing!" : "💡 Encourage more knowledge sharing"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Format type for display
   */
  private formatType(type: string): string {
    const formatted: Record<string, string> = {
      learning: "📚 Learning",
      pattern: "🔍 Pattern",
      decision: "🎯 Decision",
      "pr-review": "💬 PR Review",
    };
    return formatted[type] || type;
  }
}
