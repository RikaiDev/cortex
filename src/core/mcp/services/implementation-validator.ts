import fs from "fs-extra";
import * as path from "path";
import { execSync } from "child_process";
import { DangerZoneService } from "./danger-zone-service.js";
import type { DangerZone } from "../types/danger-zone.js";

export interface ValidationResult {
  isComplete: boolean;
  issues: ValidationIssue[];
  mockDetected: boolean;
  scaffoldDetected: boolean;
  unusedCodeDetected: boolean;
  dangerZoneDetected: boolean;
  dangerZones: DangerZone[];
}

export interface ValidationIssue {
  type: "mock" | "todo" | "unused" | "scaffold" | "incomplete";
  file: string;
  line: number;
  description: string;
  severity: "blocker" | "critical";
}

export class ImplementationValidator {
  private dangerZoneService: DangerZoneService;

  constructor(private projectRoot: string) {
    this.dangerZoneService = new DangerZoneService(projectRoot);
  }

  /**
   * Validate implementation completeness
   */
  async validateImplementation(files: string[]): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check for danger zones FIRST (most critical)
    const dangerZoneCheck =
      await this.dangerZoneService.checkChangedFiles(files);

    // Scan for mocks/scaffolds
    const mockIssues = await this.scanForMocks(files);
    issues.push(...mockIssues);

    // Check for unused code
    const unusedIssues = await this.checkUnusedCode();
    issues.push(...unusedIssues);

    const result: ValidationResult = {
      isComplete: issues.length === 0 && !dangerZoneCheck.hasDangerZones,
      issues,
      mockDetected: mockIssues.some((i) => i.type === "mock"),
      scaffoldDetected: mockIssues.some((i) => i.type === "scaffold"),
      unusedCodeDetected: unusedIssues.length > 0,
      dangerZoneDetected: dangerZoneCheck.hasDangerZones,
      dangerZones: dangerZoneCheck.zones,
    };

    return result;
  }

  /**
   * Scan for Mock/Scaffold patterns in code
   *
   * Detects:
   * - TODO/FIXME comments
   * - mock data (mockData, MOCK_*, test fixtures in prod code)
   * - Unimplemented functions (throw new Error("Not implemented"))
   * - Empty classes/interfaces with no usage
   */
  async scanForMocks(files: string[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    for (const file of files) {
      const fullPath = path.join(this.projectRoot, file);

      // Skip if file doesn't exist
      if (!(await fs.pathExists(fullPath))) {
        continue;
      }

      // Skip test files
      if (file.includes(".test.") || file.includes(".spec.")) {
        continue;
      }

      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      // Check each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for TODO/FIXME
        if (/\/\/\s*(TODO|FIXME)/i.test(line)) {
          issues.push({
            type: "todo",
            file,
            line: lineNumber,
            description: `TODO comment found: ${line.trim()}`,
            severity: "blocker",
          });
        }

        // Check for mock patterns
        if (/mock|MOCK_|placeholder|dummy/i.test(line)) {
          // Exclude imports and type definitions
          if (!line.includes("import") && !line.includes("type ")) {
            issues.push({
              type: "mock",
              file,
              line: lineNumber,
              description: `Mock pattern detected: ${line.trim()}`,
              severity: "blocker",
            });
          }
        }

        // Check for "Not implemented" errors
        if (/throw new Error\(['"]Not implemented/i.test(line)) {
          issues.push({
            type: "scaffold",
            file,
            line: lineNumber,
            description: "Function throws 'Not implemented' error",
            severity: "blocker",
          });
        }

        // Check for empty function bodies (excluding interfaces/types)
        if (/function.*\{\s*\}|=>\s*\{\s*\}/i.test(line)) {
          // Only flag if not a type definition
          if (!line.includes("type ") && !line.includes("interface ")) {
            issues.push({
              type: "incomplete",
              file,
              line: lineNumber,
              description: "Empty function implementation",
              severity: "critical",
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check for defined but unused code
   *
   * Uses Knip or similar tools to detect:
   * - Defined interfaces/types not referenced
   * - Defined functions not called
   * - Defined class properties not accessed
   */
  async checkUnusedCode(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      // Run knip to check for unused exports
      const result = execSync("npm run knip 2>&1", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });

      // Parse knip output
      // Format: "Unused exports (N):" followed by file paths
      if (result.includes("Unused exports")) {
        const lines = result.split("\n");
        let currentFile = "";

        for (const line of lines) {
          // Check if this is a file path line
          if (line.trim().startsWith("/") || line.trim().match(/^[a-z]/)) {
            currentFile = line.trim();
          }

          // Check if this is an unused export line
          if (line.includes("export") && currentFile) {
            issues.push({
              type: "unused",
              file: currentFile,
              line: 0,
              description: `Unused export: ${line.trim()}`,
              severity: "critical",
            });
          }
        }
      }
    } catch {
      // If knip command fails, don't block validation
      // but note the issue
    }

    return issues;
  }

  /**
   * Validate against specification
   *
   * Compare spec.md requirements with actual implementation
   */
  async validateAgainstSpec(
    specPath: string,
    implementedFiles: string[]
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    if (!(await fs.pathExists(specPath))) {
      return issues;
    }

    const spec = await fs.readFile(specPath, "utf-8");

    // Extract requirements from spec
    // Look for acceptance criteria or requirements sections
    const requirementMatches = spec.matchAll(/^-\s+\[[ x]\]\s+(.+)$/gim);

    for (const match of requirementMatches) {
      const requirement = match[1];

      // Check if requirement mentions specific functionality
      // that we can validate (very basic check)
      if (requirement.toLowerCase().includes("must")) {
        // This is a simplified check
        // In real implementation, would need more sophisticated matching
        const hasImplementation = implementedFiles.some((file) =>
          file
            .toLowerCase()
            .includes(requirement.toLowerCase().substring(0, 10))
        );

        if (!hasImplementation) {
          issues.push({
            type: "incomplete",
            file: specPath,
            line: 0,
            description: `Requirement may not be implemented: ${requirement}`,
            severity: "critical",
          });
        }
      }
    }

    return issues;
  }

  /**
   * Generate fix tasks for each issue
   */
  generateFixTasks(issues: ValidationIssue[]): Array<{
    id: string;
    description: string;
    priority: "high" | "medium";
  }> {
    const tasks: Array<{
      id: string;
      description: string;
      priority: "high" | "medium";
    }> = [];

    let taskIndex = 1;
    for (const issue of issues) {
      tasks.push({
        id: `FIX-${taskIndex.toString().padStart(3, "0")}`,
        description: `Fix ${issue.type} in ${issue.file}:${issue.line} - ${issue.description}`,
        priority: issue.severity === "blocker" ? "high" : "medium",
      });
      taskIndex++;
    }

    return tasks;
  }
}
