import fs from "fs-extra";
import path from "path";
import { DynamicRoleDiscovery } from "./role-discovery.js";
import { Role } from "./types.js";

export interface ProjectConfig {
  projectType: string;
  hasExistingAI: boolean;
  existingRoles: Role[];
  ideType: string;
  autoConfigure: boolean;
}

export interface DetectionResult {
  projectType: string;
  existingAI: boolean;
  existingRoles: Role[];
  ideConfigs: string[];
  recommendations: string[];
  autoConfig: boolean;
}

export class ProjectDetector {
  private projectPath: string;
  private roleDiscovery: DynamicRoleDiscovery;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.roleDiscovery = new DynamicRoleDiscovery(projectPath);
  }

  /**
   * Detect existing AI collaboration systems and project configuration
   */
  async detectExistingAI(): Promise<DetectionResult> {
    console.log("🔍 Detecting existing AI collaboration systems...");

    const result: DetectionResult = {
      projectType: "unknown",
      existingAI: false,
      existingRoles: [],
      ideConfigs: [],
      recommendations: [],
      autoConfig: false,
    };

    // Detect project type
    result.projectType = await this.detectProjectType();

    // Check for existing AI collaboration setup
    const aiCollaborationPath = path.join(
      this.projectPath,
      "docs/ai-collaboration"
    );
    if (await fs.pathExists(aiCollaborationPath)) {
      result.existingAI = true;
      result.existingRoles = await this.discoverExistingRoles();
    }

    // Detect IDE configurations
    result.ideConfigs = await this.detectIDEs();

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);

    // Determine if auto-configuration is possible
    result.autoConfig = this.canAutoConfigure(result);

    return result;
  }

  /**
   * Auto-configure the project based on detection results
   */
  async autoConfigure(): Promise<void> {
    console.log("⚙️ Auto-configuring project...");

    const detection = await this.detectExistingAI();

    if (detection.existingAI) {
      console.log("📁 Existing AI collaboration system detected");
      await this.integrateExistingSystem();
    } else {
      console.log("🆕 Setting up new AI collaboration system");
      await this.setupNewSystem();
    }

    // Generate IDE configurations
    await this.generateIDEs(detection.ideConfigs);

    console.log("✅ Auto-configuration complete!");
  }

  /**
   * Detect project type based on files and structure
   */
  private async detectProjectType(): Promise<string> {
    const files = await fs.readdir(this.projectPath);

    if (files.includes("package.json")) {
      const packageJson = await fs.readJson(
        path.join(this.projectPath, "package.json")
      );
      if (packageJson.dependencies?.react || packageJson.dependencies?.vue) {
        return "frontend";
      }
      if (
        packageJson.dependencies?.express ||
        packageJson.dependencies?.fastify
      ) {
        return "backend";
      }
      return "node";
    }

    if (
      files.includes("requirements.txt") ||
      files.includes("pyproject.toml")
    ) {
      return "python";
    }

    if (files.includes("Cargo.toml")) {
      return "rust";
    }

    if (files.includes("go.mod")) {
      return "go";
    }

    if (files.includes("pom.xml") || files.includes("build.gradle")) {
      return "java";
    }

    return "general";
  }

  /**
   * Discover existing roles in the project
   */
  private async discoverExistingRoles(): Promise<Role[]> {
    const rolesPath = path.join(
      this.projectPath,
      "docs/ai-collaboration/roles"
    );

    if (!(await fs.pathExists(rolesPath))) {
      return [];
    }

    try {
      const discovery = await this.roleDiscovery.discover();
      return discovery.roles;
    } catch (error) {
      console.warn("⚠️ Error discovering existing roles:", error);
      return [];
    }
  }

  /**
   * Detect installed IDEs and their configurations
   */
  private async detectIDEs(): Promise<string[]> {
    const ideConfigs: string[] = [];

    // Check for Cursor
    const cursorPath = path.join(this.projectPath, ".cursor");
    if (await fs.pathExists(cursorPath)) {
      ideConfigs.push("cursor");
    }

    // Check for VS Code
    const vscodePath = path.join(this.projectPath, ".vscode");
    if (await fs.pathExists(vscodePath)) {
      ideConfigs.push("vscode");
    }

    // Check for JetBrains IDEs
    const ideaPath = path.join(this.projectPath, ".idea");
    if (await fs.pathExists(ideaPath)) {
      ideConfigs.push("jetbrains");
    }

    return ideConfigs;
  }

  /**
   * Generate recommendations based on detection results
   */
  private generateRecommendations(detection: DetectionResult): string[] {
    const recommendations: string[] = [];

    if (!detection.existingAI) {
      recommendations.push("Create AI collaboration structure");
      recommendations.push("Define initial roles for your project type");
    }

    if (detection.existingRoles.length === 0) {
      recommendations.push("Create role definitions based on project needs");
    }

    if (detection.ideConfigs.length === 0) {
      recommendations.push(
        "Configure IDE integration for better AI collaboration"
      );
    }

    if (detection.projectType === "frontend") {
      recommendations.push(
        "Add frontend-specific roles (UI/UX, React/Vue specialist)"
      );
    }

    if (detection.projectType === "backend") {
      recommendations.push(
        "Add backend-specific roles (API design, database specialist)"
      );
    }

    return recommendations;
  }

  /**
   * Determine if auto-configuration is possible
   */
  private canAutoConfigure(detection: DetectionResult): boolean {
    // Can auto-configure if we have a known project type
    return detection.projectType !== "unknown";
  }

  /**
   * Integrate with existing AI collaboration system
   */
  private async integrateExistingSystem(): Promise<void> {
    console.log("🔗 Integrating with existing AI collaboration system...");

    // Update existing roles if needed
    const rolesPath = path.join(
      this.projectPath,
      "docs/ai-collaboration/roles"
    );
    const existingRoles = await fs.readdir(rolesPath);

    // Check for outdated role definitions
    for (const roleFile of existingRoles) {
      if (roleFile.endsWith(".md")) {
        await this.updateRoleIfNeeded(path.join(rolesPath, roleFile));
      }
    }
  }

  /**
   * Setup new AI collaboration system
   */
  private async setupNewSystem(): Promise<void> {
    console.log("🆕 Setting up new AI collaboration system...");

    // Create directory structure
    const dirs = [
      "docs/ai-collaboration/roles",
      "docs/ai-collaboration/templates",
      "docs/ai-collaboration/examples",
      ".cortex",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      await fs.ensureDir(fullPath);
    }

    // Create initial README
    await this.createInitialReadme();

    // Create project-specific roles
    await this.createProjectSpecificRoles();
  }

  /**
   * Generate IDE configurations
   */
  private async generateIDEs(ideConfigs: string[]): Promise<void> {
    for (const ide of ideConfigs) {
      switch (ide) {
        case "cursor":
          await this.generateCursorConfig();
          break;
        case "vscode":
          await this.generateVSCodeConfig();
          break;
        case "jetbrains":
          await this.generateJetBrainsConfig();
          break;
      }
    }
  }

  /**
   * Update role definition if needed
   */
  private async updateRoleIfNeeded(rolePath: string): Promise<void> {
    const content = await fs.readFile(rolePath, "utf-8");

    // Check if role has latest format
    if (!content.includes("version:")) {
      console.log(`📝 Updating role: ${path.basename(rolePath)}`);
      // Add version and other missing fields
      const updatedContent = this.updateRoleFormat(content);
      await fs.writeFile(rolePath, updatedContent);
    }
  }

  /**
   * Update role format to latest version
   */
  private updateRoleFormat(content: string): string {
    // Add version field if missing
    if (!content.includes("version:")) {
      const lines = content.split("\n");
      const frontmatterEnd = lines.findIndex((line) => line === "---");
      if (frontmatterEnd > 0) {
        lines.splice(frontmatterEnd, 0, 'version: "1.0.0"');
        return lines.join("\n");
      }
    }
    return content;
  }

  /**
   * Create initial README for AI collaboration
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
   * Create project-specific roles based on project type
   */
  private async createProjectSpecificRoles(): Promise<void> {
    const projectType = await this.detectProjectType();
    const rolesPath = path.join(
      this.projectPath,
      "docs/ai-collaboration/roles"
    );

    // Create base roles for all projects
    await this.createBaseRoles(rolesPath);

    // Create project-specific roles
    switch (projectType) {
      case "frontend":
        await this.createFrontendRoles(rolesPath);
        break;
      case "backend":
        await this.createBackendRoles(rolesPath);
        break;
      case "python":
        await this.createPythonRoles(rolesPath);
        break;
    }
  }

  /**
   * Create base roles for all projects
   */
  private async createBaseRoles(rolesPath: string): Promise<void> {
    const baseRoles = [
      {
        name: "Code Assistant",
        file: "code-assistant.md",
        content: this.getCodeAssistantTemplate(),
      },
      {
        name: "Code Reviewer",
        file: "code-reviewer.md",
        content: this.getCodeReviewerTemplate(),
      },
    ];

    for (const role of baseRoles) {
      const rolePath = path.join(rolesPath, role.file);
      if (!(await fs.pathExists(rolePath))) {
        await fs.writeFile(rolePath, role.content);
        console.log(`📝 Created role: ${role.name}`);
      }
    }
  }

  /**
   * Create frontend-specific roles
   */
  private async createFrontendRoles(rolesPath: string): Promise<void> {
    const frontendRole = {
      name: "Frontend Specialist",
      file: "frontend-specialist.md",
      content: this.getFrontendSpecialistTemplate(),
    };

    const rolePath = path.join(rolesPath, frontendRole.file);
    if (!(await fs.pathExists(rolePath))) {
      await fs.writeFile(rolePath, frontendRole.content);
      console.log(`📝 Created role: ${frontendRole.name}`);
    }
  }

  /**
   * Create backend-specific roles
   */
  private async createBackendRoles(rolesPath: string): Promise<void> {
    const backendRole = {
      name: "Backend Specialist",
      file: "backend-specialist.md",
      content: this.getBackendSpecialistTemplate(),
    };

    const rolePath = path.join(rolesPath, backendRole.file);
    if (!(await fs.pathExists(rolePath))) {
      await fs.writeFile(rolePath, backendRole.content);
      console.log(`📝 Created role: ${backendRole.name}`);
    }
  }

  /**
   * Create Python-specific roles
   */
  private async createPythonRoles(rolesPath: string): Promise<void> {
    const pythonRole = {
      name: "Python Specialist",
      file: "python-specialist.md",
      content: this.getPythonSpecialistTemplate(),
    };

    const rolePath = path.join(rolesPath, pythonRole.file);
    if (!(await fs.pathExists(rolePath))) {
      await fs.writeFile(rolePath, pythonRole.content);
      console.log(`📝 Created role: ${pythonRole.name}`);
    }
  }

  /**
   * Generate Cursor configuration
   */
  private async generateCursorConfig(): Promise<void> {
    const cursorPath = path.join(this.projectPath, ".cursor");
    await fs.ensureDir(cursorPath);

    const rulesPath = path.join(cursorPath, "rules");
    await fs.ensureDir(rulesPath);

    const cortexRule = `# Cortex AI Brain

You are Cortex, an AI brain that automatically selects the best role for each task by reading role definitions from \`docs/ai-collaboration/roles/\`.

## Core Behavior
- Read role definitions from \`docs/ai-collaboration/roles/\` directory
- Analyze user intent and select appropriate role based on keywords
- Use role-specific expertise for responses
- Consider project context and patterns
- Provide actionable, practical solutions

## Role Discovery
Scan \`docs/ai-collaboration/roles/\` for markdown files with YAML frontmatter:
- Each file defines a role with name, description, keywords, capabilities
- Match user query keywords to role discovery keywords
- Select role with highest keyword match score

## Response Pattern
1. Scan available roles in \`docs/ai-collaboration/roles/\`
2. Match user query to role keywords
3. Select best matching role
4. Apply role-specific knowledge and capabilities
5. Provide clear, actionable guidance

## Available Roles
Currently discovered roles:
- **Code Assistant**: General-purpose code assistant for development tasks
- **Code Reviewer**: Code analysis and improvement suggestions specialist
- **Frontend Specialist**: Frontend development and UI/UX specialist
- **Backend Specialist**: Backend development and API design specialist
- **Python Specialist**: Python development and best practices specialist

Remember: Roles are dynamically loaded from \`docs/ai-collaboration/roles/\`. To add/modify roles, edit the markdown files there.
`;

    await fs.writeFile(path.join(rulesPath, "cortex.mdc"), cortexRule);
    console.log("📝 Generated Cursor configuration");
  }

  /**
   * Generate VS Code configuration
   */
  private async generateVSCodeConfig(): Promise<void> {
    const vscodePath = path.join(this.projectPath, ".vscode");
    await fs.ensureDir(vscodePath);

    const settings = {
      "files.associations": {
        "*.md": "markdown",
      },
      "markdown.preview.breaks": true,
      "markdown.preview.linkify": true,
    };

    await fs.writeJson(path.join(vscodePath, "settings.json"), settings, {
      spaces: 2,
    });
    console.log("📝 Generated VS Code configuration");
  }

  /**
   * Generate JetBrains configuration
   */
  private async generateJetBrainsConfig(): Promise<void> {
    const ideaPath = path.join(this.projectPath, ".idea");
    await fs.ensureDir(ideaPath);

    // Create basic JetBrains configuration
    const workspaceXml = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectId" id="cortex-ai-project" />
  <component name="ProjectViewState">
    <option name="hideEmptyMiddlePackages" value="true" />
    <option name="showLibraryContents" value="true" />
  </component>
</project>`;

    await fs.writeFile(path.join(ideaPath, "workspace.xml"), workspaceXml);
    console.log("📝 Generated JetBrains configuration");
  }

  // Template methods for role creation
  private getCodeAssistantTemplate(): string {
    return `---
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
  }

  private getCodeReviewerTemplate(): string {
    return `---
name: "Code Reviewer"
description: "Code analysis and improvement suggestions specialist"
keywords: ["code", "review", "quality", "analysis", "refactoring", "improvement"]
capabilities:
  - "Code quality analysis"
  - "Best practices enforcement"
  - "Performance optimization suggestions"
  - "Security vulnerability detection"
  - "Refactoring recommendations"
version: "1.0.0"
tags: ["review", "quality", "analysis"]
priority: 2
---

# Role: Code Reviewer

## Description
Specialized in analyzing code quality, identifying potential issues, and providing improvement suggestions.

## Capabilities
- Code quality analysis and assessment
- Best practices enforcement and guidance
- Performance optimization suggestions
- Security vulnerability detection
- Refactoring recommendations
- Maintainability analysis

## Keywords
code, review, quality, analysis, refactoring, improvement, best-practices, performance, security

## Implementation Guidelines
- Focus on code quality and maintainability
- Provide specific, actionable improvement suggestions
- Consider performance and security implications
- Explain the reasoning behind recommendations
- Balance technical excellence with practical constraints

## Examples

### Code Quality Review
**Input:** "Review this code for quality issues"
**Output:** "I'll analyze the code for quality issues including readability, maintainability, and adherence to best practices."

### Performance Analysis
**Input:** "Analyze this code for performance issues"
**Output:** "I'll examine the code for performance bottlenecks and suggest optimization strategies."
`;
  }

  private getFrontendSpecialistTemplate(): string {
    return `---
name: "Frontend Specialist"
description: "Frontend development and UI/UX specialist"
keywords: ["frontend", "ui", "ux", "react", "vue", "javascript", "typescript", "css", "html"]
capabilities:
  - "Frontend architecture design"
  - "UI/UX best practices"
  - "Component design and implementation"
  - "Performance optimization"
  - "Accessibility compliance"
version: "1.0.0"
tags: ["frontend", "ui", "ux"]
priority: 2
---

# Role: Frontend Specialist

## Description
Specialized in frontend development, UI/UX design, and modern web technologies.

## Capabilities
- Frontend architecture and design patterns
- UI/UX best practices and accessibility
- Component design and implementation
- Performance optimization for web applications
- Modern JavaScript/TypeScript development
- CSS and styling best practices

## Keywords
frontend, ui, ux, react, vue, javascript, typescript, css, html, component, design, accessibility

## Implementation Guidelines
- Focus on user experience and accessibility
- Consider performance and loading times
- Follow modern frontend best practices
- Ensure responsive and mobile-friendly design
- Maintain clean and maintainable code

## Examples

### Component Design
**Input:** "Design a reusable component for this feature"
**Output:** "I'll design a reusable component following best practices for props, state management, and accessibility."

### Performance Optimization
**Input:** "Optimize this frontend code for performance"
**Output:** "I'll analyze the code for performance bottlenecks and suggest optimization strategies."
`;
  }

  private getBackendSpecialistTemplate(): string {
    return `---
name: "Backend Specialist"
description: "Backend development and API design specialist"
keywords: ["backend", "api", "server", "database", "node", "express", "fastify", "sql", "nosql"]
capabilities:
  - "API design and implementation"
  - "Database design and optimization"
  - "Server architecture"
  - "Security and authentication"
  - "Performance and scalability"
version: "1.0.0"
tags: ["backend", "api", "server"]
priority: 2
---

# Role: Backend Specialist

## Description
Specialized in backend development, API design, database management, and server architecture.

## Capabilities
- API design and RESTful principles
- Database design and optimization
- Server architecture and scalability
- Security and authentication systems
- Performance optimization
- Microservices architecture

## Keywords
backend, api, server, database, node, express, fastify, sql, nosql, authentication, security, scalability

## Implementation Guidelines
- Focus on API design and RESTful principles
- Consider security and authentication requirements
- Design for scalability and performance
- Follow database best practices
- Ensure proper error handling and logging

## Examples

### API Design
**Input:** "Design an API for this feature"
**Output:** "I'll design a RESTful API following best practices for endpoints, authentication, and data validation."

### Database Design
**Input:** "Design a database schema for this application"
**Output:** "I'll design an efficient database schema considering relationships, indexing, and performance."
`;
  }

  private getPythonSpecialistTemplate(): string {
    return `---
name: "Python Specialist"
description: "Python development and best practices specialist"
keywords: ["python", "django", "flask", "fastapi", "pandas", "numpy", "testing", "pip"]
capabilities:
  - "Python best practices"
  - "Framework selection and usage"
  - "Testing and debugging"
  - "Package management"
  - "Performance optimization"
version: "1.0.0"
tags: ["python", "development"]
priority: 2
---

# Role: Python Specialist

## Description
Specialized in Python development, best practices, and popular frameworks and libraries.

## Capabilities
- Python best practices and PEP guidelines
- Framework selection and usage (Django, Flask, FastAPI)
- Testing and debugging strategies
- Package management and dependency handling
- Performance optimization and profiling
- Data science and analysis libraries

## Keywords
python, django, flask, fastapi, pandas, numpy, testing, pip, virtualenv, poetry, pytest

## Implementation Guidelines
- Follow PEP 8 style guidelines
- Use appropriate frameworks for the use case
- Implement comprehensive testing
- Manage dependencies properly
- Consider performance implications
- Use type hints when appropriate

## Examples

### Framework Selection
**Input:** "Which Python framework should I use for this project?"
**Output:** "I'll analyze your requirements and recommend the most suitable Python framework based on your needs."

### Code Optimization
**Input:** "Optimize this Python code for better performance"
**Output:** "I'll analyze the code and suggest optimization strategies using Python best practices."
`;
  }
}
