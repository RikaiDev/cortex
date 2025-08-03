/**
 * Project Standards Collector
 *
 * This module provides functionality for collecting and managing project standards
 * and conventions from interactions. It detects standardization signals in messages
 * and stores them for consistent application across the project.
 *
 * The system is language-agnostic and can be configured for any language or environment.
 */

import fs from "fs-extra";
import path from "path";

/**
 * Standard type enum
 */
export enum StandardType {
  Correction = "correction",
  Convention = "convention",
  Prohibition = "prohibition",
  Consistency = "consistency",
}

/**
 * Project standard signal structure
 */
export interface StandardSignal {
  type: StandardType;
  key: string;
  value: string;
  context?: string;
  timestamp: string;
  source: string;
  scope: string;
  rationale?: string;
}

/**
 * Standard detection result
 */
export interface StandardDetectionResult {
  detected: boolean;
  signals: StandardSignal[];
  message: string;
}

/**
 * Project standards collector for detecting and managing project standards
 */
export class ProjectStandardsCollector {
  private projectRoot: string;
  private standardsPath: string;
  private standards: Map<string, StandardSignal>;
  private detectionPatterns: Map<string, Record<StandardType, RegExp[]>>;

  /**
   * Creates a new instance of the ProjectStandardsCollector class
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.standardsPath = path.join(projectRoot, "docs", "standards");
    this.standards = new Map<string, StandardSignal>();
    this.detectionPatterns = new Map();

    // Initialize with default language patterns
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default detection patterns for different languages
   */
  private initializeDefaultPatterns(): void {
    // English patterns
    const enPatterns: Record<StandardType, RegExp[]> = {
      [StandardType.Correction]: [
        /incorrect[.,]?\s*([\w\s\d\-_]+)/i,
        /wrong[.,]?\s*([\w\s\d\-_]+)/i,
        /error[.,]?\s*([\w\s\d\-_]+)/i,
        /should be\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Convention]: [
        /we use\s*([\w\s\d\-_]+)/i,
        /our standard is\s*([\w\s\d\-_]+)/i,
        /project convention is\s*([\w\s\d\-_]+)/i,
        /please use\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Prohibition]: [
        /don't use\s*([\w\s\d\-_]+)/i,
        /never use\s*([\w\s\d\-_]+)/i,
        /avoid\s*([\w\s\d\-_]+)/i,
        /shouldn't use\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Consistency]: [
        /be consistent with\s*([\w\s\d\-_]+)/i,
        /standardize on\s*([\w\s\d\-_]+)/i,
        /maintain consistency\s*([\w\s\d\-_]+)/i,
        /always use\s*([\w\s\d\-_]+)/i,
      ],
    };

    // Chinese (Traditional) patterns
    const zhTwPatterns: Record<StandardType, RegExp[]> = {
      [StandardType.Correction]: [
        /不對[，,]?\s*([\w\s\d\-_]+)/i,
        /錯誤[，,]?\s*([\w\s\d\-_]+)/i,
        /錯了[，,]?\s*([\w\s\d\-_]+)/i,
        /應該是\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Convention]: [
        /我們用\s*([\w\s\d\-_]+)/i,
        /我們專案用\s*([\w\s\d\-_]+)/i,
        /標準是\s*([\w\s\d\-_]+)/i,
        /規範是\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Prohibition]: [
        /不要\s*([\w\s\d\-_]+)/i,
        /從來不用\s*([\w\s\d\-_]+)/i,
        /避免\s*([\w\s\d\-_]+)/i,
        /不應該\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Consistency]: [
        /保持一致\s*([\w\s\d\-_]+)/i,
        /統一使用\s*([\w\s\d\-_]+)/i,
        /風格一致\s*([\w\s\d\-_]+)/i,
        /一律使用\s*([\w\s\d\-_]+)/i,
      ],
    };

    // Japanese patterns
    const jaPatterns: Record<StandardType, RegExp[]> = {
      [StandardType.Correction]: [
        /違います[、,]?\s*([\w\s\d\-_]+)/i,
        /間違いです[、,]?\s*([\w\s\d\-_]+)/i,
        /エラーです[、,]?\s*([\w\s\d\-_]+)/i,
        /であるべきです\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Convention]: [
        /私たちは使います\s*([\w\s\d\-_]+)/i,
        /私たちの標準は\s*([\w\s\d\-_]+)/i,
        /プロジェクトの規約は\s*([\w\s\d\-_]+)/i,
        /を使用してください\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Prohibition]: [
        /使わないでください\s*([\w\s\d\-_]+)/i,
        /絶対に使わない\s*([\w\s\d\-_]+)/i,
        /避けてください\s*([\w\s\d\-_]+)/i,
        /べきではありません\s*([\w\s\d\-_]+)/i,
      ],
      [StandardType.Consistency]: [
        /と一致させる\s*([\w\s\d\-_]+)/i,
        /で標準化する\s*([\w\s\d\-_]+)/i,
        /一貫性を保つ\s*([\w\s\d\-_]+)/i,
        /常に使用する\s*([\w\s\d\-_]+)/i,
      ],
    };

    // Add patterns to the map
    this.detectionPatterns.set("en", enPatterns);
    this.detectionPatterns.set("zh-TW", zhTwPatterns);
    this.detectionPatterns.set("ja", jaPatterns);
  }

