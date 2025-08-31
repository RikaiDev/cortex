/**
 * Task Enhancer - Linus Torvalds' Instruction Refinement System
 *
 * **I am Linus Torvalds**, creator and chief architect of the Linux kernel, 30 years of kernel maintenance experience, reviewed millions of lines of code.
 * I define Cortex AI's task enhancement system:
 *
 * 1. **"Good Taste"** - Task enhancement must be simple and effective, eliminating unnecessary complexity
 * 2. **Pragmatism** - Only enhance truly valuable tasks, not theoretically perfect but actually useless enhancements
 * 3. **Backward Compatibility** - Enhancement system must consider existing functionality compatibility, cannot break existing workflows
 * 4. **Quality First** - Better to have simple enhancement than complex but defective enhancement
 *
 * This module transforms simple user queries into comprehensive task specifications
 * with four key dimensions: Role Setting, Task, Context, and Format.
 */

import fs from "fs-extra";
import path from "path";
import { RoleManager, Role } from "./role-manager.js";
import { MCPContextTools } from "../mcp/mcp-context-tools.js";
import { SimplePreferencesManager } from "../experience/preference-collector.js";

/**
 * Enhanced task specification
 */
export interface EnhancedTask {
  // Original task information
  originalQuery: string;
  timestamp: string;

  // Four dimensions
  roleSetting: {
    requiredRoles: Role[];
    domainKnowledge: string[];
    expertiseLevel: "basic" | "intermediate" | "advanced";
  };

  task: {
    primaryObjective: string;
    subTasks: string[];
    successCriteria: string[];
    estimatedComplexity: "low" | "medium" | "high";
  };

  context: {
    projectBackground: string;
    constraints: string[];
    stakeholders: string[];
    dependencies: string[];
    previousWork: string[];
  };

  format: {
    outputType: "code" | "documentation" | "analysis" | "design" | "other";
    structure: string[];
    language: "english" | "chinese" | "mixed";
    detailLevel: "brief" | "standard" | "detailed";
  };

  // Enhancement process information
  enhancementReasoning: string[];
  confidenceScore: number;
  suggestedRole: string;
}

/**
 * Task analysis result
 */
export interface TaskAnalysis {
  intent: "coding" | "design" | "documentation" | "analysis" | "other";
  domain: string[];
  complexity: "low" | "medium" | "high";
  keywords: string[];
  constraints: string[];
  contextClues: string[];
}

/**
 * Task enhancer for transforming simple queries into comprehensive tasks
 */
