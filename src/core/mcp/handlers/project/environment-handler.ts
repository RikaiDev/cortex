/**
 * Environment Handler
 *
 * Handles environment profile management and compatibility checking
 */

import { EnvironmentService } from "../../services/environment-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { EnvironmentProfile } from "../../types/environment.js";

export class EnvironmentHandler {
  private environmentService: EnvironmentService;

  constructor(private projectRoot: string) {
    this.environmentService = new EnvironmentService(projectRoot);
  }

  /**
   * Auto-detect environments from project files
   */
  async handleDetectEnvironments(): Promise<MCPToolResult> {
    try {
      const result = await this.environmentService.autoDetect();

      if (result.environments.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No environments detected from project files.\n\n**Checked:**\n- package.json\n- Dockerfile\n- GitHub Actions workflows\n- Deployment configs (Vercel, Netlify)\n\n**To add manually:**\nUse \`environment-add\` tool to define environment profiles.`,
            },
          ],
        };
      }

      const envList = result.environments
        .map((env) => {
          const constraints = [];
          if (env.runtime?.node) constraints.push(`Node ${env.runtime.node}`);
          if (env.container?.isDocker) constraints.push("Docker");
          if (env.fileSystem?.readOnlyPaths) constraints.push("Read-only FS");

          return `**${env.name}**\n   Description: ${env.description}\n   Constraints: ${constraints.join(", ") || "None"}`;
        })
        .join("\n\n");

      const sourcesList = result.sources
        .map(
          (s) =>
            `- ${s.file} (${s.type}): ${s.detectedConstraints.join(", ") || "basic detection"}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## Auto-detected Environments\n\n${envList}\n\n**Detection Sources:**\n${sourcesList}\n\n**Next Steps:**\n- Review detected environments with \`environment-list\`\n- Add manually detected profiles with \`environment-add\`\n- Check code compatibility with \`environment-check\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to detect environments: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Add or update environment profile
   */
  async handleAddEnvironment(args: {
    name: string;
    description?: string;
    nodeVersion?: string;
    envVarsMissing?: string[];
    constraints?: string[];
  }): Promise<MCPToolResult> {
    try {
      const profile: EnvironmentProfile = {
        name: args.name,
        description: args.description,
        source: "manual",
        runtime: {},
        envVars: {},
        constraints: args.constraints,
      };

      if (args.nodeVersion) {
        profile.runtime!.node = args.nodeVersion;
      }

      if (args.envVarsMissing && args.envVarsMissing.length > 0) {
        profile.envVars!.missing = args.envVarsMissing;
      }

      await this.environmentService.upsertEnvironment(profile);

      return {
        content: [
          {
            type: "text",
            text: `✅ Environment profile '${args.name}' saved!\n\n**Configuration:**\n- Description: ${args.description || "N/A"}\n- Node version: ${args.nodeVersion || "N/A"}\n- Missing env vars: ${args.envVarsMissing?.join(", ") || "None"}\n- Constraints: ${args.constraints?.join(", ") || "None"}\n\n**Saved to:** .cortex/environments.json\n\nUse \`environment-check\` to validate code against this environment.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to add environment: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Remove environment profile
   */
  async handleRemoveEnvironment(args: {
    name: string;
  }): Promise<MCPToolResult> {
    try {
      await this.environmentService.removeEnvironment(args.name);

      return {
        content: [
          {
            type: "text",
            text: `✅ Environment profile '${args.name}' removed.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to remove environment: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * List all environment profiles
   */
  async handleListEnvironments(): Promise<MCPToolResult> {
    try {
      const environments = await this.environmentService.listEnvironments();

      if (environments.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No environment profiles configured.\n\n**To get started:**\n1. Run \`environment-detect\` to auto-detect from project files\n2. Or use \`environment-add\` to manually define profiles`,
            },
          ],
        };
      }

      const envList = environments
        .map((env, idx) => {
          const details = [];

          if (env.runtime?.node) details.push(`Node ${env.runtime.node}`);
          if (env.runtime?.python) details.push(`Python ${env.runtime.python}`);

          if (env.container?.isDocker) {
            details.push("Docker");
            if (env.container.workDir) details.push(`WorkDir: ${env.container.workDir}`);
          }

          if (env.envVars?.missing && env.envVars.missing.length > 0) {
            details.push(`Missing vars: ${env.envVars.missing.join(", ")}`);
          }

          if (env.fileSystem?.readOnlyPaths) {
            details.push("Read-only filesystem");
          }

          if (env.constraints && env.constraints.length > 0) {
            details.push(...env.constraints);
          }

          return `${idx + 1}. **${env.name}** ${env.isDefault ? "(default)" : ""}\n   ${env.description || "No description"}\n   Source: ${env.source}\n   ${details.length > 0 ? `Details: ${details.join(" • ")}` : ""}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `## Environment Profiles (${environments.length})\n\n${envList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list environments: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check code compatibility with environment profiles
   */
  async handleCheckCompatibility(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    try {
      const result =
        await this.environmentService.checkCompatibility(args.files);

      if (result.isCompatible) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Environment compatibility check passed!\n\n**Checked environments:** ${result.environments.join(", ")}\n**Files checked:** ${args.files.length}\n\nNo compatibility issues detected.`,
            },
          ],
        };
      }

      // Group warnings by environment
      const warningsByEnv = result.warnings.reduce(
        (acc, warning) => {
          if (!acc[warning.environment]) {
            acc[warning.environment] = [];
          }
          acc[warning.environment].push(warning);
          return acc;
        },
        {} as Record<string, typeof result.warnings>
      );

      const warningsText = Object.entries(warningsByEnv)
        .map(([env, warnings]) => {
          const warningsList = warnings
            .map((w) => {
              const icon =
                w.severity === "error" ? "❌" : w.severity === "warning" ? "⚠️" : "ℹ️";
              return `  ${icon} **${w.type}**: ${w.message}\n     ${w.location ? `File: ${w.location.file}` : ""}\n     ${w.suggestion ? `💡 ${w.suggestion}` : ""}`;
            })
            .join("\n\n");

          return `### ${env}\n\n${warningsList}`;
        })
        .join("\n\n");

      const errorCount = result.warnings.filter(
        (w) => w.severity === "error"
      ).length;

      return {
        content: [
          {
            type: "text",
            text: `⚠️  **Environment Compatibility Issues Detected**\n\n${warningsText}\n\n**Summary:**\n- Errors: ${errorCount}\n- Warnings: ${result.warnings.length - errorCount}\n- Environments checked: ${result.environments.join(", ")}\n\n${errorCount > 0 ? "**REQUIRED ACTION**: Fix all errors before deploying to these environments." : "**Warnings found**: Review and address if applicable."}`,
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
}