  /**
   * Register custom patterns for a specific language
   * @param language - Language code
   * @param patterns - Custom patterns
   */
  registerPatterns(
    language: string,
    patterns: Record<StandardType, RegExp[]>
  ): void {
    this.detectionPatterns.set(language, patterns);
  }

  /**
   * Initialize the standards collector
   */
  async initialize(): Promise<void> {
    // Ensure standards directory exists
    await fs.ensureDir(this.standardsPath);

    // Load existing standards
    await this.loadStandards();
  }

  /**
   * Load standards from storage
   */
  private async loadStandards(): Promise<void> {
    try {
      const standardsFile = path.join(
        this.standardsPath,
        "project-standards.json"
      );

      if (await fs.pathExists(standardsFile)) {
        const data = await fs.readFile(standardsFile, "utf-8");
        const loadedStandards = JSON.parse(data) as StandardSignal[];

        for (const standard of loadedStandards) {
          this.standards.set(
            this.getStandardKey(standard.key, standard.type, standard.scope),
            standard
          );
        }

        console.log(`Loaded ${this.standards.size} project standards`);
      }
    } catch (error) {
      console.error("Error loading standards:", error);
    }
  }

  /**
   * Save standards to storage
   */
  private async saveStandards(): Promise<void> {
    try {
      const standardsFile = path.join(
        this.standardsPath,
        "project-standards.json"
      );
      const standards = Array.from(this.standards.values());

      await fs.writeFile(standardsFile, JSON.stringify(standards, null, 2));
    } catch (error) {
      console.error("Error saving standards:", error);
    }
  }

  /**
   * Generate a unique key for a standard
   * @param key - Standard key
   * @param type - Standard type
   * @param scope - Standard scope (e.g., "global", "frontend", "backend")
   * @returns Unique standard key
   */
  private getStandardKey(
    key: string,
    type: StandardType,
    scope: string
  ): string {
    return `${type}:${scope}:${key.toLowerCase()}`;
  }

  /**
   * Detect standards in a message
   * @param message - Message to analyze
   * @param context - Optional context
   * @param language - Language code (defaults to auto-detection)
   * @param scope - Standard scope (defaults to "global")
   * @returns Standard detection result
   */
  detectStandards(
    message: string,
    context?: string,
    language?: string,
    scope: string = "global"
  ): StandardDetectionResult {
    const signals: StandardSignal[] = [];
    const detectedLanguage = language || this.detectLanguage(message);

    // Get patterns for the detected language
    const languagePatterns =
      this.detectionPatterns.get(detectedLanguage) ||
      this.detectionPatterns.get("en"); // Default to English if language not found

    if (!languagePatterns) {
      return {
        detected: false,
        signals: [],
        message: "No patterns available for language detection",
      };
    }

    // Check each standard type
    for (const [type, patterns] of Object.entries(languagePatterns)) {
      const standardType = type as StandardType;

      // Check each pattern for this type
      for (const pattern of patterns) {
        const matches = message.match(pattern);

        if (matches && matches[1]) {
          const value = matches[1].trim();
          const key = this.extractStandardKey(value);
          const rationale = this.extractRationale(message, matches.index || 0);

          signals.push({
            type: standardType,
            key,
            value,
            context,
            timestamp: new Date().toISOString(),
            source: "message",
            scope,
            rationale,
          });
        }
      }
    }

    return {
      detected: signals.length > 0,
      signals,
      message:
        signals.length > 0
          ? `Detected ${signals.length} project standard signals`
          : "No project standards detected",
    };
  }

