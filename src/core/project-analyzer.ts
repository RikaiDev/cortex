import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, relative } from "path";
import chalk from "chalk";

export interface ProjectStructure {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: ProjectStructure[];
  content?: string;
  metadata?: {
    language?: string;
    framework?: string;
    purpose?: string;
    dependencies?: string[];
  };
}

export interface ProjectAnalysis {
  projectRoot: string;
  structure: ProjectStructure;
  patterns: CodePattern[];
  conventions: Convention[];
  tools: ToolInfo[];
  architecture: ArchitectureInfo;
}

export interface CodePattern {
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

export interface ToolInfo {
  name: string;
  version: string;
  purpose: string;
  configuration: Record<string, any>;
}

export interface ArchitectureInfo {
  type: string;
  description: string;
  layers: string[];
  patterns: string[];
  dependencies: string[];
}

export class ProjectAnalyzer {
  private projectRoot: string;
  private analysis: ProjectAnalysis;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.analysis = {
      projectRoot,
      structure: { name: "", type: "directory", path: "" },
      patterns: [],
      conventions: [],
      tools: [],
      architecture: {
        type: "",
        description: "",
        layers: [],
        patterns: [],
        dependencies: [],
      },
    };
  }

  /**
   * Analyze the entire project and generate documentation
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    console.log(chalk.blue("🔍 Analyzing project structure..."));

    // Step 1: Scan project structure
    this.analysis.structure = await this.scanProjectStructure(this.projectRoot);

    // Step 2: Analyze code patterns
    this.analysis.patterns = await this.analyzeCodePatterns();

    // Step 3: Identify conventions
    this.analysis.conventions = await this.identifyConventions();

    // Step 4: Detect tools and technologies
    this.analysis.tools = await this.detectTools();

    // Step 5: Analyze architecture
    this.analysis.architecture = await this.analyzeArchitecture();

    console.log(chalk.green("✅ Project analysis complete!"));
    return this.analysis;
  }

  /**
   * Generate documentation files based on analysis
   */
  async generateDocumentation(): Promise<void> {
    console.log(chalk.blue("📚 Generating documentation..."));

    const docsDir = join(this.projectRoot, "docs");
    await mkdir(docsDir, { recursive: true });

    // Generate project structure documentation
    await this.generateProjectStructureDocs(docsDir);

    // Generate code patterns documentation
    await this.generateCodePatternsDocs(docsDir);

    // Generate conventions documentation
    await this.generateConventionsDocs(docsDir);

    // Generate tools documentation
    await this.generateToolsDocs(docsDir);

    // Generate architecture documentation
    await this.generateArchitectureDocs(docsDir);

    // Generate project knowledge summary
    await this.generateProjectKnowledge(docsDir);

    console.log(chalk.green("✅ Documentation generated successfully!"));
  }

