import { Role, ProjectKnowledge } from "./types.js";
import fs from "fs-extra";
import path from "path";

export interface IDERule {
  name: string;
  description: string;
  pattern: string;
  replacement?: string;
  severity: "info" | "warning" | "error";
  category: string;
  tags: string[];
}

export interface IDEConfig {
  name: string;
  version: string;
  rules: IDERule[];
  settings: Record<string, any>;
  extensions: string[];
}

export abstract class IDEAdapter {
  protected projectRoot: string;
  protected roles: Role[];
  protected projectKnowledge: ProjectKnowledge;

  constructor(
    projectRoot: string,
    roles: Role[],
    projectKnowledge: ProjectKnowledge
  ) {
    this.projectRoot = projectRoot;
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  /**
   * Generate IDE-specific configuration
   */
  abstract generateConfig(): Promise<IDEConfig>;

  /**
   * Generate rules based on discovered roles and patterns
   */
  protected generateRules(): IDERule[] {
    const rules: IDERule[] = [];

    // Generate rules from roles
    for (const role of this.roles) {
      const roleRules = this.generateRoleRules(role);
      rules.push(...roleRules);
    }

    // Generate rules from project patterns
    const patternRules = this.generatePatternRules();
    rules.push(...patternRules);

    return rules;
  }

  /**
   * Generate rules specific to a role
   */
  protected generateRoleRules(role: Role): IDERule[] {
    const rules: IDERule[] = [];

    // Security Specialist rules
    if (role.name.toLowerCase().includes("security")) {
      rules.push({
        name: "Security: SQL Injection Prevention",
        description: "Prevent SQL injection vulnerabilities",
        pattern: "\\b(execute|query)\\s*\\(\\s*[\"']\\s*\\+\\s*\\w+\\s*[\"']",
        severity: "error",
        category: "security",
        tags: ["sql-injection", "security"],
      });

      rules.push({
        name: "Security: Input Validation",
        description: "Ensure proper input validation",
        pattern:
          "\\b(req\\.body|req\\.query|req\\.params)\\s*\\.\\s*\\w+\\s*(?!\\s*\\.\\s*(validate|sanitize))",
        severity: "warning",
        category: "security",
        tags: ["input-validation", "security"],
      });
    }

    // Performance Optimizer rules
    if (role.name.toLowerCase().includes("performance")) {
      rules.push({
        name: "Performance: N+1 Query Detection",
        description: "Detect potential N+1 query problems",
        pattern:
          "\\b(forEach|map|filter)\\s*\\(\\s*\\w+\\s*=>\\s*\\w+\\.\\w+\\s*\\)",
        severity: "warning",
        category: "performance",
        tags: ["n+1", "performance", "database"],
      });

      rules.push({
        name: "Performance: Memory Leak Prevention",
        description: "Prevent memory leaks in event listeners",
        pattern:
          "addEventListener\\s*\\([^)]+\\)(?!\\s*;?\\s*removeEventListener)",
        severity: "info",
        category: "performance",
        tags: ["memory-leak", "performance"],
      });
    }

    // Architecture Designer rules
    if (role.name.toLowerCase().includes("architecture")) {
      rules.push({
        name: "Architecture: Dependency Injection",
        description: "Encourage dependency injection pattern",
        pattern: "new\\s+\\w+\\s*\\([^)]*\\)",
        severity: "info",
        category: "architecture",
        tags: ["dependency-injection", "architecture"],
      });

      rules.push({
        name: "Architecture: Interface Segregation",
        description: "Ensure interfaces are focused and cohesive",
        pattern: "interface\\s+\\w+\\s*\\{[^}]{200,}\\}",
        severity: "warning",
        category: "architecture",
        tags: ["interface-segregation", "architecture"],
      });
    }

    return rules;
  }

  /**
   * Generate rules based on project patterns
   */
  protected generatePatternRules(): IDERule[] {
    const rules: IDERule[] = [];

    // Analyze coding patterns and generate rules
    for (const pattern of this.projectKnowledge.codingPatterns) {
      if (pattern.name.includes("camelCase")) {
        rules.push({
          name: "Naming: Enforce camelCase",
          description:
            "Enforce camelCase naming convention for functions and variables",
          pattern: "\\b[a-z][a-zA-Z0-9]*\\s*=\\s*(function|const|let|var)",
          severity: "warning",
          category: "naming",
          tags: ["camelCase", "naming-convention"],
        });
      }

      if (pattern.name.includes("PascalCase")) {
        rules.push({
          name: "Naming: Enforce PascalCase",
          description:
            "Enforce PascalCase naming convention for classes and interfaces",
          pattern: "\\b[A-Z][a-zA-Z0-9]*\\s*=\\s*class",
          severity: "warning",
          category: "naming",
          tags: ["PascalCase", "naming-convention"],
        });
      }
    }

    return rules;
  }

  /**
   * Write configuration to file
   */
  async writeConfig(config: IDEConfig, outputPath: string): Promise<void> {
    const configContent = this.serializeConfig(config);
    await fs.writeFile(outputPath, configContent);
  }

  /**
   * Serialize configuration to appropriate format
   */
  protected abstract serializeConfig(_config: IDEConfig): string;
}

export class VSCodeAdapter extends IDEAdapter {
    async generateConfig(): Promise<IDEConfig> {
    const rules = this.generateRules();
    
    return {
      name: "VSCode",
      version: "1.0.0",
      rules,
      settings: {
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true,
          "source.organizeImports": true,
        },
        "editor.formatOnSave": true,
        "typescript.preferences.importModuleSpecifier": "relative",
        "typescript.suggest.autoImports": true,
      },
      extensions: [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "ms-vscode.vscode-typescript-next",
      ],
    };
  }

