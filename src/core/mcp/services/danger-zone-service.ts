/**
 * Danger Zone Service
 *
 * Manages protected code regions that should not be modified without explicit confirmation
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  DangerZone,
  DangerZoneConfig,
  DangerZoneCheckResult,
} from "../types/danger-zone.js";

export class DangerZoneService {
  private configPath: string;

  constructor(private projectRoot: string) {
    this.configPath = path.join(projectRoot, ".cortex", "danger-zones.json");
  }

  /**
   * Get all danger zones from both comments and config
   */
  async getAllDangerZones(): Promise<DangerZone[]> {
    const configZones = await this.loadConfigMarkers();
    // Comment scanning would require parsing all files, which is expensive
    // For now, we rely on config-based marking and real-time comment scanning when checking files
    return configZones;
  }

  /**
   * Load danger zones from config file
   */
  async loadConfigMarkers(): Promise<DangerZone[]> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        return [];
      }

      const config: DangerZoneConfig = await fs.readJson(this.configPath);
      return config.zones.map((zone) => ({
        file: zone.file,
        startLine: zone.startLine || 1,
        endLine: zone.endLine,
        reason: zone.reason,
        markedBy: "config" as const,
        createdAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Failed to load danger zones config:", error);
      return [];
    }
  }

  /**
   * Scan a file for comment-based danger zone markers
   * Supports: // @cortex-protected, /* @cortex-protected *\/, # @cortex-protected
   */
  async scanCommentMarkers(filePath: string): Promise<DangerZone[]> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.projectRoot, filePath);

      if (!(await fs.pathExists(absolutePath))) {
        return [];
      }

      const content = await fs.readFile(absolutePath, "utf-8");
      const lines = content.split("\n");
      const zones: DangerZone[] = [];

      // Pattern: // @cortex-protected: reason
      const singleLinePattern =
        /(?:\/\/|#|\/\*)\s*@cortex-protected:\s*(.+?)(?:\*\/)?$/;

      // Pattern: // @cortex-protected-start: reason
      const startPattern =
        /(?:\/\/|#|\/\*)\s*@cortex-protected-start:\s*(.+?)(?:\*\/)?$/;

      // Pattern: // @cortex-protected-end
      const endPattern = /(?:\/\/|#|\/\*)\s*@cortex-protected-end/;

      let currentZone: { startLine: number; reason: string } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Check for single-line protection
        const singleMatch = line.match(singleLinePattern);
        if (singleMatch && !currentZone) {
          zones.push({
            file: path.relative(this.projectRoot, absolutePath),
            startLine: lineNumber,
            endLine: lineNumber,
            reason: singleMatch[1].trim(),
            markedBy: "comment",
            createdAt: new Date().toISOString(),
          });
          continue;
        }

        // Check for zone start
        const startMatch = line.match(startPattern);
        if (startMatch && !currentZone) {
          currentZone = {
            startLine: lineNumber,
            reason: startMatch[1].trim(),
          };
          continue;
        }

        // Check for zone end
        if (endPattern.test(line) && currentZone) {
          zones.push({
            file: path.relative(this.projectRoot, absolutePath),
            startLine: currentZone.startLine,
            endLine: lineNumber,
            reason: currentZone.reason,
            markedBy: "comment",
            createdAt: new Date().toISOString(),
          });
          currentZone = null;
        }
      }

      // If a zone was started but not closed, protect to end of file
      if (currentZone) {
        zones.push({
          file: path.relative(this.projectRoot, absolutePath),
          startLine: currentZone.startLine,
          endLine: lines.length,
          reason: currentZone.reason,
          markedBy: "comment",
          createdAt: new Date().toISOString(),
        });
      }

      return zones;
    } catch (error) {
      console.error(`Failed to scan danger zones in ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Check if changed files intersect with any danger zones
   */
  async checkChangedFiles(
    changedFiles: string[]
  ): Promise<DangerZoneCheckResult> {
    const allZones: DangerZone[] = [];

    // Load config-based zones
    const configZones = await this.loadConfigMarkers();

    // Scan each changed file for comment-based zones
    for (const file of changedFiles) {
      const commentZones = await this.scanCommentMarkers(file);
      allZones.push(...commentZones);
    }

    // Check if any changed files match config zones
    for (const zone of configZones) {
      if (changedFiles.includes(zone.file)) {
        allZones.push(zone);
      }
    }

    if (allZones.length === 0) {
      return {
        hasDangerZones: false,
        zones: [],
      };
    }

    // Generate warning message
    const message = this.formatDangerZoneWarning(allZones);

    return {
      hasDangerZones: true,
      zones: allZones,
      message,
    };
  }

  /**
   * Format danger zone warning message
   */
  private formatDangerZoneWarning(zones: DangerZone[]): string {
    const lines = [
      "⚠️  DANGER ZONE DETECTED - PROTECTED CODE REGIONS",
      "",
      "The following protected regions will be affected by your changes:",
      "",
    ];

    for (const zone of zones) {
      const location =
        zone.endLine && zone.endLine !== zone.startLine
          ? `${zone.file}:${zone.startLine}-${zone.endLine}`
          : `${zone.file}:${zone.startLine}`;

      lines.push(`📍 ${location}`);
      lines.push(`   Reason: ${zone.reason}`);
      lines.push(`   Source: ${zone.markedBy === "comment" ? "Code comment" : "Config file"}`);
      lines.push("");
    }

    lines.push(
      "⚠️  These regions are marked as protected and should not be modified without careful consideration."
    );
    lines.push(
      "   Please confirm with the user before proceeding with changes to these areas."
    );

    return lines.join("\n");
  }

  /**
   * Mark a new danger zone in config
   */
  async markDangerZone(zone: {
    file: string;
    startLine?: number;
    endLine?: number;
    reason: string;
  }): Promise<void> {
    // Ensure .cortex directory exists
    const cortexDir = path.dirname(this.configPath);
    await fs.ensureDir(cortexDir);

    // Load existing config or create new
    let config: DangerZoneConfig = { zones: [] };
    if (await fs.pathExists(this.configPath)) {
      config = await fs.readJson(this.configPath);
    }

    // Add new zone
    config.zones.push({
      file: zone.file,
      startLine: zone.startLine,
      endLine: zone.endLine,
      reason: zone.reason,
    });

    // Save config
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  /**
   * Remove a danger zone from config
   */
  async unmarkDangerZone(file: string, line?: number): Promise<void> {
    if (!(await fs.pathExists(this.configPath))) {
      return;
    }

    const config: DangerZoneConfig = await fs.readJson(this.configPath);

    // Filter out matching zones
    config.zones = config.zones.filter((zone) => {
      if (zone.file !== file) return true;

      // If line specified, only remove zones that include that line
      if (line !== undefined) {
        const start = zone.startLine || 1;
        const end = zone.endLine || start;
        return !(line >= start && line <= end);
      }

      // If no line specified, remove all zones for this file
      return false;
    });

    // Save updated config
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  /**
   * Get danger zones for a specific file
   */
  async getFilesDangerZones(filePath: string): Promise<DangerZone[]> {
    const configZones = await this.loadConfigMarkers();
    const commentZones = await this.scanCommentMarkers(filePath);

    const relativePath = path.relative(this.projectRoot, filePath);

    // Combine and filter for this file
    return [
      ...configZones.filter((z) => z.file === relativePath),
      ...commentZones,
    ];
  }
}