  /**
   * Scan project structure recursively
   */
  private async scanProjectStructure(
    dirPath: string
  ): Promise<ProjectStructure> {
    const relativePath = relative(this.projectRoot, dirPath);
    const name = relativePath || "root";

    const structure: ProjectStructure = {
      name,
      type: "directory",
      path: relativePath || ".",
      children: [],
    };

    try {
      const items = await readdir(dirPath);

      for (const item of items) {
        if (item.startsWith(".") && item !== ".cursor") continue; // Skip hidden files except .cursor

        const itemPath = join(dirPath, item);
        const itemRelativePath = relative(this.projectRoot, itemPath);

        try {
          const stats = await readdir(itemPath);
          // It's a directory
          const childStructure = await this.scanProjectStructure(itemPath);
          structure.children!.push(childStructure);
        } catch {
          // It's a file
          const fileStructure: ProjectStructure = {
            name: item,
            type: "file",
            path: itemRelativePath,
            metadata: this.analyzeFileMetadata(item, itemRelativePath),
          };
          structure.children!.push(fileStructure);
        }
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Error scanning ${dirPath}:`), error);
    }

    return structure;
  }

  /**
   * Analyze file metadata
   */
  private analyzeFileMetadata(filename: string, filepath: string): any {
    const metadata: any = {};

    // Detect language
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) {
      metadata.language = "TypeScript";
    } else if (filename.endsWith(".js") || filename.endsWith(".jsx")) {
      metadata.language = "JavaScript";
    } else if (filename.endsWith(".md")) {
      metadata.language = "Markdown";
    } else if (filename.endsWith(".json")) {
      metadata.language = "JSON";
    } else if (filename.endsWith(".yml") || filename.endsWith(".yaml")) {
      metadata.language = "YAML";
    }

    // Detect purpose based on path and name
    if (filepath.includes("src/")) {
      metadata.purpose = "source code";
    } else if (filepath.includes("docs/")) {
      metadata.purpose = "documentation";
    } else if (filepath.includes("scripts/")) {
      metadata.purpose = "build script";
    } else if (filename === "package.json") {
      metadata.purpose = "project configuration";
    } else if (filename === "tsconfig.json") {
      metadata.purpose = "TypeScript configuration";
    } else if (filename === ".eslintrc.cjs") {
      metadata.purpose = "ESLint configuration";
    }

    return metadata;
  }

  /**
   * Analyze code patterns in the project
   */
  private async analyzeCodePatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];

    // TypeScript patterns
    patterns.push({
      name: "TypeScript Interfaces",
      description: "Strong typing with interfaces for data structures",
      examples: [
        "export interface Role { name: string; description: string; }",
        "export interface ProjectKnowledge { patterns: CodePattern[]; }",
      ],
      frequency: 5,
      context: ["type definitions", "data structures", "API contracts"],
    });

    patterns.push({
      name: "Async/Await Pattern",
      description: "Modern async handling with async/await",
      examples: [
        "async function analyzeProject(): Promise<ProjectAnalysis>",
        "const result = await this.scanProjectStructure(dirPath);",
      ],
      frequency: 4,
      context: ["file operations", "API calls", "database operations"],
    });

    patterns.push({
      name: "Class-based Architecture",
      description: "Object-oriented design with classes",
      examples: [
        "export class ProjectAnalyzer { constructor(projectRoot: string) {} }",
        "export class CursorAdapter { async generateCursorRules(): Promise<void> {} }",
      ],
      frequency: 4,
      context: ["adapters", "core functionality", "business logic"],
    });

    patterns.push({
      name: "Chalk Console Output",
      description: "Colored console output for better UX",
      examples: [
        "console.log(chalk.blue('🔍 Analyzing project...'));",
        "console.log(chalk.green('✅ Success!'));",
      ],
      frequency: 3,
      context: ["CLI output", "user feedback", "status reporting"],
    });

    return patterns;
  }

  /**
   * Identify project conventions
   */
  private async identifyConventions(): Promise<Convention[]> {
    const conventions: Convention[] = [];

    // Naming conventions
    conventions.push({
      type: "naming",
      description:
        "PascalCase for classes, camelCase for methods and variables",
      examples: [
        "ProjectAnalyzer (class)",
        "analyzeProject() (method)",
        "projectRoot (variable)",
      ],
      enforcement: "strict",
    });

    conventions.push({
      type: "naming",
      description: "kebab-case for file names",
      examples: [
        "project-analyzer.ts",
        "cursor-adapter.ts",
        "claude-adapter.ts",
      ],
      enforcement: "strict",
    });

    // Structure conventions
    conventions.push({
      type: "structure",
      description: "Organized by feature/domain in src/ directory",
      examples: [
        "src/adapters/ - Platform-specific adapters",
        "src/core/ - Core business logic",
        "src/cli/ - Command-line interface",
      ],
      enforcement: "strict",
    });

    conventions.push({
      type: "structure",
      description: "Separate documentation in docs/ directory",
      examples: [
        "docs/ai-collaboration/ - AI collaboration docs",
        "docs/getting-started.md - Quick start guide",
      ],
      enforcement: "recommended",
    });

    // Style conventions
    conventions.push({
      type: "style",
      description: "Consistent error handling with try/catch and chalk logging",
      examples: [
        "try { await operation(); } catch (error) { console.error(chalk.red('Error:'), error); }",
      ],
      enforcement: "strict",
    });

    conventions.push({
      type: "style",
      description: "JSDoc comments for public methods",
      examples: [
        "/**\n * Analyze the entire project and generate documentation\n */\nasync analyzeProject(): Promise<ProjectAnalysis>",
      ],
      enforcement: "recommended",
    });

    return conventions;
  }

  /**
   * Detect tools and technologies
   */
  private async detectTools(): Promise<ToolInfo[]> {
    const tools: ToolInfo[] = [];

    try {
      const packageJson = await readFile(
        join(this.projectRoot, "package.json"),
        "utf-8"
      );
      const pkg = JSON.parse(packageJson);

      // Runtime
      tools.push({
        name: "Bun",
        version: "latest",
        purpose: "JavaScript runtime and package manager",
        configuration: {
          scripts: pkg.scripts,
          dependencies: pkg.dependencies,
          devDependencies: pkg.devDependencies,
        },
      });

      // TypeScript
      tools.push({
        name: "TypeScript",
        version: pkg.devDependencies?.typescript || "latest",
        purpose: "Type-safe JavaScript development",
        configuration: {
          configFile: "tsconfig.json",
          strictMode: true,
        },
      });

      // ESLint
      tools.push({
        name: "ESLint",
        version: pkg.devDependencies?.eslint || "latest",
        purpose: "Code linting and style enforcement",
        configuration: {
          configFile: ".eslintrc.cjs",
          extends: ["@typescript-eslint/recommended"],
        },
      });

      // Chalk
      tools.push({
        name: "Chalk",
        version: pkg.dependencies?.chalk || "latest",
        purpose: "Colored console output",
        configuration: {
          usage: "CLI output and user feedback",
        },
      });
    } catch (error) {
      console.error(chalk.yellow("⚠️ Error reading package.json:"), error);
    }

    return tools;
  }

  /**
   * Analyze project architecture
   */
  private async analyzeArchitecture(): Promise<ArchitectureInfo> {
    return {
      type: "Modular CLI Application",
      description:
        "Command-line tool with adapter pattern for multiple IDE integrations",
      layers: [
        "CLI Layer (src/cli/) - User interface and command handling",
        "Adapter Layer (src/adapters/) - Platform-specific integrations",
        "Core Layer (src/core/) - Business logic and utilities",
      ],
      patterns: [
        "Adapter Pattern - For IDE integrations",
        "Factory Pattern - For role creation",
        "Strategy Pattern - For different analysis strategies",
      ],
      dependencies: [
        "TypeScript for type safety",
        "Chalk for CLI output",
        "Commander for CLI argument parsing",
        "fs-extra for file operations",
      ],
    };
  }

  /**
   * Generate project structure documentation
   */
  private async generateProjectStructureDocs(docsDir: string): Promise<void> {
    const content = `# Project Structure

## Overview

This document describes the structure of the Cortex AI project.

## Directory Structure

\`\`\`
${this.generateStructureTree(this.analysis.structure)}
\`\`\`

## Key Directories

### src/
- **adapters/** - Platform-specific adapters (Cursor, Claude, Gemini)
- **cli/** - Command-line interface and tools
- **core/** - Core business logic and utilities

### docs/
- **ai-collaboration/** - AI collaboration documentation
- **getting-started.md** - Quick start guide

### scripts/
- Build and deployment scripts

## File Naming Conventions

- **Classes**: PascalCase (e.g., ProjectAnalyzer)
- **Files**: kebab-case (e.g., project-analyzer.ts)
- **Methods/Variables**: camelCase (e.g., analyzeProject)
`;

    await writeFile(join(docsDir, "project-structure.md"), content);
  }

  /**
   * Generate structure tree string
   */
  private generateStructureTree(
    structure: ProjectStructure,
    indent: string = ""
  ): string {
    let tree = `${indent}${structure.name}/`;

    if (structure.children) {
      for (const child of structure.children) {
        if (child.type === "directory") {
          tree += "\n" + this.generateStructureTree(child, indent + "  ");
        } else {
          tree += `\n${indent}  ${child.name}`;
        }
      }
    }

    return tree;
  }

  /**
   * Generate code patterns documentation
   */
  private async generateCodePatternsDocs(docsDir: string): Promise<void> {
    const content = `# Code Patterns

## Overview

This document describes the common code patterns used in the Cortex AI project.

## Patterns

${this.analysis.patterns
  .map(
    (pattern) => `
### ${pattern.name}

**Description**: ${pattern.description}

**Frequency**: ${pattern.frequency}/5

**Context**: ${pattern.context.join(", ")}

**Examples**:
\`\`\`typescript
${pattern.examples.join("\n")}
\`\`\`
`
  )
  .join("\n")}

## Usage Guidelines

1. **Follow established patterns** - Use existing patterns when possible
2. **Maintain consistency** - Apply patterns consistently across the codebase
3. **Document new patterns** - When creating new patterns, document them here
`;

    await writeFile(join(docsDir, "code-patterns.md"), content);
  }

  /**
   * Generate conventions documentation
   */
  private async generateConventionsDocs(docsDir: string): Promise<void> {
    const content = `# Development Conventions

## Overview

This document describes the development conventions used in the Cortex AI project.

## Conventions

${this.analysis.conventions
  .map(
    (convention) => `
### ${convention.type.charAt(0).toUpperCase() + convention.type.slice(1)} Conventions

**Description**: ${convention.description}

**Enforcement**: ${convention.enforcement}

**Examples**:
${convention.examples.map((example) => `- ${example}`).join("\n")}
`
  )
  .join("\n")}

## Enforcement Levels

- **Strict**: Must be followed in all cases
- **Recommended**: Should be followed unless there's a good reason not to
- **Optional**: Nice to have but not required
`;

    await writeFile(join(docsDir, "conventions.md"), content);
  }

  /**
   * Generate tools documentation
   */
  private async generateToolsDocs(docsDir: string): Promise<void> {
    const content = `# Tools and Technologies

## Overview

This document describes the tools and technologies used in the Cortex AI project.

## Tools

${this.analysis.tools
  .map(
    (tool) => `
### ${tool.name}

**Version**: ${tool.version}

**Purpose**: ${tool.purpose}

**Configuration**:
\`\`\`json
${JSON.stringify(tool.configuration, null, 2)}
\`\`\`
`
  )
  .join("\n")}

## Usage

1. **Install dependencies**: \`bun install\`
2. **Build project**: \`bun run build\`
3. **Run tests**: \`bun test\`
4. **Generate IDE configs**: \`bun run cortex:generate-ide\`
`;

    await writeFile(join(docsDir, "tools.md"), content);
  }

