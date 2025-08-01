/**
 * Experience Editor
 *
 * This module provides functionality for editing and managing experience records
 * collected during system operation, extracting patterns and knowledge.
 */

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

/**
 * Experience file structure
 */
export interface ExperienceFile {
  id: string;
  timestamp: string;
  action: string;
  context: string;
  success: boolean;
  feedback: string;
  patterns: string[];
  learnings: string[];
}

/**
 * Knowledge pattern structure
 */
export interface KnowledgePattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  actions: string[];
  confidence: number;
  documentationTarget: string;
}

/**
 * Extraction result structure
 */
export interface ExtractionResult {
  patternsExtracted: number;
  filesProcessed: number;
  filesDeleted: number;
  documentationUpdated: string[];
  knowledgePatterns: KnowledgePattern[];
}

/**
 * Experience editor for managing experience records
 */
export class ExperienceEditor {
  private projectRoot: string;
  private experiencesPath: string;
  private docsPath: string;

  /**
   * Creates a new instance of the ExperienceEditor class
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesPath = path.join(projectRoot, "docs", "experiences", "mcp");
    this.docsPath = path.join(projectRoot, "docs");
  }

  /**
   * Extract knowledge from experience files
   * @returns Extraction result
   */
  async extractKnowledge(): Promise<ExtractionResult> {
    // Ensure directories exist
    await fs.ensureDir(this.experiencesPath);
    await fs.ensureDir(this.docsPath);

    // Scan for experience files
    const experiences = await this.scanExperienceFiles();

    if (experiences.length === 0) {
      return {
        patternsExtracted: 0,
        filesProcessed: 0,
        filesDeleted: 0,
        documentationUpdated: [],
        knowledgePatterns: [],
      };
    }

    // Extract patterns from experiences
    const patterns = await this.extractPatterns(experiences);

    // Update documentation with extracted patterns
    const updatedDocs = await this.updateDocumentation(patterns);

    // Cleanup processed files if needed
    const deletedFiles = await this.cleanupProcessedFiles(experiences);

    return {
      patternsExtracted: patterns.length,
      filesProcessed: experiences.length,
      filesDeleted: deletedFiles,
      documentationUpdated: updatedDocs,
      knowledgePatterns: patterns,
    };
  }

  /**
   * Scan for experience files in the experiences directory
   * @returns Array of experience files
   */
  private async scanExperienceFiles(): Promise<ExperienceFile[]> {
    try {
      // Find all JSON files in the experiences directory
      const files = await glob("**/*.json", { cwd: this.experiencesPath });

      const experiences: ExperienceFile[] = [];

      for (const file of files) {
        const filePath = path.join(this.experiencesPath, file);
        const content = await fs.readFile(filePath, "utf-8");

        try {
          const exp = JSON.parse(content) as ExperienceFile;
          experiences.push(exp);
        } catch (error) {
          console.error(`Error parsing experience file ${file}:`, error);
        }
      }

      return experiences;
    } catch (error) {
      console.error("Error scanning experience files:", error);
      return [];
    }
  }

  /**
   * Extract patterns from experience files
   * @param experiences - Array of experience files
   * @returns Array of knowledge patterns
   */
  private async extractPatterns(
    experiences: ExperienceFile[],
  ): Promise<KnowledgePattern[]> {
    // Group experiences by patterns
    const patternMap = new Map<string, any>();

    // Process each experience
    for (const experience of experiences) {
      // Extract patterns from explicitly listed patterns
      if (experience.patterns && Array.isArray(experience.patterns)) {
        for (const pattern of experience.patterns) {
          this.addPattern(patternMap, pattern, experience);
        }
      }

      // Extract patterns from context
      if (experience.context) {
        try {
          const contextPatterns = this.extractContextPatterns(
            experience.context,
          );
          for (const pattern of contextPatterns) {
            this.addPattern(patternMap, pattern, experience);
          }
        } catch (error) {
          // Skip context pattern extraction on error
        }
      }

      // Extract patterns from learnings
      if (experience.learnings && Array.isArray(experience.learnings)) {
        for (const learning of experience.learnings) {
          this.addPattern(patternMap, learning, experience);
        }
      }
    }

    // Convert patterns map to array
    const patterns: KnowledgePattern[] = [];

    patternMap.forEach((data, pattern) => {
      // Calculate confidence based on frequency and success rate
      const successCount = data.success || 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const failureCount = data.contexts.length - successCount;
      const confidence =
        data.contexts.length > 0
          ? (successCount / data.contexts.length) *
            (1 - 1 / Math.sqrt(data.contexts.length + 1))
          : 0;

      patterns.push({
        pattern,
        frequency: data.contexts.length,
        contexts: data.contexts,
        actions: data.actions,
        confidence,
        documentationTarget: this.determineDocumentationTarget(pattern),
      });
    });

    // Sort patterns by frequency and confidence
    patterns.sort(
      (a, b) => b.frequency - a.frequency || b.confidence - a.confidence,
    );

    return patterns;
  }

