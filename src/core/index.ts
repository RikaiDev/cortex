/**
 * Export all core modules
 */

// Experience modules - simplified, no complex preference management needed

// Common types - explicitly export to avoid conflicts
export {
  type ProjectKnowledge,
  type ThinkingStep,
  type MessageProcessor,
  type Role as BaseRole, // Rename the common Role to avoid conflict
} from "./common/types.js";

// MCP modules
export { CortexMCPServer, createCortexMCPServer } from "./mcp/server.js";

// Project modules - simplified

// Simple Cortex Core for MCP
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

export interface Experience {
  input: string;
  output: string;
  category: string;
  tags?: string[];
  timestamp: string;
}

export class CortexCore {
  private projectRoot: string;
  private experiencesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesDir = path.join(projectRoot, ".cortex", "experiences");
  }

  async findRelevantExperiences(
    query: string,
    maxItems: number = 5,
    timeRange: number = 30
  ): Promise<Experience[]> {
    try {
      await fs.ensureDir(this.experiencesDir);

      if (!(await fs.pathExists(this.experiencesDir))) {
        return [];
      }

      const files = await fs.readdir(this.experiencesDir);
      const experiences: Experience[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.experiencesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const experience = JSON.parse(content) as Experience;

          // Check time range
          const expDate = new Date(experience.timestamp);
          if (expDate < cutoffDate) continue;

          // Simple relevance check
          const searchText =
            `${experience.input} ${experience.output}`.toLowerCase();
          const queryWords = query.toLowerCase().split(" ");
          const matches = queryWords.some((word) => searchText.includes(word));

          if (matches) {
            experiences.push(experience);
          }
        }
      }

      // Sort by recency and return top results
      return experiences
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, maxItems);
    } catch (error) {
      console.error("Error finding relevant experiences:", error);
      return [];
    }
  }

  async recordExperience(experience: Experience): Promise<void> {
    try {
      await fs.ensureDir(this.experiencesDir);

      const hash = crypto
        .createHash("sha256")
        .update(`${experience.input}${experience.output}${Date.now()}`)
        .digest("hex");

      const filePath = path.join(this.experiencesDir, `${hash}.json`);
      await fs.writeJson(filePath, experience, { spaces: 2 });
    } catch (error) {
      console.error("Error recording experience:", error);
      throw error;
    }
  }
}