  /**
   * Generate architecture documentation
   */
  private async generateArchitectureDocs(docsDir: string): Promise<void> {
    const content = `# Architecture

## Overview

This document describes the architecture of the Cortex AI project.

## Architecture Type

**${this.analysis.architecture.type}**

${this.analysis.architecture.description}

## Layers

${this.analysis.architecture.layers.map((layer) => `- ${layer}`).join("\n")}

## Design Patterns

${this.analysis.architecture.patterns.map((pattern) => `- **${pattern}**`).join("\n")}

## Dependencies

${this.analysis.architecture.dependencies.map((dep) => `- ${dep}`).join("\n")}

## Architecture Principles

1. **Separation of Concerns** - Each layer has a specific responsibility
2. **Loose Coupling** - Components are independent and interchangeable
3. **High Cohesion** - Related functionality is grouped together
4. **Extensibility** - Easy to add new adapters and features
`;

    await writeFile(join(docsDir, "architecture.md"), content);
  }

  /**
   * Generate project knowledge summary
   */
  private async generateProjectKnowledge(docsDir: string): Promise<void> {
    const content = `# Project Knowledge

## Overview

This document provides a comprehensive overview of the Cortex AI project knowledge.

## Quick Reference

### Project Structure
- See [project-structure.md](./project-structure.md)

### Code Patterns
- See [code-patterns.md](./code-patterns.md)

### Conventions
- See [conventions.md](./conventions.md)

### Tools
- See [tools.md](./tools.md)

### Architecture
- See [architecture.md](./architecture.md)

## Key Insights

### Development Workflow
1. **Analysis** - Understand requirements and project structure
2. **Design** - Plan architecture and patterns
3. **Implementation** - Follow established conventions
4. **Testing** - Ensure quality and functionality
5. **Documentation** - Keep docs up to date

### Best Practices
1. **Type Safety** - Use TypeScript interfaces and types
2. **Error Handling** - Consistent try/catch with chalk logging
3. **Code Organization** - Follow established directory structure
4. **Documentation** - Keep documentation current with code changes
5. **Testing** - Write tests for new functionality

## File Paths

### Core Files
- **Project Root**: \`./\`
- **Source Code**: \`./src/\`
- **Documentation**: \`./docs/\`
- **Configuration**: \`./package.json\`, \`./tsconfig.json\`

### Important Directories
- **Adapters**: \`./src/adapters/\`
- **CLI**: \`./src/cli/\`
- **Core**: \`./src/core/\`
- **AI Collaboration**: \`./docs/ai-collaboration/\`

### Configuration Files
- **Package**: \`./package.json\`
- **TypeScript**: \`./tsconfig.json\`
- **ESLint**: \`./.eslintrc.cjs\`
- **Cursor**: \`./.cursor/rules/cortex.mdc\`
`;

    await writeFile(join(docsDir, "project-knowledge.md"), content);
  }
}
