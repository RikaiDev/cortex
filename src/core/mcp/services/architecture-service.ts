/**
 * Architecture Validation Service
 *
 * Validates architecture rules, layer boundaries, naming conventions,
 * and file organization patterns
 */

import { promises as fs } from "fs";
import * as path from "path";
import {
  ArchitectureConfig,
  ArchitectureValidationResult,
  ArchitectureViolation,
  ArchitectureValidationOptions,
  FileCheckResult,
  FileLayerInfo,
  ImportInfo,
  PlacementSuggestion,
  LayerStats,
  ViolationSeverity,
  ViolationType,
  DEFAULT_ARCHITECTURE_CONFIG,
} from "../types/architecture.js";

/**
 * Service for validating architecture rules and layer boundaries.
 *
 * Checks import dependencies, naming conventions, and file organization
 * against configurable architecture rules.
 */
export class ArchitectureService {
  private config: ArchitectureConfig | null = null;
  private configPath: string;

  /**
   * @param projectRoot - Root directory of the project
   */
  constructor(private projectRoot: string) {
    this.configPath = path.join(projectRoot, ".cortex", "architecture.json");
  }

  /**
   * Load architecture configuration
   */
  async loadConfig(): Promise<ArchitectureConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(content) as ArchitectureConfig;
      // Merge with defaults for any missing fields
      this.config = this.mergeWithDefaults(this.config);
    } catch {
      // Use default configuration
      this.config = DEFAULT_ARCHITECTURE_CONFIG;
    }

    return this.config;
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(
    userConfig: Partial<ArchitectureConfig>
  ): ArchitectureConfig {
    return {
      layers: { ...DEFAULT_ARCHITECTURE_CONFIG.layers, ...userConfig.layers },
      naming: { ...DEFAULT_ARCHITECTURE_CONFIG.naming, ...userConfig.naming },
      fileOrganization:
        userConfig.fileOrganization ||
        DEFAULT_ARCHITECTURE_CONFIG.fileOrganization,
      excludePaths:
        userConfig.excludePaths || DEFAULT_ARCHITECTURE_CONFIG.excludePaths,
      customRules: userConfig.customRules || [],
    };
  }

  /**
   * Validate entire project architecture
   */
  async validateArchitecture(
    options: ArchitectureValidationOptions = {}
  ): Promise<ArchitectureValidationResult> {
    const config = await this.loadConfig();
    const violations: ArchitectureViolation[] = [];
    const layerStatsMap = new Map<string, LayerStats>();

    // Initialize layer stats
    for (const layer of Object.keys(config.layers)) {
      layerStatsMap.set(layer, {
        layer,
        fileCount: 0,
        violationCount: 0,
        forbiddenImports: 0,
      });
    }

    // Get all TypeScript files
    const files = await this.getSourceFiles();
    let filesWithViolations = 0;

    for (const file of files) {
      const fileResult = await this.checkFile(file);

      // Update layer stats
      if (fileResult.layer) {
        const stats = layerStatsMap.get(fileResult.layer);
        if (stats) {
          stats.fileCount++;
          if (fileResult.violations.length > 0) {
            stats.violationCount += fileResult.violations.length;
            filesWithViolations++;
          }
          // Count forbidden imports
          const layerViolations = fileResult.violations.filter(
            (v) => v.type === "layer-violation"
          );
          stats.forbiddenImports += layerViolations.length;
        }
      }

      // Filter violations by severity if specified
      let fileViolations = fileResult.violations;
      if (options.minSeverity) {
        fileViolations = this.filterBySeverity(
          fileViolations,
          options.minSeverity
        );
      }

      // Filter by layer if specified
      if (options.layers && options.layers.length > 0) {
        if (!fileResult.layer || !options.layers.includes(fileResult.layer)) {
          continue;
        }
      }

      violations.push(...fileViolations);

      // Check max violations limit
      if (options.maxViolations && violations.length >= options.maxViolations) {
        break;
      }
    }

    // Calculate statistics
    const bySeverity: Record<ViolationSeverity, number> = {
      error: 0,
      warning: 0,
      info: 0,
    };
    const byType: Record<ViolationType, number> = {
      "layer-violation": 0,
      "naming-convention": 0,
      "file-organization": 0,
      "circular-dependency": 0,
      "forbidden-import": 0,
      "custom-rule": 0,
    };

    for (const v of violations) {
      bySeverity[v.severity]++;
      byType[v.type]++;
    }

    return {
      isValid: violations.filter((v) => v.severity === "error").length === 0,
      totalFiles: files.length,
      filesWithViolations,
      violations,
      bySeverity,
      byType,
      layerStats: Array.from(layerStatsMap.values()),
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check a single file against architecture rules
   */
  async checkFile(filePath: string): Promise<FileCheckResult> {
    const config = await this.loadConfig();
    const violations: ArchitectureViolation[] = [];
    const relativePath = path.relative(this.projectRoot, filePath);

    // Get file layer info
    const layerInfo = await this.getFileLayerInfo(filePath);
    const layer = layerInfo.layer;

    // Check layer violations (imports)
    if (layer) {
      const layerRule = config.layers[layer];
      if (layerRule) {
        for (const imp of layerInfo.imports) {
          if (imp.targetLayer) {
            // Check if import is allowed
            const isAllowed = this.isImportAllowed(
              layer,
              imp.targetLayer,
              layerRule
            );
            if (!isAllowed) {
              violations.push({
                type: "layer-violation",
                severity: "error",
                file: relativePath,
                line: imp.line,
                message: `Layer '${layer}' cannot import from layer '${imp.targetLayer}'`,
                rule: `layers.${layer}.cannotImport`,
                suggestion: `Move shared code to a common layer or restructure the dependency`,
              });
            }
          }
        }
      }
    }

    // Check naming conventions
    const namingResult = this.checkNamingConvention(relativePath, config);
    if (!namingResult.isValid && namingResult.expectedPattern) {
      violations.push({
        type: "naming-convention",
        severity: "warning",
        file: relativePath,
        message: `File name does not match expected pattern: ${namingResult.expectedPattern}`,
        rule: "naming",
        suggestion: `Rename file to match pattern: ${namingResult.expectedPattern}`,
      });
    }

    // Check file organization
    const orgResult = this.checkFileOrganization(relativePath, config);
    if (!orgResult.isValid && orgResult.expectedPath) {
      violations.push({
        type: "file-organization",
        severity: "warning",
        file: relativePath,
        message: `File is not in expected location: ${orgResult.expectedPath}`,
        rule: "fileOrganization",
        suggestion: `Move file to: ${orgResult.expectedPath}`,
      });
    }

    // Check custom rules
    if (config.customRules) {
      const customViolations = await this.checkCustomRules(
        filePath,
        relativePath,
        config.customRules
      );
      violations.push(...customViolations);
    }

    return {
      file: relativePath,
      layer,
      isValid: violations.filter((v) => v.severity === "error").length === 0,
      violations,
      imports: layerInfo.imports,
      namingStatus: namingResult,
      organizationStatus: orgResult,
    };
  }

  /**
   * Suggest correct placement for a file
   */
  async suggestPlacement(filePath: string): Promise<PlacementSuggestion> {
    const config = await this.loadConfig();
    const relativePath = path.relative(this.projectRoot, filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    // Detect file type based on name and content
    const detectedType = this.detectFileType(fileName);

    // Find matching layer based on content analysis
    const content = await this.safeReadFile(filePath);
    const suggestedLayer = this.detectSuggestedLayer(fileName, content);

    // Generate suggested path
    const suggestedPath = this.generateSuggestedPath(
      detectedType,
      suggestedLayer,
      config
    );

    // Generate suggested name if needed
    const suggestedName = this.generateSuggestedName(baseName, detectedType);

    // Calculate confidence
    const confidence = this.calculatePlacementConfidence(
      relativePath,
      suggestedPath,
      detectedType
    );

    // Generate alternatives
    const alternatives = this.generateAlternatives(
      detectedType,
      suggestedLayer,
      config
    );

    return {
      originalFile: relativePath,
      detectedType,
      suggestedLayer,
      suggestedPath,
      suggestedName: suggestedName + ext,
      reason: this.generatePlacementReason(detectedType, suggestedLayer),
      confidence,
      alternatives,
    };
  }

  /** Directories to exclude from scanning */
  private static readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".next",
    ".cache",
  ];

  /**
   * Get all source files for validation
   */
  private async getSourceFiles(): Promise<string[]> {
    const results: string[] = [];
    await this.walkDirectory(this.projectRoot, results);
    return results;
  }

  /**
   * Recursively walk directory to find TypeScript files
   */
  private async walkDirectory(dir: string, results: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!ArchitectureService.EXCLUDE_DIRS.includes(entry.name)) {
            await this.walkDirectory(fullPath, results);
          }
        } else if (this.isSourceFile(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch {
      // Ignore directories we can't read
    }
  }

  /**
   * Check if file is a TypeScript source file
   */
  private isSourceFile(fileName: string): boolean {
    return (
      (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) &&
      !fileName.endsWith(".d.ts")
    );
  }

  /**
   * Get layer information for a file
   */
  private async getFileLayerInfo(filePath: string): Promise<FileLayerInfo> {
    const config = await this.loadConfig();
    const relativePath = path.relative(this.projectRoot, filePath);
    const imports = await this.parseImports(filePath);

    // Detect file's layer
    let layer: string | null = null;
    let matchedPattern: string | null = null;

    for (const [layerName, layerRule] of Object.entries(config.layers)) {
      for (const pattern of layerRule.patterns) {
        if (this.matchPattern(relativePath, pattern)) {
          layer = layerName;
          matchedPattern = pattern;
          break;
        }
      }
      if (layer) break;
    }

    // Detect target layers for imports
    for (const imp of imports) {
      imp.targetLayer = this.detectImportLayer(imp.module, config);
    }

    return {
      file: relativePath,
      layer,
      imports,
      matchedPattern,
    };
  }

  /**
   * Parse imports from a TypeScript file
   */
  private async parseImports(filePath: string): Promise<ImportInfo[]> {
    const content = await this.safeReadFile(filePath);
    if (!content) return [];

    const imports: ImportInfo[] = [];
    const lines = content.split("\n");

    // Match various import patterns
    const importPatterns = [
      /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of importPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const module = match[1];
          imports.push({
            raw: match[0],
            module,
            line: i + 1,
            isRelative: module.startsWith("."),
            targetLayer: null, // Will be filled later
          });
        }
      }
    }

    return imports;
  }

  /**
   * Detect which layer an import belongs to
   */
  private detectImportLayer(
    modulePath: string,
    config: ArchitectureConfig
  ): string | null {
    // Skip external modules
    if (!modulePath.startsWith(".") && !modulePath.startsWith("/")) {
      return null;
    }

    // Normalize path
    const normalized = modulePath.replace(/\.(js|ts|tsx)$/, "");

    for (const [layerName, layerRule] of Object.entries(config.layers)) {
      for (const pattern of layerRule.patterns) {
        // Convert pattern to work with import paths
        const importPattern = pattern
          .replace("src/", "")
          .replace("**/*", "")
          .replace("/**", "");
        if (normalized.includes(importPattern.replace("**/", ""))) {
          return layerName;
        }
      }
    }

    return null;
  }

  /**
   * Check if import is allowed based on layer rules
   */
  private isImportAllowed(
    sourceLayer: string,
    targetLayer: string,
    rule: { canImportFrom: string[]; cannotImport: string[] }
  ): boolean {
    // Same layer is always allowed
    if (sourceLayer === targetLayer) {
      return true;
    }

    // Check cannotImport first (takes precedence)
    if (rule.cannotImport.includes(targetLayer)) {
      return false;
    }

    // Check if explicitly allowed
    if (rule.canImportFrom.includes(targetLayer)) {
      return true;
    }

    // If canImportFrom is empty, allow all except those in cannotImport
    if (rule.canImportFrom.length === 0) {
      return true;
    }

    // Not in allowed list
    return false;
  }

  /**
   * Check naming convention
   */
  private checkNamingConvention(
    filePath: string,
    config: ArchitectureConfig
  ): { isValid: boolean; expectedPattern?: string; matchedConvention?: string } {
    const fileName = path.basename(filePath);

    for (const [name, convention] of Object.entries(config.naming)) {
      const patterns = convention.pattern.split("|");
      for (const pattern of patterns) {
        if (this.matchGlobPattern(fileName, pattern)) {
          return { isValid: true, matchedConvention: name };
        }
      }
    }

    // Check if file type has expected naming
    if (fileName.endsWith("-service.ts")) {
      const expected = config.naming.services?.pattern;
      if (expected && !this.matchGlobPattern(fileName, expected)) {
        return { isValid: false, expectedPattern: expected };
      }
    }

    if (fileName.endsWith("-handler.ts")) {
      const expected = config.naming.handlers?.pattern;
      if (expected && !this.matchGlobPattern(fileName, expected)) {
        return { isValid: false, expectedPattern: expected };
      }
    }

    // Default to valid if no specific convention applies
    return { isValid: true };
  }

  /**
   * Check file organization
   */
  private checkFileOrganization(
    filePath: string,
    config: ArchitectureConfig
  ): { isValid: boolean; expectedPath?: string; matchedRule?: string } {
    const fileName = path.basename(filePath);

    for (const rule of config.fileOrganization) {
      if (this.matchGlobPattern(fileName, rule.filePattern)) {
        const pathPatterns = rule.requiredPath.split("|");
        const isInCorrectPath = pathPatterns.some((p) =>
          this.matchPattern(filePath, p)
        );

        if (!isInCorrectPath) {
          return {
            isValid: false,
            expectedPath: rule.requiredPath,
          };
        }

        return { isValid: true, matchedRule: rule.filePattern };
      }
    }

    return { isValid: true };
  }

  /**
   * Check custom rules
   */
  private async checkCustomRules(
    filePath: string,
    relativePath: string,
    rules: ArchitectureConfig["customRules"]
  ): Promise<ArchitectureViolation[]> {
    if (!rules) return [];

    const violations: ArchitectureViolation[] = [];
    const content = await this.safeReadFile(filePath);

    for (const rule of rules) {
      // Check file pattern match
      if (!this.matchPattern(relativePath, rule.filePattern)) {
        continue;
      }

      // Check content pattern
      if (rule.contentPattern && content) {
        const regex = new RegExp(rule.contentPattern, "g");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            violations.push({
              type: "custom-rule",
              severity: rule.severity,
              file: relativePath,
              line: i + 1,
              message: rule.description,
              rule: rule.id,
              suggestion: `Review and fix according to: ${rule.name}`,
            });
          }
        }
      }

      // Check disallowed import
      if (rule.disallowImport && content) {
        const importRegex = new RegExp(
          `import.*from.*['"].*${rule.disallowImport}.*['"]`,
          "g"
        );
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (importRegex.test(lines[i])) {
            violations.push({
              type: "forbidden-import",
              severity: rule.severity,
              file: relativePath,
              line: i + 1,
              message: `Forbidden import matching: ${rule.disallowImport}`,
              rule: rule.id,
              suggestion: `Remove or replace this import`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Detect file type based on naming
   */
  private detectFileType(fileName: string): string {
    if (fileName.endsWith("-service.ts")) return "service";
    if (fileName.endsWith("-handler.ts")) return "handler";
    if (fileName.endsWith(".test.ts") || fileName.endsWith(".spec.ts"))
      return "test";
    if (fileName.endsWith(".d.ts")) return "type-definition";
    if (fileName.includes("type") || fileName.includes("interface"))
      return "types";
    if (fileName.includes("util") || fileName.includes("helper"))
      return "utility";
    if (fileName.includes("component")) return "component";
    if (fileName.includes("hook")) return "hook";
    if (fileName.endsWith("index.ts")) return "barrel";
    return "module";
  }

  /**
   * Detect suggested layer based on content
   */
  private detectSuggestedLayer(fileName: string, content: string): string {
    const fileType = this.detectFileType(fileName);

    // Check content for layer hints
    if (content.includes("React") || content.includes("jsx")) {
      return "ui";
    }
    if (
      content.includes("database") ||
      content.includes("prisma") ||
      content.includes("mongoose")
    ) {
      return "infrastructure";
    }
    if (fileType === "service" || fileType === "handler") {
      return "core";
    }
    if (fileType === "types" || fileType === "type-definition") {
      return "types";
    }
    if (fileType === "utility") {
      return "utils";
    }

    // Default to core
    return "core";
  }

  /**
   * Generate suggested path
   */
  private generateSuggestedPath(
    fileType: string,
    layer: string,
    config: ArchitectureConfig
  ): string {
    const layerRule = config.layers[layer];
    if (!layerRule || layerRule.patterns.length === 0) {
      return `src/${layer}`;
    }

    // Get first pattern and make it concrete
    const pattern = layerRule.patterns[0];
    const basePath = pattern.replace("/**", "").replace("**/*", "").replace("**/", "");

    // Add subdirectory based on file type
    switch (fileType) {
      case "service":
        return `${basePath}/services`;
      case "handler":
        return `${basePath}/handlers`;
      case "test":
        return `${basePath}/__tests__`;
      default:
        return basePath;
    }
  }

  /**
   * Generate suggested name
   */
  private generateSuggestedName(baseName: string, fileType: string): string {
    // Check if name already follows convention
    if (fileType === "service" && !baseName.endsWith("-service")) {
      return `${baseName}-service`;
    }
    if (fileType === "handler" && !baseName.endsWith("-handler")) {
      return `${baseName}-handler`;
    }

    return baseName;
  }

  /**
   * Calculate placement confidence
   */
  private calculatePlacementConfidence(
    currentPath: string,
    suggestedPath: string,
    fileType: string
  ): "high" | "medium" | "low" {
    // If current path contains suggested path parts, high confidence
    if (currentPath.includes(suggestedPath.split("/").pop() || "")) {
      return "high";
    }

    // Known file types have higher confidence
    if (["service", "handler", "test", "types"].includes(fileType)) {
      return "high";
    }

    if (["utility", "component"].includes(fileType)) {
      return "medium";
    }

    return "low";
  }

  /**
   * Generate alternative suggestions
   */
  private generateAlternatives(
    fileType: string,
    suggestedLayer: string,
    config: ArchitectureConfig
  ): Array<{ path: string; reason: string }> {
    const alternatives: Array<{ path: string; reason: string }> = [];

    // Suggest related layers
    for (const [layerName, layerRule] of Object.entries(config.layers)) {
      if (layerName === suggestedLayer) continue;

      // Only suggest layers that make sense for the file type
      if (
        fileType === "service" &&
        (layerName === "core" || layerName === "infrastructure")
      ) {
        const pattern = layerRule.patterns[0] || `src/${layerName}`;
        alternatives.push({
          path: pattern.replace("/**", "/services"),
          reason: `Alternative: Place in ${layerName} layer for different concerns`,
        });
      }
    }

    return alternatives.slice(0, 2);
  }

  /**
   * Generate placement reason
   */
  private generatePlacementReason(fileType: string, layer: string): string {
    const reasons: Record<string, string> = {
      service: `Services belong in the ${layer} layer for business logic`,
      handler: `Handlers belong in the ${layer} layer for request processing`,
      test: `Test files should be co-located or in __tests__ directories`,
      types: `Type definitions belong in the types layer for shared contracts`,
      utility: `Utilities belong in the utils layer for reusable helpers`,
      component: `Components belong in the ui layer for presentation`,
    };

    return reasons[fileType] || `Based on file analysis, ${layer} is appropriate`;
  }

  /**
   * Filter violations by minimum severity
   */
  private filterBySeverity(
    violations: ArchitectureViolation[],
    minSeverity: ViolationSeverity
  ): ArchitectureViolation[] {
    const severityOrder: ViolationSeverity[] = ["info", "warning", "error"];
    const minIndex = severityOrder.indexOf(minSeverity);

    return violations.filter(
      (v) => severityOrder.indexOf(v.severity) >= minIndex
    );
  }

  /**
   * Match file path against glob pattern
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Use placeholder for ** to prevent single * replacement from affecting it
    const regex = pattern
      .replace(/\*\*/g, "<<<GLOBSTAR>>>")   // Temporarily replace **
      .replace(/\*/g, "[^/]*")               // Replace single *
      .replace(/<<<GLOBSTAR>>>/g, ".*")      // Replace ** placeholder with .*
      .replace(/\//g, "\\/");                // Escape slashes

    return new RegExp(`^${regex}$`).test(filePath);
  }

  /**
   * Match filename against glob pattern
   */
  private matchGlobPattern(fileName: string, pattern: string): boolean {
    // Escape dots FIRST, then convert wildcards
    // Order matters: if we do * -> .* first, then . -> \. breaks .*
    const regex = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
    return new RegExp(`^${regex}$`).test(fileName);
  }

  /**
   * Safely read file content
   */
  private async safeReadFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return "";
    }
  }
}