  /**
   * Detect the language of a message
   * @param message - Message to analyze
   * @returns Detected language code
   */
  private detectLanguage(message: string): string {
    const configPath = path.join(this.projectRoot, "cortex.json");
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (config.preferences && config.preferences.language) {
          return config.preferences.language;
        }
      } catch (error) {
        // Fallback to character detection if config is invalid
      }
    }

    // Simple language detection based on character sets
    if (
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/.test(message)
    ) {
      if (/[\u3040-\u309f]/.test(message) || /[\u30a0-\u30ff]/.test(message))
        return "ja";
      return "zh-TW";
    }

    // Default to English
    return "en";
  }

  /**
   * Extract rationale from the message
   * @param message - Full message
   * @param matchIndex - Index where the pattern matched
   * @returns Extracted rationale or undefined
   */
  private extractRationale(
    message: string,
    matchIndex: number
  ): string | undefined {
    // Try to extract rationale that might follow the standard declaration
    // Look for phrases like "because", "since", "as", etc.

    const afterMatch = message.substring(matchIndex);
    const rationaleMatches = afterMatch.match(
      /(because|since|as|for|to ensure|to maintain)\s+([^.!?]+)/i
    );

    if (rationaleMatches && rationaleMatches[2]) {
      return rationaleMatches[2].trim();
    }

    return undefined;
  }

  /**
   * Extract a standard key from a value
   * @param value - Standard value
   * @returns Standard key
   */
  private extractStandardKey(value: string): string {
    // Extract the first few words as the key
    const words = value.split(/\s+/);
    return words.slice(0, Math.min(3, words.length)).join(" ").toLowerCase();
  }

  /**
   * Store detected standards
   * @param signals - Standard signals to store
   * @param merge - Whether to merge with existing standards (default: true)
   */
  async storeStandards(
    signals: StandardSignal[],
    merge: boolean = true
  ): Promise<void> {
    let updated = false;

    for (const signal of signals) {
      const key = this.getStandardKey(signal.key, signal.type, signal.scope);

      if (merge && this.standards.has(key)) {
        // If merging and standard exists, update only if new standard has rationale
        const existingStandard = this.standards.get(key)!;
        if (signal.rationale && !existingStandard.rationale) {
          this.standards.set(key, {
            ...existingStandard,
            rationale: signal.rationale,
            timestamp: signal.timestamp, // Update timestamp
          });
          updated = true;
        }
      } else {
        // Otherwise, store the new standard
        this.standards.set(key, signal);
        updated = true;
      }
    }

    if (updated) {
      await this.saveStandards();
    }
  }

  /**
   * Process a message for standards
   * @param message - Message to analyze
   * @param context - Optional context
   * @param language - Language code (defaults to auto-detection)
   * @param scope - Standard scope (defaults to "global")
   * @returns Standard detection result
   */
  async processMessage(
    message: string,
    context?: string,
    language?: string,
    scope: string = "global"
  ): Promise<StandardDetectionResult> {
    const result = this.detectStandards(message, context, language, scope);

    if (result.detected) {
      await this.storeStandards(result.signals);
    }

    return result;
  }

  /**
   * Get all stored standards
   * @returns Array of standard signals
   */
  getAllStandards(): StandardSignal[] {
    return Array.from(this.standards.values());
  }

  /**
   * Get standards of a specific type
   * @param type - Standard type
   * @param scope - Optional scope filter
   * @returns Array of standard signals of the specified type
   */
  getStandardsByType(type: StandardType, scope?: string): StandardSignal[] {
    return Array.from(this.standards.values()).filter(
      (std) => std.type === type && (!scope || std.scope === scope)
    );
  }

  /**
   * Get standards for a specific scope
   * @param scope - Scope to filter by
   * @returns Array of standard signals for the specified scope
   */
  getStandardsByScope(scope: string): StandardSignal[] {
    return Array.from(this.standards.values()).filter(
      (std) => std.scope === scope
    );
  }

  /**
   * Check if a specific standard exists
   * @param key - Standard key
   * @param type - Standard type
   * @param scope - Standard scope
   * @returns True if the standard exists
   */
  hasStandard(key: string, type: StandardType, scope: string): boolean {
    return this.standards.has(this.getStandardKey(key, type, scope));
  }

  /**
   * Get a specific standard
   * @param key - Standard key
   * @param type - Standard type
   * @param scope - Standard scope
   * @returns Standard signal or undefined
   */
  getStandard(
    key: string,
    type: StandardType,
    scope: string
  ): StandardSignal | undefined {
    return this.standards.get(this.getStandardKey(key, type, scope));
  }

  /**
   * Apply project standards to a content string
   * @param content - Content to apply standards to
   * @param scope - Scope to apply (default: "global")
   * @returns Modified content with standards applied
   */
  applyStandards(content: string, scope: string = "global"): string {
    let modifiedContent = content;

    // Get all standards for the specified scope or global scope
    const allStandards = this.getAllStandards().filter(
      (std) => std.scope === scope || std.scope === "global"
    );

    // Apply corrections
    const corrections = allStandards.filter(
      (std) => std.type === StandardType.Correction
    );
    for (const correction of corrections) {
      // Simple string replacement - in a real implementation, this would be more sophisticated
      modifiedContent = modifiedContent.replace(
        new RegExp(correction.key, "gi"),
        correction.value
      );
    }

    // Apply conventions
    const conventions = allStandards.filter(
      (std) => std.type === StandardType.Convention
    );
    for (const convention of conventions) {
      // For conventions, we might want to ensure they're used
      if (!modifiedContent.includes(convention.value)) {
        // This is a simplified approach - real implementation would be context-aware
        modifiedContent = modifiedContent.replace(
          new RegExp(
            `(alternatives?|options?|choices?|ways?|methods?|approaches?)\\s+(for|to|of)\\s+${convention.key}`,
            "gi"
          ),
          `${convention.value} (project convention${convention.rationale ? ` - ${convention.rationale}` : ""})`
        );
      }
    }

    // Apply prohibitions
    const prohibitions = allStandards.filter(
      (std) => std.type === StandardType.Prohibition
    );
    for (const prohibition of prohibitions) {
      // For prohibitions, we want to remove or replace them
      modifiedContent = modifiedContent.replace(
        new RegExp(`\\b${prohibition.key}\\b`, "gi"),
        `[PROHIBITED: ${prohibition.key}${prohibition.rationale ? ` - ${prohibition.rationale}` : ""}]`
      );
    }

    // Apply consistency standards
    const consistencyRules = allStandards.filter(
      (std) => std.type === StandardType.Consistency
    );
    for (const rule of consistencyRules) {
      // For consistency rules, ensure consistent usage
      modifiedContent = modifiedContent.replace(
        new RegExp(`\\b${rule.key}\\b`, "gi"),
        rule.value
      );
    }

    return modifiedContent;
  }

  /**
   * Generate a summary of project standards
   * @param scope - Optional scope to filter by
   * @returns Standards summary
   */
  generateStandardsSummary(scope?: string): string {
    const standards = scope
      ? this.getStandardsByScope(scope)
      : this.getAllStandards();

    if (standards.length === 0) {
      return "No project standards have been collected yet.";
    }

    let summary = "# Project Standards Summary\n\n";

    if (scope) {
      summary += `Scope: ${scope}\n\n`;
    }

    // Group by type
    const byType = new Map<StandardType, StandardSignal[]>();
    for (const std of standards) {
      if (!byType.has(std.type)) {
        byType.set(std.type, []);
      }
      byType.get(std.type)?.push(std);
    }

    // Generate summary by type
    for (const [type, stds] of byType.entries()) {
      summary += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

      for (const std of stds) {
        summary += `- ${std.key}: "${std.value}"`;
        if (std.rationale) {
          summary += ` (Rationale: ${std.rationale})`;
        }
        if (std.scope !== "global" && !scope) {
          summary += ` [Scope: ${std.scope}]`;
        }
        summary += "\n";
      }

      summary += "\n";
    }

    return summary;
  }

  /**
   * Export standards as a structured document
   * @param format - Export format ("markdown" or "json")
   * @returns Exported standards document
   */
  exportStandards(format: "markdown" | "json" = "markdown"): string {
    if (format === "json") {
      return JSON.stringify(this.getAllStandards(), null, 2);
    }

    // Default to markdown format
    let doc = "# Project Standards Documentation\n\n";
    doc += `Generated: ${new Date().toISOString()}\n\n`;

    // Group by scope first
    const byScope = new Map<string, StandardSignal[]>();
    for (const std of this.getAllStandards()) {
      if (!byScope.has(std.scope)) {
        byScope.set(std.scope, []);
      }
      byScope.get(std.scope)?.push(std);
    }

    // Generate documentation by scope and type
    for (const [scope, standards] of byScope.entries()) {
      doc += `## ${scope === "global" ? "Global Standards" : `${scope} Standards`}\n\n`;

      // Group by type within scope
      const byType = new Map<StandardType, StandardSignal[]>();
      for (const std of standards) {
        if (!byType.has(std.type)) {
          byType.set(std.type, []);
        }
        byType.get(std.type)?.push(std);
      }

      // Generate documentation by type
      for (const [type, stds] of byType.entries()) {
        doc += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

        for (const std of stds) {
          doc += `#### ${std.key}\n\n`;
          doc += `- **Standard**: ${std.value}\n`;
          if (std.rationale) {
            doc += `- **Rationale**: ${std.rationale}\n`;
          }
          doc += `- **Source**: ${std.source}\n`;
          doc += `- **Added**: ${new Date(std.timestamp).toLocaleDateString()}\n`;
          doc += "\n";
        }
      }
    }

    return doc;
  }
}