  /**
   * Add a pattern to the pattern map
   * @param patternMap - Map of patterns
   * @param pattern - Pattern to add
   * @param experience - Experience file containing the pattern
   */
  private addPattern(
    patternMap: Map<string, any>,
    pattern: string,
    experience: ExperienceFile,
  ): void {
    // Normalize pattern
    const normalizedPattern = pattern.trim();
    if (!normalizedPattern) return;

    // Get or create pattern entry
    if (!patternMap.has(normalizedPattern)) {
      patternMap.set(normalizedPattern, {
        contexts: [],
        actions: [],
        success: 0,
      });
    }

    // Update pattern data
    const patternData = patternMap.get(normalizedPattern);
    patternData.contexts.push(experience.context);
    patternData.actions.push(experience.action);

    if (experience.success) {
      patternData.success = (patternData.success || 0) + 1;
    }
  }

  /**
   * Extract patterns from context
   * @param context - Context string
   * @returns Array of extracted patterns
   */
  private extractContextPatterns(context: string): string[] {
    // Try to parse context as JSON
    try {
      const contextObj = JSON.parse(context);
      // Extract potential patterns from JSON properties
      return Object.entries(contextObj)
        .filter(([_, value]) => typeof value === "string")
        .map(([key, value]) => `${key}: ${String(value).substring(0, 50)}`)
        .filter((pattern) => pattern.length > 10);
    } catch (error) {
      // If not JSON, extract potential patterns from text
      return context
        .split("\n")
        .filter((line) => line.length > 10 && line.length < 100)
        .map((line) => line.trim());
    }
  }

  /**
   * Determine the documentation target for a pattern
   * @param pattern - Pattern to categorize
   * @returns Documentation target path
   */
  private determineDocumentationTarget(pattern: string): string {
    // Categorize pattern based on content
    const lowerPattern = pattern.toLowerCase();

    if (lowerPattern.includes("tool") || lowerPattern.includes("command")) {
      return "tools.md";
    } else if (
      lowerPattern.includes("pattern") ||
      lowerPattern.includes("practice")
    ) {
      return "code-patterns.md";
    } else if (
      lowerPattern.includes("convention") ||
      lowerPattern.includes("style")
    ) {
      return "conventions.md";
    } else if (
      lowerPattern.includes("architecture") ||
      lowerPattern.includes("structure")
    ) {
      return "architecture.md";
    } else {
      return "project-knowledge.md";
    }
  }

  /**
   * Update documentation with extracted patterns
   * @param patterns - Array of knowledge patterns
   * @returns Array of updated documentation files
   */
  private async updateDocumentation(
    patterns: KnowledgePattern[],
  ): Promise<string[]> {
    // Group patterns by documentation target
    const targetMap = new Map<string, KnowledgePattern[]>();

    for (const pattern of patterns) {
      if (!targetMap.has(pattern.documentationTarget)) {
        targetMap.set(pattern.documentationTarget, []);
      }
      targetMap.get(pattern.documentationTarget)?.push(pattern);
    }

    const updatedFiles: string[] = [];

    // Update each documentation file
    for (const [target, targetPatterns] of targetMap.entries()) {
      // Only update files with significant patterns
      if (targetPatterns.length < 2) continue;

      const targetFile = path.join(this.docsPath, target);
      await this.updateDocumentationFile(targetFile, targetPatterns);
      updatedFiles.push(target);
    }

    return updatedFiles;
  }