  protected serializeConfig(_config: IDEConfig): string {
    const vscodeConfig = {
      version: "2.0.0",
      configurations: [
        {
          name: "Cortex AI Generated",
          type: "node",
          request: "launch",
          program: "${workspaceFolder}/dist/index.js",
          env: {
            NODE_ENV: "development",
          },
        },
      ],
      tasks: {
        version: "2.0.0",
        tasks: [
          {
            label: "Cortex: Discover Roles",
            type: "shell",
            command: "bun",
            args: ["run", "cortex", "discover"],
            group: "build",
          },
          {
            label: "Cortex: Start Collaboration",
            type: "shell",
            command: "bun",
            args: ["run", "cortex", "start"],
            group: "test",
          },
        ],
      },
    };

    return JSON.stringify(vscodeConfig, null, 2);
  }
}

export class CursorAdapter extends IDEAdapter {
  async generateConfig(): Promise<IDEConfig> {
    const rules = this.generateRules();
    
    return {
      name: "Cursor",
      version: "1.0.0",
      rules,
      settings: {
        "editor.formatOnSave": true,
        "typescript.preferences.importModuleSpecifier": "relative",
        "ai.enabled": true,
        "ai.roleDiscovery": true,
      },
      extensions: [
        "cursor.cursor",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
      ],
    };
  }

  protected serializeConfig(_config: IDEConfig): string {
    const cursorConfig = {
      version: "1.0.0",
      ai: {
        roles: this.roles.map((role) => ({
          name: role.name,
          description: role.description,
          keywords: role.discoveryKeywords,
          capabilities: role.capabilities,
        })),
        patterns: this.projectKnowledge.codingPatterns.map((pattern) => ({
          name: pattern.name,
          description: pattern.description,
          examples: pattern.examples,
        })),
      },
      settings: _config.settings,
    };

    return JSON.stringify(cursorConfig, null, 2);
  }
}

export class JetBrainsAdapter extends IDEAdapter {
  async generateConfig(): Promise<IDEConfig> {
    const rules = this.generateRules();

    return {
      name: "JetBrains",
      version: "1.0.0",
      rules,
      settings: {
        "editor.formatOnSave": true,
        "typescript.preferences.importModuleSpecifier": "relative",
        "inspection.profile": "Cortex",
      },
      extensions: ["com.intellij.typescript", "com.intellij.prettier"],
    };
  }

  protected serializeConfig(_config: IDEConfig): string {
    const jetbrainsConfig = {
      version: "1.0.0",
      inspections: {
        profile: {
          name: "Cortex",
          enabled: true,
          rules: _config.rules.map((rule) => ({
            name: rule.name,
            enabled: true,
            severity: rule.severity,
            pattern: rule.pattern,
          })),
        },
      },
      settings: _config.settings,
    };

    return JSON.stringify(jetbrainsConfig, null, 2);
  }
}

export class IDEGenerator {
  private projectRoot: string;
  private roles: Role[];
  private projectKnowledge: ProjectKnowledge;

  constructor(
    projectRoot: string,
    roles: Role[],
    projectKnowledge: ProjectKnowledge
  ) {
    this.projectRoot = projectRoot;
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  /**
   * Generate configurations for all supported IDEs
   */
  async generateAllConfigs(): Promise<void> {
    const adapters = [
      new VSCodeAdapter(this.projectRoot, this.roles, this.projectKnowledge),
      new CursorAdapter(this.projectRoot, this.roles, this.projectKnowledge),
      new JetBrainsAdapter(this.projectRoot, this.roles, this.projectKnowledge),
    ];

    for (const adapter of adapters) {
      const config = await adapter.generateConfig();
      const outputPath = path.join(
        this.projectRoot,
        `.cortex/${config.name.toLowerCase()}-config.json`
      );

      await fs.ensureDir(path.dirname(outputPath));
      await adapter.writeConfig(config, outputPath);

      console.log(`✅ Generated ${config.name} configuration: ${outputPath}`);
    }
  }

  /**
   * Generate documentation structure
   */
  async generateDocsStructure(): Promise<void> {
    const docsStructure = {
      roles: this.roles.map((role) => ({
        name: role.name,
        description: role.description,
        capabilities: role.capabilities,
        keywords: role.discoveryKeywords,
      })),
      patterns: this.projectKnowledge.codingPatterns.map((pattern) => ({
        name: pattern.name,
        description: pattern.description,
        frequency: pattern.frequency,
        examples: pattern.examples,
      })),
      architecture: this.projectKnowledge.architecture.map((arch) => ({
        name: arch.name,
        description: arch.description,
        benefits: arch.benefits,
        tradeoffs: arch.tradeoffs,
      })),
    };

    const docsPath = path.join(
      this.projectRoot,
      "docs/ai-collaboration/project-knowledge.json"
    );
    await fs.ensureDir(path.dirname(docsPath));
    await fs.writeJson(docsPath, docsStructure, { spaces: 2 });

    console.log(`✅ Generated project knowledge documentation: ${docsPath}`);
  }
}