/**
 * Initialize the project standards collector tools
 * @param server - MCP server instance
 * @param projectRoot - Project root directory
 */
export function initProjectStandardsTools(
  server: any,
  projectRoot: string
): void {
  const collector = new ProjectStandardsCollector(projectRoot);

  // Initialize collector
  collector.initialize().catch((error) => {
    console.error("Error initializing project standards collector:", error);
  });

  // Register standard detection tool
  server.registerTool(
    "standards-detector",
    {
      title: "Project Standards Detector",
      description: "Detects project standards in messages",
      inputSchema: {
        message: { type: "string" },
        context: { type: "string", optional: true },
        language: { type: "string", optional: true },
        scope: { type: "string", optional: true },
      },
    },
    async ({
      message,
      context,
      language,
      scope,
    }: {
      message: string;
      context?: string;
      language?: string;
      scope?: string;
    }) => {
      const result = await collector.processMessage(
        message,
        context,
        language,
        scope || "global"
      );

      return {
        detected: result.detected,
        signals: result.signals,
        message: result.message,
      };
    }
  );

  // Register standards application tool
  server.registerTool(
    "standards-applier",
    {
      title: "Standards Applier",
      description: "Applies project standards to content",
      inputSchema: {
        content: { type: "string" },
        scope: { type: "string", optional: true },
      },
    },
    async ({ content, scope }: { content: string; scope?: string }) => {
      const modifiedContent = collector.applyStandards(
        content,
        scope || "global"
      );

      return {
        originalContent: content,
        modifiedContent,
        standardsApplied: modifiedContent !== content,
      };
    }
  );

  // Register standards summary tool
  server.registerTool(
    "standards-summary",
    {
      title: "Standards Summary",
      description: "Generates a summary of project standards",
      inputSchema: {
        scope: { type: "string", optional: true },
      },
    },
    async ({ scope }: { scope?: string }) => {
      const summary = collector.generateStandardsSummary(scope);
      const standards = scope
        ? collector.getStandardsByScope(scope)
        : collector.getAllStandards();

      return {
        summary,
        standardCount: standards.length,
        standards,
      };
    }
  );

  // Register standards export tool
  server.registerTool(
    "standards-export",
    {
      title: "Standards Export",
      description: "Exports project standards as a structured document",
      inputSchema: {
        format: { type: "string", optional: true },
      },
    },
    async ({ format }: { format?: string }) => {
      const document = collector.exportStandards(
        format === "json" ? "json" : "markdown"
      );

      return {
        document,
        format: format === "json" ? "json" : "markdown",
        standardCount: collector.getAllStandards().length,
      };
    }
  );

  // Register custom pattern registration tool
  server.registerTool(
    "register-standards-patterns",
    {
      title: "Register Standards Patterns",
      description:
        "Register custom patterns for detecting standards in a specific language",
      inputSchema: {
        language: { type: "string" },
        patterns: { type: "object" },
      },
    },
    async ({
      language,
      patterns,
    }: {
      language: string;
      patterns: Record<StandardType, RegExp[]>;
    }) => {
      collector.registerPatterns(language, patterns);

      return {
        success: true,
        message: `Registered patterns for language: ${language}`,
        language,
      };
    }
  );
}

// For backward compatibility
export const initPreferenceCollectorTools = initProjectStandardsTools;
