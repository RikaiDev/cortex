/**
 * Experience Editor - Automated Knowledge Extraction System
 *
 * Scans experience files, extracts valuable knowledge patterns,
 * updates structured documentation, and cleans up processed files.
 */

import fs from "fs-extra";
import { join } from "path";
import { glob } from "glob";
import chalk from "chalk";

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

export interface KnowledgePattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  actions: string[];
  confidence: number;
  documentationTarget: string;
}

export interface ExtractionResult {
  patternsExtracted: number;
  filesProcessed: number;
  filesDeleted: number;
  documentationUpdated: string[];
  knowledgePatterns: KnowledgePattern[];
}

export class ExperienceEditor {
  private projectRoot: string;
  private experiencesPath: string;
  private docsPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesPath = join(projectRoot, "docs", "experiences", "mcp");
    this.docsPath = join(projectRoot, "docs");
  }

  /**
   * Main extraction workflow
   */
  async extractKnowledge(): Promise<ExtractionResult> {
    console.log(chalk.blue("🧠 Starting knowledge extraction..."));

    // 1. Scan experience files
    const experienceFiles = await this.scanExperienceFiles();
    console.log(chalk.gray(`Found ${experienceFiles.length} experience files`));

    // 2. Extract patterns
    const knowledgePatterns = await this.extractPatterns(experienceFiles);
    console.log(
      chalk.gray(`Extracted ${knowledgePatterns.length} knowledge patterns`)
    );

    // 3. Update documentation
    const updatedDocs = await this.updateDocumentation(knowledgePatterns);
    console.log(
      chalk.gray(`Updated ${updatedDocs.length} documentation files`)
    );

    // 4. Clean up processed files
    const deletedFiles = await this.cleanupProcessedFiles(experienceFiles);
    console.log(chalk.gray(`Cleaned up ${deletedFiles} processed files`));

    const result: ExtractionResult = {
      patternsExtracted: knowledgePatterns.length,
      filesProcessed: experienceFiles.length,
      filesDeleted: deletedFiles,
      documentationUpdated: updatedDocs,
      knowledgePatterns,
    };

    console.log(chalk.green("✅ Knowledge extraction completed"));
    return result;
  }

  /**
   * Scan and load experience files
   */
  private async scanExperienceFiles(): Promise<ExperienceFile[]> {
    try {
      const files = await glob("exp-*.json", { cwd: this.experiencesPath });
      const experiences: ExperienceFile[] = [];

      for (const file of files) {
        try {
          const filePath = join(this.experiencesPath, file);
          const experience = await fs.readJSON(filePath);
          experiences.push(experience);
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ Failed to read ${file}:`, error));
        }
      }

      return experiences.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to scan experience files:"), error);
      return [];
    }
  }

  /**
   * Extract knowledge patterns from experiences
   */
  private async extractPatterns(
    experiences: ExperienceFile[]
  ): Promise<KnowledgePattern[]> {
    const patternMap = new Map<
      string,
      {
        frequency: number;
        contexts: Set<string>;
        actions: Set<string>;
        successRate: number;
        totalOccurrences: number;
      }
    >();

    // Analyze patterns
    for (const exp of experiences) {
      // Extract patterns from learnings
      for (const learning of exp.learnings || []) {
        this.addPattern(patternMap, learning, exp);
      }

      // Extract patterns from context
      const contextPatterns = this.extractContextPatterns(exp.context);
      for (const pattern of contextPatterns) {
        this.addPattern(patternMap, pattern, exp);
      }

      // Extract tool patterns
      if (exp.action.includes("tool")) {
        this.addPattern(patternMap, "tool-usage", exp);
      }

      // Extract environment patterns
      if (exp.context.includes("docker") || exp.context.includes("Docker")) {
        this.addPattern(patternMap, "docker-environment", exp);
      }

      if (exp.context.includes("uv")) {
        this.addPattern(patternMap, "uv-tool-manager", exp);
      }
    }

    // Convert to knowledge patterns
    const knowledgePatterns: KnowledgePattern[] = [];

    for (const [pattern, data] of patternMap.entries()) {
      if (data.frequency >= 2) {
        // Only patterns that occur multiple times
        knowledgePatterns.push({
          pattern,
          frequency: data.frequency,
          contexts: Array.from(data.contexts),
          actions: Array.from(data.actions),
          confidence: data.successRate / data.totalOccurrences,
          documentationTarget: this.determineDocumentationTarget(pattern),
        });
      }
    }

    return knowledgePatterns.sort((a, b) => b.frequency - a.frequency);
  }

  private addPattern(
    patternMap: Map<string, any>,
    pattern: string,
    experience: ExperienceFile
  ): void {
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, {
        frequency: 0,
        contexts: new Set<string>(),
        actions: new Set<string>(),
        successRate: 0,
        totalOccurrences: 0,
      });
    }

    const data = patternMap.get(pattern)!;
    data.frequency += 1;
    data.contexts.add(experience.context.substring(0, 100)); // Truncate for memory
    data.actions.add(experience.action);
    data.totalOccurrences += 1;
    if (experience.success) {
      data.successRate += 1;
    }
  }

  private extractContextPatterns(context: string): string[] {
    const patterns: string[] = [];

    // Environment patterns
    if (context.toLowerCase().includes("mcp")) patterns.push("mcp-workflow");
    if (context.toLowerCase().includes("english"))
      patterns.push("english-comments");
    if (context.toLowerCase().includes("environment"))
      patterns.push("environment-setup");
    if (context.toLowerCase().includes("configuration"))
      patterns.push("configuration-management");

    return patterns;
  }

  private determineDocumentationTarget(pattern: string): string {
    const targetMap: Record<string, string> = {
      "docker-environment": "environment-configurations.md",
      "uv-tool-manager": "environment-configurations.md",
      "tool-usage": "tools.md",
      "mcp-workflow": "ai-collaboration/README.md",
      "english-comments": "conventions.md",
      "environment-setup": "environment-configurations.md",
      "configuration-management": "tools.md",
    };

    return targetMap[pattern] || "project-knowledge.md";
  }

  /**
   * Update documentation files with extracted knowledge
   */
  private async updateDocumentation(
    patterns: KnowledgePattern[]
  ): Promise<string[]> {
    const updatedFiles: string[] = [];
    const updatesByFile = new Map<string, KnowledgePattern[]>();

    // Group patterns by target documentation file
    for (const pattern of patterns) {
      if (!updatesByFile.has(pattern.documentationTarget)) {
        updatesByFile.set(pattern.documentationTarget, []);
      }
      updatesByFile.get(pattern.documentationTarget)!.push(pattern);
    }

    // Update each documentation file
    for (const [targetFile, filePatterns] of updatesByFile.entries()) {
      try {
        await this.updateDocumentationFile(targetFile, filePatterns);
        updatedFiles.push(targetFile);
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Failed to update ${targetFile}:`, error));
      }
    }

    return updatedFiles;
  }

  private async updateDocumentationFile(
    targetFile: string,
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const filePath = join(this.docsPath, targetFile);

    // Read existing content
    let content = "";
    if (await fs.pathExists(filePath)) {
      content = await fs.readFile(filePath, "utf-8");
    }

    // Create knowledge section
    const knowledgeSection = this.generateKnowledgeSection(patterns);

    // Check if knowledge section already exists
    const sectionHeader = "## Extracted Knowledge Patterns";
    if (content.includes(sectionHeader)) {
      // Replace existing section
      const start = content.indexOf(sectionHeader);
      const nextSection = content.indexOf("\n## ", start + 1);
      const end = nextSection > -1 ? nextSection : content.length;

      content =
        content.substring(0, start) + knowledgeSection + content.substring(end);
    } else {
      // Append new section
      content += "\n\n" + knowledgeSection;
    }

    await fs.writeFile(filePath, content);
  }

  private generateKnowledgeSection(patterns: KnowledgePattern[]): string {
    const timestamp = new Date().toISOString().split("T")[0];

    let section = `## Extracted Knowledge Patterns\n\n`;
    section += `*Last updated: ${timestamp}*\n\n`;

    for (const pattern of patterns) {
      section += `### ${pattern.pattern}\n\n`;
      section += `- **Frequency**: ${pattern.frequency} occurrences\n`;
      section += `- **Confidence**: ${(pattern.confidence * 100).toFixed(1)}%\n`;
      section += `- **Key Actions**: ${pattern.actions.slice(0, 3).join(", ")}\n`;
      section += `- **Common Contexts**: ${pattern.contexts.slice(0, 2).join("; ")}\n\n`;
    }

    return section;
  }

  /**
   * Clean up processed experience files
   */
  private async cleanupProcessedFiles(
    processedFiles: ExperienceFile[]
  ): Promise<number> {
    let deletedCount = 0;

    // Keep only the most recent 10 files for reference
    const filesToDelete = processedFiles.slice(10);

    for (const file of filesToDelete) {
      try {
        const filePath = join(this.experiencesPath, `${file.id}.json`);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Failed to delete ${file.id}:`, error));
      }
    }

    return deletedCount;
  }

  /**
   * Get extraction statistics
   */
  async getExtractionStats(): Promise<{
    totalExperienceFiles: number;
    oldestFile: string;
    newestFile: string;
    estimatedCleanup: number;
  }> {
    const files = await glob("exp-*.json", { cwd: this.experiencesPath });

    if (files.length === 0) {
      return {
        totalExperienceFiles: 0,
        oldestFile: "none",
        newestFile: "none",
        estimatedCleanup: 0,
      };
    }

    const sortedFiles = files.sort();

    return {
      totalExperienceFiles: files.length,
      oldestFile: sortedFiles[0],
      newestFile: sortedFiles[sortedFiles.length - 1],
      estimatedCleanup: Math.max(0, files.length - 10),
    };
  }
}

// CLI integration
export async function runExperienceExtraction(
  projectRoot: string = process.cwd()
): Promise<void> {
  const editor = new ExperienceEditor(projectRoot);

  console.log(chalk.blue("📊 Checking extraction statistics..."));
  const stats = await editor.getExtractionStats();

  console.log(
    chalk.gray(`Total experience files: ${stats.totalExperienceFiles}`)
  );
  console.log(chalk.gray(`Estimated cleanup: ${stats.estimatedCleanup} files`));

  if (stats.totalExperienceFiles > 0) {
    const result = await editor.extractKnowledge();

    console.log(chalk.green("\n✅ Knowledge Extraction Summary:"));
    console.log(
      chalk.cyan(`  📋 Patterns extracted: ${result.patternsExtracted}`)
    );
    console.log(chalk.cyan(`  📁 Files processed: ${result.filesProcessed}`));
    console.log(chalk.cyan(`  🗑️  Files cleaned up: ${result.filesDeleted}`));
    console.log(
      chalk.cyan(
        `  📚 Documentation updated: ${result.documentationUpdated.length}`
      )
    );

    if (result.documentationUpdated.length > 0) {
      console.log(chalk.gray("    Updated files:"));
      for (const file of result.documentationUpdated) {
        console.log(chalk.gray(`    - ${file}`));
      }
    }
  } else {
    console.log(chalk.yellow("No experience files found for extraction."));
  }
}
