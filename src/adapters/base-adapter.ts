// Base adapter interface for all AI platforms
// This provides a unified interface for Cursor, Gemini, Claude, etc.

import { Role, Task, ProjectKnowledge, Interaction } from "../core/types.js";

export interface PlatformCapabilities {
  name: string;
  version: string;
  supportsContext: boolean;
  supportsRoleSelection: boolean;
  supportsToolDetection: boolean;
  supportsLearning: boolean;
  maxContextLength: number;
  features: string[];
}

export interface ProjectContext {
  projectType: string;
  tools: ToolConfiguration;
  patterns: ProjectPattern[];
  conventions: Convention[];
  environment: EnvironmentInfo;
}

export interface ToolConfiguration {
  package_managers: ToolInfo[];
  build_tools: ToolInfo[];
  test_frameworks: ToolInfo[];
  lint_tools: ToolInfo[];
  container_tools: ToolInfo[];
  task_runners: ToolInfo[];
}

export interface ToolInfo {
  name: string;
  command: string;
  detection: string[];
  priority: number;
  description: string;
  examples: string[];
}

export interface ProjectPattern {
  name: string;
  description: string;
  examples: string[];
  frequency: number;
  context: string[];
}

export interface Convention {
  type: "naming" | "structure" | "style" | "process";
  description: string;
  examples: string[];
  enforcement: "strict" | "recommended" | "optional";
}

export interface EnvironmentInfo {
  runtime: string;
  framework: string;
  database: string;
  deployment: string;
  os: string;
  shell: string;
}

export interface AIAdapter {
  name: string;
  version: string;

  // Core functionality
  generateContext(): Promise<ProjectContext>;
  selectRole(task: Task): Promise<Role>;
  executeTask(task: Task, role: Role): Promise<string>;

  // Platform-specific features
  getPlatformCapabilities(): PlatformCapabilities;
  adaptToPlatform(content: string): string;

  // Learning and evolution
  learnFromInteraction(interaction: Interaction): Promise<void>;
  updateKnowledge(knowledge: ProjectKnowledge): Promise<void>;

  // Configuration generation
  generateConfiguration(): Promise<string>;
  validateConfiguration(config: string): Promise<boolean>;
}

export abstract class BaseAdapter implements AIAdapter {
  protected projectPath: string;
  protected roles: Role[];
  protected projectKnowledge: ProjectKnowledge;