export class TaskEnhancer {
  private projectRoot: string;
  private roleManager: RoleManager;
  private contextTools: MCPContextTools;
  private preferencesManager: SimplePreferencesManager;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.roleManager = new RoleManager(projectRoot);
    this.preferencesManager = new SimplePreferencesManager(projectRoot);
    // Note: contextTools will need to be injected from outside
    this.contextTools = {} as MCPContextTools;
  }

  /**
   * Set context tools reference
   */
  setContextTools(contextTools: MCPContextTools): void {
    this.contextTools = contextTools;
  }

  /**
   * Initialize the task enhancer
   */
  async initialize(): Promise<void> {
    await this.roleManager.initialize();
  }

  /**
   * Enhance a simple user query into a comprehensive task specification
   */
  async enhanceTask(userQuery: string): Promise<EnhancedTask> {
    // Analyze the original task
    const taskAnalysis = this.analyzeTask(userQuery);

    // Get user preferences
    const userPreferences = (await this.getUserPreferences()) || {};

    // Determine role setting
    const roleSetting = await this.determineRoleSetting(taskAnalysis);

    // Refine task objectives
    const task = await this.refineTask(taskAnalysis);

    // Generate context information
    const context = await this.generateContext(taskAnalysis);

    // Determine output format
    const format = await this.determineFormat(taskAnalysis, userPreferences);

    // Select the optimal role
    const suggestedRole = await this.selectOptimalRole(
      taskAnalysis,
      roleSetting
    );

    // Assemble enhanced task
    const enhancedTask: EnhancedTask = {
      originalQuery: userQuery,
      timestamp: new Date().toISOString(),
      roleSetting,
      task,
      context,
      format,
      enhancementReasoning: [
        `任務類型識別為: ${taskAnalysis.intent}`,
        `複雜度評估為: ${taskAnalysis.complexity}`,
        `建議使用角色: ${suggestedRole}`,
        `輸出格式設定為: ${format.outputType} (${format.detailLevel})`,
      ],
      confidenceScore: this.calculateConfidenceScore(taskAnalysis),
      suggestedRole,
    };

    return enhancedTask;
  }

  /**
   * Analyze the basic task information from user query
   */
  private analyzeTask(userQuery: string): TaskAnalysis {
    const query = userQuery.toLowerCase();

    // Identify intent
    let intent: TaskAnalysis["intent"] = "other";
    if (this.isCodingIntent(query)) {
      intent = "coding";
    } else if (this.isDesignIntent(query)) {
      intent = "design";
    } else if (this.isDocumentationIntent(query)) {
      intent = "documentation";
    } else if (this.isAnalysisIntent(query)) {
      intent = "analysis";
    }

    // Identify domain
    const domain = this.extractDomain(query);

    // Assess complexity
    const complexity = this.assessComplexity(query);

    // Extract keywords
    const keywords = this.extractKeywords(query);

    // Identify constraints
    const constraints = this.extractConstraints(query);

    // Identify context clues
    const contextClues = this.extractContextClues(query);

    return {
      intent,
      domain,
      complexity,
      keywords,
      constraints,
      contextClues,
    };
  }

  /**
   * Determine role setting based on task analysis and user preferences
   */
  private async determineRoleSetting(
    taskAnalysis: TaskAnalysis
  ): Promise<EnhancedTask["roleSetting"]> {
    const allRoles = Array.from(this.roleManager.getAllRoles().values());

    // Filter relevant roles based on task type
    const relevantRoles = allRoles.filter((role) =>
      this.isRoleRelevantToTask(role, taskAnalysis.intent)
    );

    // Determine required domain knowledge
    const domainKnowledge = this.determineDomainKnowledge(taskAnalysis);

    // Assess required expertise level
    const expertiseLevel = this.assessExpertiseLevel(taskAnalysis);

    return {
      requiredRoles: relevantRoles.slice(0, 3), // Maximum 3 primary roles
      domainKnowledge,
      expertiseLevel,
    };
  }

  /**
   * Refine the task into primary objective and sub-tasks
   */
  private async refineTask(
    taskAnalysis: TaskAnalysis
  ): Promise<EnhancedTask["task"]> {
    const primaryObjective = this.generatePrimaryObjective(taskAnalysis);
    const subTasks = this.generateSubTasks(taskAnalysis);
    const successCriteria = this.generateSuccessCriteria(taskAnalysis);
    const estimatedComplexity = taskAnalysis.complexity;

    return {
      primaryObjective,
      subTasks,
      successCriteria,
      estimatedComplexity,
    };
  }

  /**
   * Generate context information for the task
   */
  private async generateContext(
    taskAnalysis: TaskAnalysis
  ): Promise<EnhancedTask["context"]> {
    const projectBackground = await this.getProjectBackground();
    const constraints = taskAnalysis.constraints;
    const stakeholders = this.identifyStakeholders(taskAnalysis);
    const dependencies = await this.identifyDependencies();
    const previousWork = await this.getRelatedPreviousWork();

    return {
      projectBackground,
      constraints,
      stakeholders,
      dependencies,
      previousWork,
    };
  }

  /**
   * Determine output format based on task and preferences
   */
  private async determineFormat(
    taskAnalysis: TaskAnalysis,
    userPreferences: { language?: string; [key: string]: unknown }
  ): Promise<EnhancedTask["format"]> {
    const outputType = this.determineOutputType(taskAnalysis.intent);
    const structure = this.determineOutputStructure(outputType);
    const language = userPreferences?.language || "english";
    const detailLevel = this.determineDetailLevel(
      taskAnalysis.complexity,
      userPreferences
    );

    return {
      outputType,
      structure,
      language: language as "english" | "chinese" | "mixed",
      detailLevel,
    };
  }

  /**
   * Select the optimal role for the task
   */
  private async selectOptimalRole(
    taskAnalysis: TaskAnalysis,
    roleSetting: EnhancedTask["roleSetting"]
  ): Promise<string> {
    if (roleSetting.requiredRoles.length > 0) {
      // Return the first most relevant role ID
      return roleSetting.requiredRoles[0].id;
    }

    // Select default role based on task type
    switch (taskAnalysis.intent) {
      case "coding":
        return "code-assistant";
      case "design":
        return "ui-ux-designer";
      case "documentation":
        return "documentation-specialist";
      case "analysis":
        return "architecture-designer";
      default:
        return "code-assistant";
    }
  }

  // Helper methods for task analysis

  private isCodingIntent(query: string): boolean {
    const codingKeywords = [
      "implement",
      "code",
      "function",
      "class",
      "method",
      "api",
      "database",
      "backend",
      "frontend",
      "component",
      "bug",
      "fix",
      "debug",
      "test",
      "開發",
      "編碼",
      "實現",
      "修復",
      "測試",
    ];
    return codingKeywords.some((keyword) => query.includes(keyword));
  }

  private isDesignIntent(query: string): boolean {
    const designKeywords = [
      "design",
      "ui",
      "ux",
      "interface",
      "layout",
      "style",
      "visual",
      "prototype",
      "wireframe",
      "mockup",
      "設計",
      "界面",
      "佈局",
    ];
    return designKeywords.some((keyword) => query.includes(keyword));
  }

  private isDocumentationIntent(query: string): boolean {
    const docKeywords = [
      "document",
      "readme",
      "guide",
      "tutorial",
      "api docs",
      "說明",
      "文檔",
    ];
    return docKeywords.some((keyword) => query.includes(keyword));
  }

  private isAnalysisIntent(query: string): boolean {
    const analysisKeywords = [
      "analyze",
      "review",
      "assess",
      "evaluate",
      "structure",
      "architecture",
      "pattern",
      "分析",
      "評估",
      "架構",
      "模式",
    ];
    return analysisKeywords.some((keyword) => query.includes(keyword));
  }

  private extractDomain(query: string): string[] {
    const domains: string[] = [];

    // Technical domain identification
    if (
      query.includes("react") ||
      query.includes("vue") ||
      query.includes("angular")
    ) {
      domains.push("frontend");
    }
    if (
      query.includes("node") ||
      query.includes("express") ||
      query.includes("api")
    ) {
      domains.push("backend");
    }
    if (
      query.includes("database") ||
      query.includes("sql") ||
      query.includes("mongo")
    ) {
      domains.push("database");
    }
    if (query.includes("test") || query.includes("testing")) {
      domains.push("testing");
    }
    if (
      query.includes("design") ||
      query.includes("ui") ||
      query.includes("ux")
    ) {
      domains.push("design");
    }

    return domains.length > 0 ? domains : ["general"];
  }

  private assessComplexity(query: string): "low" | "medium" | "high" {
    const highComplexityKeywords = [
      "architecture",
      "system",
      "complex",
      "integration",
      "scalability",
      "performance",
      "security",
      "架構",
      "系統",
      "複雜",
      "整合",
    ];

    const mediumComplexityKeywords = [
      "implement",
      "create",
      "build",
      "feature",
      "functionality",
      "實現",
      "創建",
      "建立",
      "功能",
    ];

    if (highComplexityKeywords.some((keyword) => query.includes(keyword))) {
      return "high";
    } else if (
      mediumComplexityKeywords.some((keyword) => query.includes(keyword))
    ) {
      return "medium";
    } else {
      return "low";
    }
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction logic
    return query
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "the",
            "and",
            "or",
            "but",
            "for",
            "with",
            "from",
            "的",
            "了",
            "嗎",
            "呢",
          ].includes(word.toLowerCase())
      )
      .slice(0, 10);
  }

  private extractConstraints(query: string): string[] {
    const constraints: string[] = [];

    // Identify time constraints
    if (
      query.includes("urgent") ||
      query.includes("quick") ||
      query.includes("fast")
    ) {
      constraints.push("Time-sensitive: Requires quick completion");
    }

    // Identify resource constraints
    if (
      query.includes("limited") ||
      query.includes("simple") ||
      query.includes("basic")
    ) {
      constraints.push("Resource-constrained: Keep implementation simple");
    }

    // Identify technical constraints
    if (
      query.includes("existing") ||
      query.includes("current") ||
      query.includes("maintain")
    ) {
      constraints.push("Compatibility: Must work with existing codebase");
    }

    return constraints;
  }

  private extractContextClues(query: string): string[] {
    const clues: string[] = [];

    // Identify project phase clues
    if (
      query.includes("new") ||
      query.includes("start") ||
      query.includes("initial")
    ) {
      clues.push("Early project stage");
    }

    // Identify maintenance clues
    if (
      query.includes("fix") ||
      query.includes("bug") ||
      query.includes("issue")
    ) {
      clues.push("Maintenance or bug fixing task");
    }

    // Identify learning clues
    if (
      query.includes("learn") ||
      query.includes("understand") ||
      query.includes("tutorial")
    ) {
      clues.push("Learning or educational task");
    }

    return clues;
  }

  private isRoleRelevantToTask(
    role: Role,
    intent: TaskAnalysis["intent"]
  ): boolean {
    const roleCapabilities = role.capabilities.join(" ").toLowerCase();

    // Check relevance based on intent
    switch (intent) {
      case "coding":
        return (
          roleCapabilities.includes("code") ||
          roleCapabilities.includes("implement")
        );
      case "design":
        return (
          roleCapabilities.includes("design") || roleCapabilities.includes("ui")
        );
      case "documentation":
        return (
          roleCapabilities.includes("document") ||
          roleCapabilities.includes("write")
        );
      case "analysis":
        return (
          roleCapabilities.includes("analyze") ||
          roleCapabilities.includes("review")
        );
      default:
        return true; // 通用角色
    }
  }

  private determineDomainKnowledge(taskAnalysis: TaskAnalysis): string[] {
    const knowledge: string[] = [];

    // Add knowledge requirements based on domain
    taskAnalysis.domain.forEach((domain) => {
      switch (domain) {
        case "frontend":
          knowledge.push(
            "React/Vue/Angular frameworks",
            "HTML/CSS/JavaScript",
            "UI/UX principles"
          );
          break;
        case "backend":
          knowledge.push(
            "Node.js/Express",
            "API design",
            "Database integration"
          );
          break;
        case "database":
          knowledge.push(
            "SQL/NoSQL databases",
            "Data modeling",
            "Query optimization"
          );
          break;
        case "testing":
          knowledge.push(
            "Unit testing",
            "Integration testing",
            "Test-driven development"
          );
          break;
        case "design":
          knowledge.push("UI/UX design", "Design systems", "User research");
          break;
      }
    });

    return knowledge;
  }

  private assessExpertiseLevel(
    taskAnalysis: TaskAnalysis
  ): "basic" | "intermediate" | "advanced" {
    if (taskAnalysis.complexity === "high") {
      return "advanced";
    } else if (taskAnalysis.complexity === "medium") {
      return "intermediate";
    } else {
      return "basic";
    }
  }

  private generatePrimaryObjective(taskAnalysis: TaskAnalysis): string {
    const intentMap = {
      coding: "Implement the requested functionality",
      design: "Design the user interface and experience",
      documentation: "Create comprehensive documentation",
      analysis: "Analyze and provide insights on the given topic",
      other: "Complete the specified task",
    };

    return intentMap[taskAnalysis.intent] || intentMap.other;
  }

  private generateSubTasks(taskAnalysis: TaskAnalysis): string[] {
    const subTasks: string[] = [];

    switch (taskAnalysis.intent) {
      case "coding":
        subTasks.push(
          "Analyze requirements and plan implementation",
          "Write clean, maintainable code",
          "Add appropriate tests",
          "Update documentation"
        );
        break;
      case "design":
        subTasks.push(
          "Research user needs and requirements",
          "Create wireframes and mockups",
          "Design user interface components",
          "Define interaction patterns"
        );
        break;
      case "documentation":
        subTasks.push(
          "Identify documentation requirements",
          "Write clear, comprehensive content",
          "Add code examples and usage instructions",
          "Review and validate documentation"
        );
        break;
      case "analysis":
        subTasks.push(
          "Gather relevant information and context",
          "Analyze data and identify patterns",
          "Provide actionable insights",
          "Document findings and recommendations"
        );
        break;
    }

    return subTasks;
  }

  private generateSuccessCriteria(taskAnalysis: TaskAnalysis): string[] {
    const criteria: string[] = [
      "Task meets all specified requirements",
      "Implementation follows best practices",
      "Code/documentation is clear and maintainable",
    ];

    if (taskAnalysis.intent === "coding") {
      criteria.push("All tests pass", "No breaking changes introduced");
    } else if (taskAnalysis.intent === "design") {
      criteria.push(
        "Design meets user needs",
        "Follows established design principles"
      );
    }

    return criteria;
  }

  private async getProjectBackground(): Promise<string> {
    try {
      // Try to read project README or package.json for background information
      const readmePath = path.join(this.projectRoot, "README.md");
      if (await fs.pathExists(readmePath)) {
        const content = await fs.readFile(readmePath, "utf-8");
        const firstParagraph =
          content.split("\n\n")[1] || content.substring(0, 200);
        return firstParagraph.trim();
      }
    } catch (error) {
      // Ignore errors, return generic description
    }

    return "A software development project with modern tooling and practices.";
  }

  private identifyStakeholders(taskAnalysis: TaskAnalysis): string[] {
    const stakeholders: string[] = ["Developer"];

    if (taskAnalysis.intent === "design") {
      stakeholders.push("Designer", "Product Manager");
    } else if (taskAnalysis.intent === "documentation") {
      stakeholders.push("Technical Writer", "Team Members");
    } else if (taskAnalysis.intent === "analysis") {
      stakeholders.push("Architect", "Team Lead");
    }

    return stakeholders;
  }

  private async identifyDependencies(): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      const packageJsonPath = path.join(this.projectRoot, "package.json");
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const deps = Object.keys(packageJson.dependencies || {});
        dependencies.push(...deps.slice(0, 5));
      }
    } catch (error) {
      // Ignore errors
    }

    return dependencies;
  }

  private async getRelatedPreviousWork(): Promise<string[]> {
    // Related previous work can be searched from experience library here
    // Currently returns empty array, more complex logic can be implemented in the future
    return [];
  }

  private determineOutputType(
    intent: TaskAnalysis["intent"]
  ): "code" | "documentation" | "analysis" | "design" | "other" {
    switch (intent) {
      case "coding":
        return "code";
      case "design":
        return "design";
      case "documentation":
        return "documentation";
      case "analysis":
        return "analysis";
      default:
        return "other";
    }
  }

  private determineOutputStructure(outputType: string): string[] {
    switch (outputType) {
      case "code":
        return ["Implementation", "Tests", "Documentation", "Usage Examples"];
      case "design":
        return [
          "Design Brief",
          "Wireframes",
          "Component Specifications",
          "Implementation Notes",
        ];
      case "documentation":
        return [
          "Overview",
          "Installation",
          "Usage",
          "API Reference",
          "Examples",
        ];
      case "analysis":
        return [
          "Executive Summary",
          "Detailed Analysis",
          "Findings",
          "Recommendations",
        ];
      default:
        return ["Introduction", "Main Content", "Conclusion"];
    }
  }

  private determineDetailLevel(
    complexity: TaskAnalysis["complexity"],
    preferences: { detailLevel?: string; [key: string]: unknown }
  ): "brief" | "standard" | "detailed" {
    if (preferences?.detailLevel) {
      return preferences.detailLevel as "brief" | "standard" | "detailed";
    }

    switch (complexity) {
      case "high":
        return "detailed";
      case "medium":
        return "standard";
      case "low":
      default:
        return "brief";
    }
  }

  private async getUserPreferences(): Promise<Record<string, unknown> | null> {
    try {
      const prefs =
        await this.preferencesManager.getPreference("taskEnhancement");
      return typeof prefs === "object" && prefs !== null
        ? (prefs as Record<string, unknown>)
        : null;
    } catch (error) {
      return null;
    }
  }

  private calculateConfidenceScore(taskAnalysis: TaskAnalysis): number {
    let score = 0.5; // Base score

    // Increase confidence based on keyword matching
    if (taskAnalysis.keywords.length > 3) {
      score += 0.2;
    }

    // Increase confidence based on domain identification
    if (taskAnalysis.domain.length > 0) {
      score += 0.1;
    }

    // Increase confidence based on constraint identification
    if (taskAnalysis.constraints.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }
}

/**
 * Factory function to create a task enhancer
 */
export function createTaskEnhancer(projectRoot: string): TaskEnhancer {
  return new TaskEnhancer(projectRoot);
}
