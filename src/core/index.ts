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
/** @public */
export { CortexMCPServer, createCortexMCPServer } from "./mcp/server.js";

// Project modules - simplified

// Simple Cortex Core for MCP
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

// Multi-Role Pattern workflow integration types and interfaces
/** @public */
export enum WorkflowStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  BLOCKED = "blocked",
}

// Import workflow types from workflow-integration
import type {
  WorkflowState,
  WorkflowExecution,
} from "./workflow-integration.js";

// Multi-Role Pattern workflow integration
// Uses existing role definitions from .cortex/roles/ directory
// Adds workflow state management and handoff mechanisms directly in CortexCore

/**
 * Role Database - Manages available AI collaboration roles
 */
export class RoleDatabase {
  private roles: Map<string, RoleDefinition> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load all available roles from templates directory
   */
  async loadRoles(): Promise<void> {
    const rolesDir = path.join(this.projectRoot, "templates", "roles");

    try {
      if (!(await fs.pathExists(rolesDir))) {
        console.warn("Roles directory not found:", rolesDir);
        return;
      }

      const files = await fs.readdir(rolesDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        const roleId = file.replace(".md", "");
        const roleDefinition = await this.parseRoleDefinition(
          path.join(rolesDir, file),
          roleId
        );

        if (roleDefinition) {
          this.roles.set(roleId, roleDefinition);
        }
      }

      console.log(`Loaded ${this.roles.size} roles from ${rolesDir}`);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  }

  /**
   * Parse role definition from markdown file
   */
  private async parseRoleDefinition(
    filePath: string,
    roleId: string
  ): Promise<RoleDefinition | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      // Extract role information from markdown content
      const name =
        this.extractSection(content, "## Description") ||
        this.extractSection(content, "# ") ||
        roleId;

      const specialty = this.extractSpecialty(content);
      const description = this.extractDescription(content);
      const keywords = this.extractKeywords(content);
      const systemPrompt = this.extractSystemPrompt(content);

      return {
        id: roleId,
        name,
        specialty,
        description,
        keywords,
        systemPrompt,
        source: "templates/roles",
      };
    } catch (error) {
      console.error(`Error parsing role definition for ${roleId}:`, error);
      return null;
    }
  }

  /**
   * Extract section content from markdown
   */
  private extractSection(content: string, sectionHeader: string): string {
    const lines = content.split("\n");
    let inSection = false;
    let sectionContent = "";

    for (const line of lines) {
      if (line.startsWith(sectionHeader)) {
        inSection = true;
        continue;
      }

      if (inSection) {
        if (line.startsWith("#") && !line.startsWith("##")) {
          break; // Next major section
        }

        if (line.trim()) {
          sectionContent += line.trim() + " ";
        }
      }
    }

    return sectionContent.trim();
  }

  /**
   * Extract specialty from role content
   */
  private extractSpecialty(content: string): string {
    const specialtyPatterns = [
      /specialty.*?:?\s*([^.\n]*)/i,
      /expertise.*?:?\s*([^.\n]*)/i,
      /focus.*?:?\s*([^.\n]*)/i,
    ];

    for (const pattern of specialtyPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return "General Purpose";
  }

  /**
   * Extract description from role content
   */
  private extractDescription(content: string): string {
    // Try to get the first meaningful paragraph after the title
    const lines = content.split("\n");
    let description = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line &&
        !line.startsWith("#") &&
        !line.startsWith("=") &&
        line.length > 20
      ) {
        description = line;
        break;
      }
    }

    return description || "Specialized AI collaboration role";
  }

  /**
   * Extract keywords from role content
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];

    // Look for explicit keywords sections
    const keywordsSection =
      this.extractSection(content, "## Skills") ||
      this.extractSection(content, "## Capabilities") ||
      this.extractSection(content, "## Keywords");

    if (keywordsSection) {
      const skillLines = keywordsSection.split(/[,\n]/);
      for (const skill of skillLines) {
        const trimmed = skill.trim();
        if (trimmed && trimmed.length > 2) {
          keywords.push(trimmed.toLowerCase());
        }
      }
    }

    // Extract from capabilities list items
    const capabilityMatches = content.match(/-\s*([^-\n]*)/g);
    if (capabilityMatches) {
      for (const match of capabilityMatches.slice(0, 10)) {
        // Limit to first 10
        const capability = match.replace(/-\s*/, "").trim().toLowerCase();
        if (capability && capability.length > 2) {
          keywords.push(capability);
        }
      }
    }

    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  /**
   * Extract system prompt from role content
   */
  private extractSystemPrompt(content: string): string {
    // Look for the role's core philosophy or description as system prompt
    const philosophy = this.extractSection(content, "## Core Philosophy");
    if (philosophy) {
      return `You are ${this.extractDescription(content)}. ${philosophy}`;
    }

    const description = this.extractDescription(content);
    return `You are ${description}. Follow the principles and best practices defined for this role.`;
  }

  /**
   * Get all available roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  /**
   * Find best matching role for a query
   */
  findBestRole(query: string): RoleDefinition | null {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower
      .split(/\s+/)
      .filter((word) => word.length > 2);

    let bestMatch: RoleDefinition | null = null;
    let highestScore = 0;

    for (const role of this.roles.values()) {
      const score = this.calculateRoleScore(role, queryWords);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = role;
      }
    }

    // Only return a role if it has a reasonable score (> 0.1)
    return highestScore > 0.1 ? bestMatch : null;
  }

  /**
   * Calculate relevance score for a role against query terms
   */
  private calculateRoleScore(
    role: RoleDefinition,
    queryWords: string[]
  ): number {
    let score = 0;

    // Check role name and specialty matches
    const roleText =
      `${role.name} ${role.specialty} ${role.description}`.toLowerCase();

    for (const word of queryWords) {
      // Exact matches get higher scores
      if (roleText.includes(word)) {
        score += 2;
      }

      // Partial matches get lower scores
      if (
        role.keywords.some(
          (keyword) => keyword.includes(word) || word.includes(keyword)
        )
      ) {
        score += 1;
      }
    }

    // Bonus for multiple keyword matches in description
    const descriptionMatches = queryWords.filter((word) =>
      role.description.toLowerCase().includes(word)
    ).length;

    score += descriptionMatches * 0.5;

    // Normalize score by role's keyword count to avoid bias toward roles with many keywords
    if (role.keywords.length > 0) {
      score = score / Math.sqrt(role.keywords.length);
    }

    return score;
  }
}