  constructor(
    projectPath: string,
    roles: Role[],
    projectKnowledge: ProjectKnowledge
  ) {
    this.projectPath = projectPath;
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  abstract get name(): string;
  abstract get version(): string;

  // Core functionality implementation
  async generateContext(): Promise<ProjectContext> {
    const context: ProjectContext = {
      projectType: await this.detectProjectType(),
      tools: await this.detectTools(),
      patterns: await this.recognizePatterns(),
      conventions: await this.extractConventions(),
      environment: await this.detectEnvironment(),
    };

    return context;
  }

  async selectRole(_task: Task): Promise<Role> {
    // Implement role selection logic based on task keywords
    const matchingRoles = this.roles.filter((role) =>
      role.discoveryKeywords.some((keyword) =>
        _task.keywords.some((taskKeyword) =>
          taskKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    );

    if (matchingRoles.length === 0) {
      // Default to Code Assistant if no specific role matches
      return (
        this.roles.find((role) => role.name === "Code Assistant") ||
        this.roles[0]
      );
    }

    // Return the role with the highest keyword match score
    return matchingRoles[0];
  }

  async executeTask(_task: Task, _role: Role): Promise<string> {
    // This is a placeholder - actual implementation would be platform-specific
    return `Executing task "${_task.description}" with role "${_role.name}"`;
  }

  // Platform-specific features
  abstract getPlatformCapabilities(): PlatformCapabilities;
  abstract adaptToPlatform(_content: string): string;

  // Learning and evolution
  async learnFromInteraction(_interaction: Interaction): Promise<void> {
    // Record interaction for learning
    await this.recordInteraction(_interaction);

    // Update patterns based on successful interactions
    if (_interaction.feedback && _interaction.feedback.rating >= 4) {
      await this.updatePatterns(_interaction);
    }
  }

  async updateKnowledge(_knowledge: ProjectKnowledge): Promise<void> {
    this.projectKnowledge = _knowledge;
    await this.persistKnowledge(_knowledge);
  }

  // Configuration generation
  abstract generateConfiguration(): Promise<string>;

  async validateConfiguration(_config: string): Promise<boolean> {
    // Basic validation - can be overridden by specific adapters
    return _config.length > 0 && _config.includes("Cortex AI");
  }

  // Helper methods
  protected async detectProjectType(): Promise<string> {
    // Detect project type based on files
    const files = await this.scanProjectFiles();

    if (files.includes("package.json")) return "javascript";
    if (files.includes("pyproject.toml") || files.includes("requirements.txt"))
      return "python";
    if (files.includes("go.mod")) return "go";
    if (files.includes("Cargo.toml")) return "rust";

    return "unknown";
  }

  protected async detectTools(): Promise<ToolConfiguration> {
    const files = await this.scanProjectFiles();
    const tools: ToolConfiguration = {
      package_managers: [],
      build_tools: [],
      test_frameworks: [],
      lint_tools: [],
      container_tools: [],
      task_runners: [],
    };

    // Detect package managers
    if (files.includes("pyproject.toml")) {
      if (files.includes("uv.lock")) {
        tools.package_managers.push({
          name: "uv",
          command: "uv run",
          detection: ["pyproject.toml", "uv.lock"],
          priority: 1,
          description: "Fast Python package manager",
          examples: ["uv run pytest", "uv run ruff check"],
        });
      } else if (files.includes("poetry.lock")) {
        tools.package_managers.push({
          name: "poetry",
          command: "poetry run",
          detection: ["pyproject.toml", "poetry.lock"],
          priority: 1,
          description: "Python dependency management",
          examples: ["poetry run pytest", "poetry run black"],
        });
      }
    }

    if (files.includes("package.json")) {
      if (files.includes("nx.json")) {
        tools.package_managers.push({
          name: "nx",
          command: "nx run",
          detection: ["nx.json", "workspace.json"],
          priority: 1,
          description: "Nx monorepo build system",
          examples: ["nx test", "nx lint", "nx build"],
        });
      } else {
        tools.package_managers.push({
          name: "npm",
          command: "npm run",
          detection: ["package.json"],
          priority: 1,
          description: "Node.js package manager",
          examples: ["npm test", "npm run lint"],
        });
      }
    }

    // Detect container tools
    if (files.includes("docker-compose.yml") || files.includes("Dockerfile")) {
      tools.container_tools.push({
        name: "docker",
        command: "docker",
        detection: ["Dockerfile", "docker-compose.yml"],
        priority: 1,
        description: "Container platform",
        examples: ["docker build -t app .", "docker run app"],
      });
    }

    return tools;
  }

  protected async recognizePatterns(): Promise<ProjectPattern[]> {
    const patterns: ProjectPattern[] = [];

    // Analyze code structure for patterns
    const structurePatterns = await this.analyzeCodeStructure();
    patterns.push(...structurePatterns);

    return patterns;
  }

  protected async extractConventions(): Promise<Convention[]> {
    const conventions: Convention[] = [];

    // Extract naming conventions
    const namingConventions = await this.analyzeNamingConventions();
    conventions.push(...namingConventions);

    return conventions;
  }

  protected async detectEnvironment(): Promise<EnvironmentInfo> {
    return {
      runtime: await this.detectRuntime(),
      framework: await this.detectFramework(),
      database: await this.detectDatabase(),
      deployment: await this.detectDeployment(),
      os: process.platform,
      shell: process.env.SHELL || "unknown",
    };
  }

  // Abstract methods that must be implemented by specific adapters
  protected abstract scanProjectFiles(): Promise<string[]>;
  protected abstract analyzeCodeStructure(): Promise<ProjectPattern[]>;
  protected abstract analyzeNamingConventions(): Promise<Convention[]>;
  protected abstract detectRuntime(): Promise<string>;
  protected abstract detectFramework(): Promise<string>;
  protected abstract detectDatabase(): Promise<string>;
  protected abstract detectDeployment(): Promise<string>;
  protected abstract recordInteraction(
    _interaction: Interaction
  ): Promise<void>;
  protected abstract updatePatterns(_interaction: Interaction): Promise<void>;
  protected abstract persistKnowledge(
    _knowledge: ProjectKnowledge
  ): Promise<void>;
}
