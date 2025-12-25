/**
 * Dependency Handler
 *
 * Handles dependency version management and compatibility checking
 */

import { MCPTool } from "../../decorators/index.js";
import { DependencyService } from "../../services/dependency-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class DependencyHandler {
  private dependencyService: DependencyService;

  constructor(private projectRoot: string) {
    this.dependencyService = new DependencyService(projectRoot);
  }

  /**
   * Analyze all project dependencies
   */
  @MCPTool({
    name: "dependency-analyze",
    description:
      "Analyze all project dependencies from package.json, requirements.txt, go.mod",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleAnalyzeDependencies(): Promise<MCPToolResult> {
    try {
      const analysis = await this.dependencyService.analyzeDependencies();

      if (analysis.totalCount === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No dependencies found.\n\n**Checked for:**\n- package.json (npm)\n- requirements.txt (Python)\n- go.mod (Go)\n\nAdd dependencies to these files to track versions.`,
            },
          ],
        };
      }

      const byManagerList = Object.entries(analysis.byManager)
        .map(([manager, count]) => `- ${manager}: ${count} packages`)
        .join("\n");

      const depList = analysis.dependencies
        .slice(0, 20)
        .map((dep) => {
          const version = dep.installedVersion || dep.version;
          const devTag = dep.isDev ? " (dev)" : "";
          return `  - ${dep.name}@${version}${devTag}`;
        })
        .join("\n");

      const moreText =
        analysis.totalCount > 20
          ? `\n\n... and ${analysis.totalCount - 20} more dependencies`
          : "";

      return {
        content: [
          {
            type: "text",
            text: `## Dependency Analysis\n\n**Total Dependencies:** ${analysis.totalCount}\n- Direct: ${analysis.direct}\n${analysis.transitive ? `- Transitive: ${analysis.transitive}` : ""}\n\n**By Package Manager:**\n${byManagerList}\n\n**Dependencies:**\n${depList}${moreText}\n\n**Next Steps:**\n- Check compatibility: \`dependency-check\`\n- View specific version: \`dependency-version\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze dependencies: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check dependency compatibility
   */
  @MCPTool({
    name: "dependency-check",
    description:
      "Check dependency compatibility (detect deprecated APIs, version conflicts)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to check for deprecated API usage",
        },
      },
      required: ["files"],
    },
  })
  async handleCheckCompatibility(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    try {
      const result = await this.dependencyService.checkCompatibility(
        args.files
      );

      if (result.isCompatible) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Dependency compatibility check passed!\n\n**Checked:**\n- Deprecated API usage\n- Version conflicts\n- Files analyzed: ${args.files.length}\n\nNo compatibility issues detected.`,
            },
          ],
        };
      }

      const sections = [];

      // Deprecation warnings
      if (result.deprecations.length > 0) {
        const deprecationsList = result.deprecations
          .map((d) => {
            const location = d.file ? `\n     File: ${d.file}:${d.line}` : "";
            const replacement = d.replacement
              ? `\n     💡 Use: ${d.replacement}`
              : "";
            const removal = d.removedIn ? ` (removed in ${d.removedIn})` : "";

            return `  ⚠️  **${d.package}**: ${d.api}\n     Deprecated in v${d.deprecatedIn}${removal}${location}${replacement}`;
          })
          .join("\n\n");

        sections.push(`### Deprecated APIs\n\n${deprecationsList}`);
      }

      // Version conflicts
      if (result.conflicts.length > 0) {
        const conflictsList = result.conflicts
          .map((c) => {
            const conflictDetails = c.conflicts
              .map(
                (conf) =>
                  `    - ${conf.name}: requires ${conf.requiredVersion}, current ${conf.currentVersion}`
              )
              .join("\n");

            return `  ❌ **${c.package}**\n${conflictDetails}\n     💡 ${c.suggestion || "Resolve version mismatch"}`;
          })
          .join("\n\n");

        sections.push(`### Version Conflicts\n\n${conflictsList}`);
      }

      // Outdated packages
      if (result.outdated.length > 0) {
        const outdatedList = result.outdated
          .map((o) => {
            const breakingTag = o.breaking ? " (BREAKING)" : "";
            return `  📦 ${o.name}: ${o.current} → ${o.latest}${breakingTag}`;
          })
          .join("\n");

        sections.push(`### Outdated Packages\n\n${outdatedList}`);
      }

      const errorCount =
        result.conflicts.length +
        result.deprecations.filter((d) => d.removedIn).length;

      return {
        content: [
          {
            type: "text",
            text: `⚠️  **Dependency Compatibility Issues**\n\n${sections.join("\n\n")}\n\n**Summary:**\n- Deprecations: ${result.deprecations.length}\n- Conflicts: ${result.conflicts.length}\n- Outdated: ${result.outdated.length}\n\n${errorCount > 0 ? "**REQUIRED ACTION**: Address critical issues before proceeding." : "**Warnings found**: Review and plan upgrades."}`,
          },
        ],
        isError: errorCount > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to check compatibility: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get version of a specific dependency
   */
  @MCPTool({
    name: "dependency-version",
    description: "Get the installed version of a specific package",
    inputSchema: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "Package name to query",
        },
      },
      required: ["package"],
    },
  })
  async handleGetVersion(args: { package: string }): Promise<MCPToolResult> {
    try {
      const version = await this.dependencyService.getDependencyVersion(
        args.package
      );

      if (!version) {
        return {
          content: [
            {
              type: "text",
              text: `Package '${args.package}' not found in project dependencies.\n\nRun \`dependency-analyze\` to see all dependencies.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `📦 **${args.package}**\n\nInstalled version: \`${version}\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get package version: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Suggest compatibility for adding a new dependency
   */
  @MCPTool({
    name: "dependency-suggest",
    description:
      "Check compatibility before adding a new dependency (detect potential conflicts)",
    inputSchema: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "Package name to add",
        },
        version: {
          type: "string",
          description:
            "Target version (optional, checks latest if not provided)",
        },
      },
      required: ["package"],
    },
  })
  async handleSuggestDependency(args: {
    package: string;
    version?: string;
  }): Promise<MCPToolResult> {
    try {
      const suggestion = await this.dependencyService.suggestDependency(
        args.package,
        args.version
      );

      if (suggestion.compatible && suggestion.warnings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Package '${args.package}' can be safely added.\n\n${suggestion.suggestedVersion ? `**Suggested version:** ${suggestion.suggestedVersion}` : ""}`,
            },
          ],
        };
      }

      const sections = [];

      if (suggestion.warnings.length > 0) {
        const warningsList = suggestion.warnings
          .map((w) => `  ⚠️  ${w}`)
          .join("\n");
        sections.push(`**Warnings:**\n${warningsList}`);
      }

      if (suggestion.conflicts.length > 0) {
        const conflictsList = suggestion.conflicts
          .map((c) => `  ❌ ${c}`)
          .join("\n");
        sections.push(`**Conflicts:**\n${conflictsList}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `📦 **Adding ${args.package}${args.version ? `@${args.version}` : ""}**\n\n${sections.join("\n\n")}\n\n${suggestion.compatible ? "**Status:** Can proceed with caution" : "**Status:** Conflicts detected - resolve before adding"}`,
          },
        ],
        isError: !suggestion.compatible,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to suggest dependency: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