/**
 * Role definition interface
 */
export interface RoleDefinition {
  id: string;
  name: string;
  specialty: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
  source: string;
}

/**
 * Unified Knowledge Manager - Integrates all knowledge sources
 */
export class UnifiedKnowledgeManager {
  private projectRoot: string;
  private docsDir: string;
  private internalDir: string;
  private templatesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.docsDir = path.join(projectRoot, "docs");
    this.internalDir = path.join(projectRoot, "internal");
    this.templatesDir = path.join(projectRoot, "templates");
  }

  /**
   * Search across all knowledge sources
   */
  async searchKnowledge(
    query: string,
    maxResults: number = 5
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    // Search project documentation
    const docResults = await this.searchDocumentation(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...docResults);

    // Search internal knowledge
    const internalResults = await this.searchInternalKnowledge(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...internalResults);

    // Search templates
    const templateResults = await this.searchTemplates(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...templateResults);

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  /**
   * Search project documentation
   */
  private async searchDocumentation(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const files = await fs.readdir(this.docsDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        const filePath = path.join(this.docsDir, file);
        const content = await fs.readFile(filePath, "utf-8");

        const relevance = this.calculateRelevance(content, query);
        if (relevance > 0) {
          results.push({
            title: file.replace(".md", ""),
            content: this.extractRelevantSnippet(content, query),
            source: "docs",
            relevance,
            path: filePath,
          });
        }
      }
    } catch (error) {
      console.warn("Error searching documentation:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Search internal knowledge
   */
  private async searchInternalKnowledge(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const subdirs = ["ai-collaboration", "experiences"];
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.internalDir, subdir);
        if (await fs.pathExists(subdirPath)) {
          const files = await fs.readdir(subdirPath);
          const mdFiles = files.filter((file) => file.endsWith(".md"));

          for (const file of mdFiles) {
            const filePath = path.join(subdirPath, file);
            const content = await fs.readFile(filePath, "utf-8");

            const relevance = this.calculateRelevance(content, query);
            if (relevance > 0) {
              results.push({
                title: file.replace(".md", ""),
                content: this.extractRelevantSnippet(content, query),
                source: `internal/${subdir}`,
                relevance,
                path: filePath,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error searching internal knowledge:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Search role templates
   */
  private async searchTemplates(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const rolesDir = path.join(this.templatesDir, "roles");
      if (await fs.pathExists(rolesDir)) {
        const files = await fs.readdir(rolesDir);
        const mdFiles = files.filter((file) => file.endsWith(".md"));

        for (const file of mdFiles) {
          const filePath = path.join(rolesDir, file);
          const content = await fs.readFile(filePath, "utf-8");

          const relevance = this.calculateRelevance(content, query);
          if (relevance > 0) {
            results.push({
              title: file.replace(".md", ""),
              content: this.extractRelevantSnippet(content, query),
              source: "templates/roles",
              relevance,
              path: filePath,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Error searching templates:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Calculate relevance score for content against query
   */
  private calculateRelevance(content: string, query: string): number {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(" ");

    let score = 0;
    for (const word of queryWords) {
      if (lowerContent.includes(word)) {
        score += 1;
      }
    }

    // Boost score for exact phrase matches
    if (lowerContent.includes(lowerQuery)) {
      score *= 2;
    }

    return score;
  }

  /**
   * Extract relevant snippet from content
   */
  private extractRelevantSnippet(content: string, query: string): string {
    const lines = content.split("\n");
    const lowerQuery = query.toLowerCase();

    // Find lines containing query terms
    const relevantLines = lines.filter((line) =>
      line.toLowerCase().includes(lowerQuery.split(" ")[0])
    );

    if (relevantLines.length === 0) {
      return content.substring(0, 200) + "...";
    }

    return relevantLines.slice(0, 3).join("\n").substring(0, 300) + "...";
  }
}

/**
 * Knowledge search result
 */
export interface KnowledgeResult {
  title: string;
  content: string;
  source: string;
  relevance: number;
  path: string;
}

/**
 * Dynamic Rule System - Adapts behavior based on project context
 */
export class DynamicRuleSystem {
  private projectRoot: string;
  private knowledgeManager: UnifiedKnowledgeManager;

  constructor(projectRoot: string, knowledgeManager: UnifiedKnowledgeManager) {
    this.projectRoot = projectRoot;
    this.knowledgeManager = knowledgeManager;
  }

  /**
   * Analyze project context and generate dynamic rules
   */
  async generateDynamicRules(context: string): Promise<DynamicRule[]> {
    const rules: DynamicRule[] = [];

    // Search for relevant project knowledge
    const knowledgeResults = await this.knowledgeManager.searchKnowledge(
      context,
      3
    );

    // Generate rules based on found knowledge
    for (const result of knowledgeResults) {
      const rule = this.extractRuleFromKnowledge(result, context);
      if (rule) {
        rules.push(rule);
      }
    }

    // Add default rules if no specific knowledge found
    if (rules.length === 0) {
      rules.push(...this.getDefaultRules());
    }

    return rules;
  }

  /**
   * Extract a rule from knowledge result
   */
  private extractRuleFromKnowledge(
    result: KnowledgeResult,
    context: string
  ): DynamicRule | null {
    // Analyze the knowledge content to extract relevant rules
    const content = result.content.toLowerCase();
    const contextLower = context.toLowerCase();

    // Look for patterns that suggest specific rules
    if (content.includes("typescript") && contextLower.includes("typescript")) {
      return {
        id: `typescript-${result.source}`,
        priority: 8,
        condition: "typescript-related-task",
        action: "apply-typescript-best-practices",
        description: "Apply TypeScript best practices from project knowledge",
        source: result.source,
      };
    }

    if (content.includes("react") && contextLower.includes("react")) {
      return {
        id: `react-${result.source}`,
        priority: 8,
        condition: "react-related-task",
        action: "apply-react-patterns",
        description: "Apply React patterns from project knowledge",
        source: result.source,
      };
    }

    if (content.includes("test") && contextLower.includes("test")) {
      return {
        id: `testing-${result.source}`,
        priority: 7,
        condition: "testing-related-task",
        action: "apply-testing-practices",
        description: "Apply testing practices from project knowledge",
        source: result.source,
      };
    }

    return null;
  }

  /**
   * Get default rules when no specific knowledge is found
   */
  private getDefaultRules(): DynamicRule[] {
    return [
      {
        id: "general-code-quality",
        priority: 5,
        condition: "any-coding-task",
        action: "ensure-code-quality",
        description: "Ensure code quality standards are met",
        source: "default",
      },
      {
        id: "documentation-practice",
        priority: 4,
        condition: "complex-task",
        action: "document-solution",
        description: "Document complex solutions for future reference",
        source: "default",
      },
      {
        id: "testing-requirement",
        priority: 6,
        condition: "feature-implementation",
        action: "include-tests",
        description: "Include appropriate tests for new features",
        source: "default",
      },
    ];
  }

  /**
   * Apply dynamic rules to a given context
   */
  async applyRules(context: string): Promise<AppliedRule[]> {
    const rules = await this.generateDynamicRules(context);
    const appliedRules: AppliedRule[] = [];

    // Sort rules by priority (highest first)
    rules.sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (this.shouldApplyRule(rule, context)) {
        appliedRules.push({
          rule,
          applied: true,
          timestamp: new Date().toISOString(),
          context,
        });
      }
    }

    return appliedRules;
  }

  /**
   * Determine if a rule should be applied to the current context
   */
  private shouldApplyRule(rule: DynamicRule, context: string): boolean {
    const contextLower = context.toLowerCase();

    switch (rule.condition) {
      case "typescript-related-task":
        return (
          contextLower.includes("typescript") || contextLower.includes("type")
        );
      case "react-related-task":
        return (
          contextLower.includes("react") || contextLower.includes("component")
        );
      case "testing-related-task":
        return contextLower.includes("test") || contextLower.includes("spec");
      case "any-coding-task":
        return (
          contextLower.includes("code") || contextLower.includes("implement")
        );
      case "complex-task":
        return this.isComplexTask(context);
      case "feature-implementation":
        return (
          contextLower.includes("feature") || contextLower.includes("implement")
        );
      default:
        return false;
    }
  }

  /**
   * Determine if a task is complex based on context analysis
   */
  private isComplexTask(context: string): boolean {
    const complexityIndicators = [
      "architecture",
      "system",
      "design",
      "complex",
      "multiple",
      "integration",
      "optimization",
      "refactor",
      "large",
    ];

    const contextLower = context.toLowerCase();
    return complexityIndicators.some((indicator) =>
      contextLower.includes(indicator)
    );
  }
}

/**
 * Dynamic rule definition
 */
export interface DynamicRule {
  id: string;
  priority: number; // 1-10, higher = more important
  condition: string;
  action: string;
  description: string;
  source: string;
}

/**
 * Applied rule result
 */
export interface AppliedRule {
  rule: DynamicRule;
  applied: boolean;
  timestamp: string;
  context: string;
}

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
  private roleDatabase: RoleDatabase;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesDir = path.join(projectRoot, ".cortex", "experiences");
    this.roleDatabase = new RoleDatabase(projectRoot);
  }

  /**
   * Initialize the Cortex Core with role database
   */
  async initialize(): Promise<void> {
    await this.roleDatabase.loadRoles();
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

  /**
   * Create a new Multi-Role workflow
   */
  async createWorkflow(
    issueId: string,
    title: string,
    description: string
  ): Promise<WorkflowState> {
    const { WorkflowManager } = await import("./workflow-integration.js");
    const workflowManager = new WorkflowManager(this, this.projectRoot);
    return await workflowManager.createWorkflow(issueId, title, description);
  }

  /**
   * Execute the next role in a workflow
   */
  async executeNextRole(workflowId: string): Promise<WorkflowExecution> {
    const { WorkflowManager } = await import("./workflow-integration.js");
    const workflowManager = new WorkflowManager(this, this.projectRoot);
    return await workflowManager.executeWorkflowStep(workflowId);
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    const { WorkflowManager } = await import("./workflow-integration.js");
    const workflowManager = new WorkflowManager(this, this.projectRoot);
    return await workflowManager.getWorkflowState(workflowId);
  }

  /**
   * Select appropriate Cortex Master role based on query analysis
   */
  async selectCortexMaster(query?: string): Promise<{
    id: string;
    name: string;
    specialty: string;
    description: string;
    keywords: string[];
    systemPrompt: string;
  }> {
    // Ensure role database is loaded
    if (this.roleDatabase.getAllRoles().length === 0) {
      await this.roleDatabase.loadRoles();
    }

    // Find the best matching role for the query
    const bestRole = query ? this.roleDatabase.findBestRole(query) : null;

    if (bestRole) {
      return {
        id: bestRole.id,
        name: bestRole.name,
        specialty: bestRole.specialty,
        description: bestRole.description,
        keywords: bestRole.keywords,
        systemPrompt: bestRole.systemPrompt,
      };
    }

    // Fallback to a default role if no specific match found
    const defaultRole = this.roleDatabase
      .getAllRoles()
      .find((role) => role.id === "code-assistant");

    if (defaultRole) {
      return {
        id: defaultRole.id,
        name: defaultRole.name,
        specialty: defaultRole.specialty,
        description: defaultRole.description,
        keywords: defaultRole.keywords,
        systemPrompt: defaultRole.systemPrompt,
      };
    }

    // Ultimate fallback if no roles are available
    return {
      id: "general-assistant",
      name: "General Assistant",
      specialty: "General Purpose AI",
      description: "General purpose AI assistant for various tasks",
      keywords: ["general", "assistant", "help", "support"],
      systemPrompt:
        "You are a helpful AI assistant ready to assist with various tasks and questions.",
    };
  }

  /**
   * Get available roles for debugging/testing purposes
   */
  async getAvailableRoles(): Promise<RoleDefinition[]> {
    if (this.roleDatabase.getAllRoles().length === 0) {
      await this.roleDatabase.loadRoles();
    }
    return this.roleDatabase.getAllRoles();
  }

  /**
   * Enhance context with relevant experiences
   */
  async enhanceContext(
    query: string,
    maxItems: number = 5,
    timeRange: number = 30
  ): Promise<string> {
    const experiences = await this.findRelevantExperiences(
      query,
      maxItems,
      timeRange
    );

    if (experiences.length === 0) {
      return "No relevant historical experiences found.";
    }

    return experiences
      .map(
        (exp) =>
          `**Problem:** ${exp.input}\n**Solution:** ${exp.output}\n**Category:** ${exp.category}`
      )
      .join("\n\n");
  }
}