  /**
   * Update a specific documentation file with patterns
   * @param targetFile - Documentation file to update
   * @param patterns - Patterns to add to the documentation
   */
  private async updateDocumentationFile(
    targetFile: string,
    patterns: KnowledgePattern[],
  ): Promise<void> {
    try {
      // Ensure file exists
      await fs.ensureFile(targetFile);

      // Read existing content
      let content = "";
      try {
        content = await fs.readFile(targetFile, "utf-8");
      } catch (error) {
        // Ignore reading errors, start with empty content
      }

      // Generate knowledge section
      const knowledgeSection = this.generateKnowledgeSection(patterns);

      // Check if knowledge section already exists
      const knowledgeSectionMarker = "## Extracted Knowledge Patterns";
      if (content.includes(knowledgeSectionMarker)) {
        // Replace existing knowledge section
        const beforeSection = content.split(knowledgeSectionMarker)[0];
        content = beforeSection + knowledgeSection;
      } else {
        // Append knowledge section
        content += "\n\n" + knowledgeSection;
      }

      // Write updated content
      await fs.writeFile(targetFile, content);
    } catch (error) {
      console.error(`Error updating documentation file ${targetFile}:`, error);
    }
  }

  /**
   * Generate a knowledge section from patterns
   * @param patterns - Patterns to include in the section
   * @returns Generated knowledge section markdown
   */
  private generateKnowledgeSection(patterns: KnowledgePattern[]): string {
    // Start with section header
    let section = `## Extracted Knowledge Patterns\n\n`;
    section += `_Last updated: ${new Date().toISOString()}_\n\n`;

    // Add patterns, sorted by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);

    for (const pattern of patterns.slice(0, 10)) {
      // Limit to top 10
      const confidencePercent = Math.round(pattern.confidence * 100);
      section += `### ${pattern.pattern}\n\n`;
      section += `- **Frequency**: ${pattern.frequency} occurrences\n`;
      section += `- **Confidence**: ${confidencePercent}%\n`;
      section += `- **Actions**: ${[...new Set(pattern.actions)].join(", ")}\n\n`;
    }

    return section;
  }

  /**
   * Cleanup processed experience files
   * @param processedFiles - Array of processed experience files
   * @returns Number of deleted files
   */
  private async cleanupProcessedFiles(
    processedFiles: ExperienceFile[],
  ): Promise<number> {
    // Identify files older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let deletedCount = 0;

    for (const exp of processedFiles) {
      try {
        const expDate = new Date(exp.timestamp);

        // Delete old files
        if (expDate < thirtyDaysAgo) {
          const filePath = path.join(this.experiencesPath, `${exp.id}.json`);
          if (await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`Error deleting experience file ${exp.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Get statistics about experience files
   * @returns Statistics about experience files
   */
  async getExtractionStats(): Promise<{
    totalExperienceFiles: number;
    oldestFile: string;
    newestFile: string;
    estimatedCleanup: number;
  }> {
    // Scan for experience files
    const experiences = await this.scanExperienceFiles();

    if (experiences.length === 0) {
      return {
        totalExperienceFiles: 0,
        oldestFile: "none",
        newestFile: "none",
        estimatedCleanup: 0,
      };
    }

    // Sort by timestamp
    experiences.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Identify files older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldFiles = experiences.filter(
      (exp) => new Date(exp.timestamp) < thirtyDaysAgo,
    );

    return {
      totalExperienceFiles: experiences.length,
      oldestFile: experiences[0].timestamp,
      newestFile: experiences[experiences.length - 1].timestamp,
      estimatedCleanup: oldFiles.length,
    };
  }
}

/**
 * Run the experience extraction process
 * @param projectRoot - Project root directory
 */
export async function runExperienceExtraction(
  projectRoot: string = process.cwd(),
): Promise<void> {
  const editor = new ExperienceEditor(projectRoot);

  console.log("Starting experience extraction...");

  const result = await editor.extractKnowledge();

  console.log("Experience extraction complete:");
  console.log(`- Processed ${result.filesProcessed} experience files`);
  console.log(`- Extracted ${result.patternsExtracted} knowledge patterns`);
  console.log(
    `- Updated ${result.documentationUpdated.length} documentation files`,
  );
  console.log(`- Cleaned up ${result.filesDeleted} old experience files`);
}
