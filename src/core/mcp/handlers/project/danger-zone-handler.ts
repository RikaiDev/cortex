/**
 * Danger Zone Handler
 *
 * Handles marking and unmarking protected code regions
 */

import { MCPTool } from "../../decorators/index.js";
import { DangerZoneService } from "../../services/danger-zone-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class DangerZoneHandler {
  private dangerZoneService: DangerZoneService;

  constructor(private projectRoot: string) {
    this.dangerZoneService = new DangerZoneService(projectRoot);
  }

  /**
   * Mark a code region as protected (danger zone)
   */
  @MCPTool({
    name: "mark-danger",
    description:
      "Mark a code region as protected (danger zone) that should not be modified without explicit user confirmation. Can mark entire files or specific line ranges.",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "File path relative to project root",
        },
        startLine: {
          type: "number",
          description:
            "Starting line number (optional, protects entire file if not provided)",
        },
        endLine: {
          type: "number",
          description:
            "Ending line number (optional, single line if not provided)",
        },
        reason: {
          type: "string",
          description:
            "Why this region is protected (e.g., 'Production config - manually tuned', 'Critical auth logic')",
        },
      },
      required: ["file", "reason"],
    },
  })
  async handleMarkDanger(args: {
    file: string;
    startLine?: number;
    endLine?: number;
    reason: string;
  }): Promise<MCPToolResult> {
    try {
      await this.dangerZoneService.markDangerZone({
        file: args.file,
        startLine: args.startLine,
        endLine: args.endLine,
        reason: args.reason,
      });

      const location = args.startLine
        ? args.endLine && args.endLine !== args.startLine
          ? `${args.file}:${args.startLine}-${args.endLine}`
          : `${args.file}:${args.startLine}`
        : args.file;

      return {
        content: [
          {
            type: "text",
            text: `✅ Danger zone marked successfully!\n\n📍 **Protected Region**: ${location}\n💬 **Reason**: ${args.reason}\n\nThis region is now protected and will trigger warnings if AI attempts to modify it.\n\n**Configuration saved to**: .cortex/danger-zones.json\n\n**Alternative**: You can also mark regions using comments in your code:\n\`\`\`\n// @cortex-protected: ${args.reason}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to mark danger zone: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Remove danger zone protection from a region
   */
  @MCPTool({
    name: "unmark-danger",
    description: "Remove danger zone protection from a code region",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "File path relative to project root",
        },
        line: {
          type: "number",
          description:
            "Specific line number (optional, removes all protections for file if not provided)",
        },
      },
      required: ["file"],
    },
  })
  async handleUnmarkDanger(args: {
    file: string;
    line?: number;
  }): Promise<MCPToolResult> {
    try {
      await this.dangerZoneService.unmarkDangerZone(args.file, args.line);

      const location = args.line ? `${args.file}:${args.line}` : args.file;

      return {
        content: [
          {
            type: "text",
            text: `✅ Danger zone removed successfully!\n\n📍 **Unprotected Region**: ${location}\n\nThis region is no longer protected.\n\n**Note**: If this region was marked with comments in code, you'll need to remove those comments manually.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to unmark danger zone: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * List all protected danger zones
   */
  @MCPTool({
    name: "list-dangers",
    description:
      "List all protected danger zones (from both config and code comments)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleListDangerZones(): Promise<MCPToolResult> {
    try {
      const zones = await this.dangerZoneService.getAllDangerZones();

      if (zones.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No danger zones configured.\n\n**To protect code regions**:\n1. Use \`cortex.mark-danger\` tool\n2. Add comments in code: \`// @cortex-protected: reason\`\n3. Edit \`.cortex/danger-zones.json\` directly`,
            },
          ],
        };
      }

      const zonesList = zones
        .map((zone, idx) => {
          const location =
            zone.endLine && zone.endLine !== zone.startLine
              ? `${zone.file}:${zone.startLine}-${zone.endLine}`
              : `${zone.file}:${zone.startLine}`;

          return `${idx + 1}. 📍 **${location}**\n   💬 Reason: ${zone.reason}\n   📌 Source: ${zone.markedBy === "comment" ? "Code comment" : "Config file"}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `## Protected Danger Zones (${zones.length})\n\n${zonesList}\n\n⚠️  These regions will trigger warnings if AI attempts to modify them.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list danger zones: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
