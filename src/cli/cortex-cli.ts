import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { DynamicRoleDiscovery } from "../core/role-discovery.js";
import { IntelligentRoleSelector } from "../core/role-selector.js";
import { CursorAdapter } from "../core/cursor-adapter.js";
import { ProjectDetector } from "../core/project-detector.js";
import { Role, Task } from "../core/types.js";

export class CortexCLI {
  private projectPath: string;
  private roleDiscovery: DynamicRoleDiscovery;
  private roleSelector: IntelligentRoleSelector;
  private projectDetector: ProjectDetector;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.roleDiscovery = new DynamicRoleDiscovery(this.projectPath);
    this.roleSelector = new IntelligentRoleSelector([], {
      architecture: [],
      codingPatterns: [],
      technologyStack: [],
      conventions: [],
      constraints: [],
    });
    this.projectDetector = new ProjectDetector(this.projectPath);
  }

  /**
   * Initialize Cortex in the project
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue("🧠 Initializing Cortex AI Collaboration Brain..."));

    // Create necessary directories
    const dirs = [
      "docs/ai-collaboration/roles",
      "docs/ai-collaboration/templates",
      "docs/ai-collaboration/examples",
      ".cortex",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      await fs.ensureDir(fullPath);
      console.log(chalk.gray(`📁 Created directory: ${dir}`));
    }

    // Create initial README
    await this.createInitialReadme();

    // Create sample role
    await this.createSampleRole();

    console.log(chalk.green("\n🎉 Cortex initialization complete!"));
    console.log(chalk.yellow("\nNext steps:"));
    console.log(chalk.gray('1. Run "cortex discover" to analyze your project'));
    console.log(
      chalk.gray("2. Create custom roles in docs/ai-collaboration/roles/")
    );
    console.log(
      chalk.gray('3. Run "cortex generate-ide" to create IDE configurations')
    );
    console.log(chalk.gray('4. Run "cortex start" to begin AI collaboration'));
  }

  /**
   * One-click setup for Cortex
   */
  async setup(
    options: { quick?: boolean; config?: string } = {}
  ): Promise<void> {
    console.log(chalk.blue("🚀 Setting up Cortex AI Collaboration Brain..."));

    try {
      // Detect existing AI collaboration systems
      const detection = await this.projectDetector.detectExistingAI();

      console.log(chalk.green(`\n📊 Project Analysis:`));
      console.log(chalk.cyan(`   Project Type: ${detection.projectType}`));
      console.log(
        chalk.cyan(`   Existing AI: ${detection.existingAI ? "Yes" : "No"}`)
      );
      console.log(
        chalk.cyan(`   Existing Roles: ${detection.existingRoles.length}`)
      );
      console.log(
        chalk.cyan(
          `   IDE Configs: ${detection.ideConfigs.join(", ") || "None"}`
        )
      );

      if (detection.recommendations.length > 0) {
        console.log(chalk.yellow("\n💡 Recommendations:"));
        for (const recommendation of detection.recommendations) {
          console.log(chalk.gray(`   • ${recommendation}`));
        }
      }

      // Auto-configure the project
      if (detection.autoConfig) {
        console.log(chalk.blue("\n⚙️ Auto-configuring project..."));
        await this.projectDetector.autoConfigure();
      } else {
        console.log(chalk.yellow("\n⚠️ Manual configuration required"));
        await this.initialize();
      }

      // Discover roles and patterns
      console.log(chalk.blue("\n🔍 Discovering roles and patterns..."));
      await this.discover();

      // Generate IDE configurations
      console.log(chalk.blue("\n🛠️ Generating IDE configurations..."));
      await this.generateIDE();

      console.log(chalk.green("\n🎉 Cortex setup complete!"));
      console.log(chalk.yellow("\nNext steps:"));
      console.log(chalk.gray("1. Open your IDE - configurations are ready"));
      console.log(
        chalk.gray("2. Start chatting with AI - roles are automatically loaded")
      );
      console.log(
        chalk.gray("3. Customize roles in docs/ai-collaboration/roles/")
      );
      console.log(
        chalk.gray('4. Run "cortex start" for interactive collaboration')
      );
    } catch (error) {
      console.error(chalk.red(`\n❌ Setup failed: ${error}`));
      throw error;
    }
  }

  /**
   * Integrate with existing AI collaboration systems
   */
  async integrate(
    options: { roles?: boolean; workflows?: boolean } = {}
  ): Promise<void> {
    console.log(
      chalk.blue("🔗 Integrating with existing AI collaboration systems...")
    );

    const detection = await this.projectDetector.detectExistingAI();

    if (detection.existingAI) {
      console.log(chalk.green("📁 Existing AI collaboration system detected"));

      if (options.roles) {
        console.log(chalk.blue("\n🎭 Analyzing existing roles..."));
        for (const role of detection.existingRoles) {
          console.log(chalk.gray(`   • ${role.name} - ${role.description}`));
        }
      }

      await this.projectDetector.autoConfigure();
      console.log(chalk.green("✅ Integration complete!"));
    } else {
      console.log(chalk.yellow("⚠️ No existing AI collaboration system found"));
      console.log(chalk.gray("Run 'cortex setup' to create a new system"));
    }
  }

  /**
   * Discover roles and patterns
   */
  async discover(verbose: boolean = false): Promise<void> {
    console.log(chalk.blue("🔍 Discovering roles and patterns..."));

    const result = await this.roleDiscovery.discover();

    console.log(chalk.green(`\n📊 Discovery Results:`));
    console.log(chalk.cyan(`   Roles found: ${result.roles.length}`));
    console.log(chalk.cyan(`   Patterns found: ${result.patterns.length}`));

    if (result.roles.length > 0) {
      console.log(chalk.yellow("\n🎭 Discovered Roles:"));
      for (const role of result.roles) {
        console.log(chalk.gray(`   • ${role.name} - ${role.description}`));
        if (verbose) {
          console.log(
            chalk.gray(`     Keywords: ${role.discoveryKeywords.join(", ")}`)
          );
          console.log(
            chalk.gray(`     Capabilities: ${role.capabilities.length}`)
          );
        }
      }
    }

    if (result.patterns.length > 0) {
      console.log(chalk.yellow("\n🔧 Discovered Patterns:"));
      for (const pattern of result.patterns) {
        console.log(
          chalk.gray(`   • ${pattern.name} - ${pattern.description}`)
        );
        if (verbose) {
          console.log(
            chalk.gray(
              `     Frequency: ${Math.round(pattern.frequency * 100)}%`
            )
          );
        }
      }
    }

    if (result.recommendations.length > 0) {
      console.log(chalk.yellow("\n💡 Recommendations:"));
      for (const recommendation of result.recommendations) {
        console.log(chalk.gray(`   • ${recommendation}`));
      }
    }

    // Update role selector with discovered knowledge
    this.roleSelector.updateKnowledge(result.roles, result.knowledge);
  }

  /**
   * Generate IDE configurations
   */
  async generateIDE(): Promise<void> {
    console.log(chalk.blue("🛠️ Generating IDE configurations..."));

    // First discover roles and patterns
    const result = await this.roleDiscovery.discover();

    if (result.roles.length === 0) {
      console.log(
        chalk.yellow(
          '⚠️ No roles found. Run "cortex discover" first to analyze your project.'
        )
      );
      return;
    }

    const cursorAdapter = new CursorAdapter(
      this.projectPath,
      result.roles,
      result.knowledge
    );

    // Generate Cursor configurations
    await cursorAdapter.generateCursorRules();

    console.log(
      chalk.green("\n✅ Cursor configurations generated successfully!")
    );
    console.log(chalk.yellow("\nGenerated files:"));
    console.log(
      chalk.gray("   • .cursor/rules/cortex.mdc (dynamic role reader)")
    );
    console.log(chalk.gray("   • .cursor/settings.json"));

    console.log(chalk.yellow("\nNext steps:"));
    console.log(
      chalk.gray("1. Open Cursor - rules will be automatically loaded")
    );
    console.log(
      chalk.gray(
        "2. Start chatting - AI will dynamically read roles from docs/"
      )
    );
    console.log(
      chalk.gray(
        "3. To modify roles, edit files in docs/ai-collaboration/roles/"
      )
    );
  }

  /**
   * Generate a new role template
   */
  async generateRole(
    name?: string,
    template?: string,
    outputPath?: string
  ): Promise<void> {
    let roleName = name;
    let roleTemplate = template;

    if (!roleName) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Enter role name:",
          validate: (input) =>
            input.trim().length > 0 ? true : "Role name is required",
        },
      ]);
      roleName = answer.name;
    }

    if (!roleTemplate) {
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "template",
          message: "Select template type:",
          choices: [
            { name: "Basic Assistant", value: "basic" },
            { name: "Security Specialist", value: "security" },
            { name: "Architecture Designer", value: "architecture" },
            { name: "Code Reviewer", value: "reviewer" },
            { name: "Performance Optimizer", value: "performance" },
          ],
        },
      ]);
      roleTemplate = answer.template;
    }

    // Ensure we have valid values
    if (!roleName || !roleTemplate) {
      console.error(chalk.red("❌ Role name and template are required"));
      return;
    }

    const roleContent = this.generateRoleTemplate(roleName, roleTemplate);
    const fileName = `${roleName.toLowerCase().replace(/\s+/g, "-")}.md`;
    const filePath =
      outputPath ||
      path.join(this.projectPath, "docs/ai-collaboration/roles", fileName);

    await fs.writeFile(filePath, roleContent);
    console.log(chalk.green(`✅ Role template created: ${filePath}`));
  }

  /**
   * Analyze project patterns
   */
  async analyzePatterns(outputFile?: string): Promise<void> {
    console.log(chalk.blue("🔍 Analyzing project patterns..."));

    const patterns = await this.roleDiscovery.analyzeProjectPatterns();

    console.log(chalk.green(`\n📊 Pattern Analysis Results:`));
    console.log(chalk.cyan(`   Patterns found: ${patterns.length}`));

    for (const pattern of patterns) {
      console.log(chalk.yellow(`\n🔧 ${pattern.name}`));
      console.log(chalk.gray(`   Description: ${pattern.description}`));
      console.log(
        chalk.gray(`   Frequency: ${Math.round(pattern.frequency * 100)}%`)
      );
      console.log(chalk.gray(`   Context: ${pattern.context.join(", ")}`));

      if (pattern.examples.length > 0) {
        console.log(chalk.gray(`   Examples: ${pattern.examples.join(", ")}`));
      }
    }

    if (outputFile) {
      const analysis = {
        timestamp: new Date().toISOString(),
        patterns,
        summary: {
          totalPatterns: patterns.length,
          averageFrequency:
            patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length,
        },
      };

      await fs.writeJson(outputFile, analysis, { spaces: 2 });
      console.log(chalk.green(`\n📄 Analysis saved to: ${outputFile}`));
    }
  }

  /**
   * Start interactive collaboration session
   */
  async startCollaboration(): Promise<void> {
    console.log(chalk.blue("🧠 Starting Cortex AI Collaboration..."));

    // First discover roles
    await this.discover();

    console.log(chalk.yellow("\n💬 Interactive Session Started"));
    console.log(chalk.gray('Type "exit" to end session\n'));

    // Simple interactive loop
    let running = true;
    while (running) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "query",
          message: chalk.cyan("Ask Cortex:"),
          validate: (input) =>
            input.trim().length > 0 ? true : "Please enter a question",
        },
      ]);

      const query = answer.query.trim();

      if (query.toLowerCase() === "exit") {
        console.log(chalk.yellow("👋 Goodbye!"));
        running = false;
        break;
      }

      // Process the query
      await this.processQuery(query);
    }
  }

  /**
   * Process user query and select appropriate role
   */
  private async processQuery(query: string): Promise<void> {
    const task: Task = {
      id: Date.now().toString(),
      description: query,
      keywords: this.extractKeywords(query),
      context: {
        projectType: "general",
        technologyStack: [],
        userPreferences: {
          codingStyle: "standard",
          preferredLanguages: [],
          teamSize: 1,
          projectMaturity: "startup",
        },
      },
      priority: "medium",
      complexity: "moderate",
    };

    try {
      const selectedRole = await this.roleSelector.selectOptimalRole(task);

      console.log(chalk.green(`\n🎭 Selected Role: ${selectedRole.name}`));
      console.log(chalk.gray(`   ${selectedRole.description}`));

      // Simulate AI response
      const response = this.generateAIResponse(selectedRole, query);
      console.log(chalk.blue(`\n🤖 ${selectedRole.name}:`));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`\n❌ Error processing query: ${error}`));
    }

    console.log(""); // Empty line for readability
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);

    return words.filter(
      (word) =>
        word.length > 2 && !stopWords.has(word) && /^[a-zA-Z]+$/.test(word)
    );
  }

  /**
   * Generate AI response based on role
   */
  private generateAIResponse(role: Role, query: string): string {
    const responses: Record<string, string> = {
      "Security Specialist": `As a security specialist, I'll help you with "${query}". Let me analyze the security implications and provide best practices.`,
      "Architecture Designer": `From an architecture perspective, "${query}" involves several design considerations. Let me outline the key architectural patterns.`,
      "Code Reviewer": `As a code reviewer, I'll examine "${query}" for code quality, best practices, and potential improvements.`,
      "Performance Optimizer": `For performance optimization regarding "${query}", I'll analyze bottlenecks and suggest improvements.`,
      "General Assistant": `I'll help you with "${query}". Let me provide guidance and suggestions based on best practices.`,
    };

    return responses[role.name] || responses["General Assistant"];
  }

  /**
   * Create initial README
   */
  private async createInitialReadme(): Promise<void> {
    const readmeContent = `# AI Collaboration

This directory contains AI collaboration configuration and role definitions for Cortex.

## Structure

- \`roles/\` - AI role definitions
- \`templates/\` - Role and workflow templates
- \`examples/\` - Example implementations

## Getting Started

1. Define roles in the \`roles/\` directory
2. Run \`cortex discover\` to analyze your project
3. Run \`cortex generate-ide\` to create IDE configurations
4. Start collaboration with \`cortex start\`

For more information, visit: https://github.com/RikaiDev/cortex
`;

    const readmePath = path.join(
      this.projectPath,
      "docs/ai-collaboration/README.md"
    );
    await fs.writeFile(readmePath, readmeContent);
  }

  /**
   * Create sample role
   */
  private async createSampleRole(): Promise<void> {
    const sampleRoleContent = `---
name: "Code Assistant"
description: "General-purpose code assistant for development tasks"
keywords: ["code", "development", "programming", "assistant"]
capabilities:
  - "Code review and suggestions"
  - "Bug identification and fixes"
  - "Best practices guidance"
  - "Documentation help"
version: "1.0.0"
tags: ["general", "assistant"]
priority: 1
---

# Role: Code Assistant

## Description
A general-purpose AI assistant specialized in helping with various development tasks, code review, and best practices guidance.

## Capabilities
- Code review and suggestions
- Bug identification and fixes
- Best practices guidance
- Documentation help
- Problem solving
- Code optimization

## Keywords
code, development, programming, assistant, review, bug, fix, optimize

## Implementation Guidelines
- Provide clear, actionable suggestions
- Explain reasoning behind recommendations
- Consider project-specific patterns and conventions
- Focus on maintainable and readable code

## Examples

### Code Review
**Input:** "Review this function for potential issues"
**Output:** "I'll analyze the function for common issues like error handling, performance, and maintainability."

### Bug Fix
**Input:** "Help me fix this bug"
**Output:** "Let me examine the code and identify the root cause of the issue."
`;

    const sampleRolePath = path.join(
      this.projectPath,
      "docs/ai-collaboration/roles/code-assistant.md"
    );
    await fs.writeFile(sampleRolePath, sampleRoleContent);
  }

  /**
   * Generate role template content
   */
  private generateRoleTemplate(name: string, template: string): string {
    const templates = {
      basic: {
        description: "General-purpose assistant for various tasks",
        keywords: ["general", "assistant", "help"],
        capabilities: [
          "General assistance and guidance",
          "Problem solving",
          "Documentation help",
        ],
      },
      security: {
        description: "Security specialist for code and system security",
        keywords: [
          "security",
          "vulnerability",
          "authentication",
          "authorization",
        ],
        capabilities: [
          "Security code review",
          "Vulnerability assessment",
          "Authentication and authorization guidance",
          "Security best practices",
        ],
      },
      architecture: {
        description: "Architecture designer for system design and patterns",
        keywords: ["architecture", "design", "patterns", "structure"],
        capabilities: [
          "System architecture design",
          "Design pattern recommendations",
          "Scalability planning",
          "Technology stack guidance",
        ],
      },
      reviewer: {
        description: "Code reviewer for quality and best practices",
        keywords: ["review", "quality", "best practices", "code"],
        capabilities: [
          "Code quality review",
          "Best practices enforcement",
          "Performance optimization",
          "Maintainability assessment",
        ],
      },
      performance: {
        description: "Performance optimizer for system and code optimization",
        keywords: ["performance", "optimization", "speed", "efficiency"],
        capabilities: [
          "Performance analysis",
          "Optimization strategies",
          "Bottleneck identification",
          "Efficiency improvements",
        ],
      },
    };

    const templateData =
      templates[template as keyof typeof templates] || templates.basic;

    return `---
name: "${name}"
description: "${templateData.description}"
keywords: ${JSON.stringify(templateData.keywords)}
capabilities:
${templateData.capabilities.map((cap) => `  - "${cap}"`).join("\n")}
version: "1.0.0"
tags: ["${template}"]
priority: 1
---

# Role: ${name}

## Description
${templateData.description}

## Capabilities
${templateData.capabilities.map((cap) => `- ${cap}`).join("\n")}

## Keywords
${templateData.keywords.join(", ")}

## Implementation Guidelines
- Provide specialized guidance in your area of expertise
- Consider project-specific context and requirements
- Explain reasoning behind recommendations
- Focus on practical, actionable advice

## Examples

### Example 1
**Input:** "Help me with a typical task in this area"
**Output:** "I'll help you with this task using best practices and proven approaches."

### Example 2
**Input:** "Review this implementation"
**Output:** "Let me analyze this implementation from a ${template} perspective."
`;
  }
}
