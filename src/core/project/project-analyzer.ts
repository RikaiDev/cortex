/**
 * Project Analyzer
 *
 * This module analyzes a project's structure, patterns, and conventions
 * to provide insights and generate documentation.
 */

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

/**
 * Project structure interface
 */
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

/**
 * Project analysis interface
 */
export interface ProjectAnalysis {
  projectRoot: string;
  structure: ProjectStructure;
  patterns: CodePattern[];
  conventions: Convention[];
  tools: ToolInfo[];
  architecture: ArchitectureInfo;
  projectType: "php" | "node" | "python" | "java" | "ruby" | "go" | "unknown";
  framework?: string;
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  confidence: number;
}

/**
 * Code pattern interface
 */
export interface CodePattern {
  name: string;
  description: string;
  examples: string[];
  frequency: number;
  context: string[];
}

/**
 * Convention interface
 */
export interface Convention {
  type: "naming" | "structure" | "style" | "process";
  description: string;
  examples: string[];
  enforcement: "strict" | "recommended" | "optional";
}

/**
 * Tool info interface
 */
export interface ToolInfo {
  name: string;
  version: string;
  purpose: string;
  configuration: Record<string, any>;
}

/**
 * Architecture info interface
 */
export interface ArchitectureInfo {
  type: string;
  description: string;
  layers: string[];
  patterns: string[];
  dependencies: string[];
}

/**
 * Project analyzer for analyzing project structure and patterns
 */
export class ProjectAnalyzer {
  private projectRoot: string;
  private analysis: ProjectAnalysis;

  /**
   * Creates a new instance of the ProjectAnalyzer class
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.analysis = {
      projectRoot,
      structure: {
        name: path.basename(projectRoot),
        type: "directory",
        path: "/",
      },
      patterns: [],
      conventions: [],
      tools: [],
      architecture: {
        type: "unknown",
        description: "",
        layers: [],
        patterns: [],
        dependencies: [],
      },
      projectType: "unknown",
      confidence: 0,
    };
  }

  /**
   * Analyze the project
   * @returns Project analysis result
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    // Analyze project structure
    this.analysis.structure = await this.scanProjectStructure(this.projectRoot);

    // Analyze code patterns
    this.analysis.patterns = await this.analyzeCodePatterns();

    // Identify conventions
    this.analysis.conventions = await this.identifyConventions();

    // Detect tools
    this.analysis.tools = await this.detectTools();

    // Analyze architecture
    this.analysis.architecture = await this.analyzeArchitecture();

    // Detect project type and framework
    const projectTypeInfo = await this.detectProjectType();
    this.analysis.projectType = projectTypeInfo.type;
    this.analysis.framework = projectTypeInfo.framework;
    this.analysis.buildCommand = projectTypeInfo.buildCommand;
    this.analysis.devCommand = projectTypeInfo.devCommand;
    this.analysis.testCommand = projectTypeInfo.testCommand;
    this.analysis.confidence = projectTypeInfo.confidence;

    return this.analysis;
  }

  /**
   * Generate project documentation
   */
  async generateDocumentation(): Promise<void> {
    // Ensure docs directory exists
    const docsDir = path.join(this.projectRoot, "docs");
    await fs.ensureDir(docsDir);

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

    // Generate project knowledge documentation
    await this.generateProjectKnowledge(docsDir);
  }

  /**
   * Scan project structure
   * @param dirPath - Directory path to scan
   * @returns Project structure
   */
  private async scanProjectStructure(
    dirPath: string
  ): Promise<ProjectStructure> {
    const relativePath = path.relative(this.projectRoot, dirPath);
    const name = path.basename(dirPath);

    // Check if path exists
    if (!(await fs.pathExists(dirPath))) {
      throw new Error(`Path does not exist: ${dirPath}`);
    }

    // Check if it's a directory
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      // It's a file
      const content = await fs.readFile(dirPath, "utf-8");
      return {
        name,
        type: "file",
        path: relativePath || "/",
        content:
          content.length > 1000 ? content.substring(0, 1000) + "..." : content,
        metadata: this.analyzeFileMetadata(name, dirPath),
      };
    }

    // It's a directory, scan contents
    const entries = await fs.readdir(dirPath);

    // Process each entry
    const children: ProjectStructure[] = [];
    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.startsWith(".") || entry === "node_modules") {
        continue;
      }

      const entryPath = path.join(dirPath, entry);
      try {
        const childStructure = await this.scanProjectStructure(entryPath);
        children.push(childStructure);
      } catch (error) {
        console.error(`Error scanning ${entryPath}:`, error);
      }
    }

    return {
      name,
      type: "directory",
      path: relativePath || "/",
      children,
    };
  }

  /**
   * Analyze file metadata
   * @param filename - Filename
   * @param filepath - File path
   * @returns File metadata
   */
  private analyzeFileMetadata(
    filename: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filepath: string
  ): any {
    const metadata: any = {};

    // Determine language
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case ".ts":
      case ".tsx":
        metadata.language = "TypeScript";
        break;
      case ".js":
      case ".jsx":
        metadata.language = "JavaScript";
        break;
      case ".py":
        metadata.language = "Python";
        break;
      case ".go":
        metadata.language = "Go";
        break;
      case ".rs":
        metadata.language = "Rust";
        break;
      case ".md":
        metadata.language = "Markdown";
        break;
      case ".json":
        metadata.language = "JSON";
        break;
    }

    return metadata;
  }

  /**
   * Analyze code patterns in the project
   * @returns Array of code patterns
   */
  private async analyzeCodePatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];

    // Find TypeScript/JavaScript files
    const files = await glob("**/*.{ts,js,tsx,jsx}", {
      cwd: this.projectRoot,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    });

    // Pattern detection for MCP tools
    const mcpToolPattern = /registerTool\s*\(\s*["']([^"']+)["']/g;
    const mcpToolFiles = files.filter(
      (file) => file.includes("mcp") || file.includes("tool")
    );

    if (mcpToolFiles.length > 0) {
      const mcpToolExamples: string[] = [];

      for (const file of mcpToolFiles.slice(0, 5)) {
        // Limit to first 5 files
        const content = await fs.readFile(
          path.join(this.projectRoot, file),
          "utf-8"
        );
        let match;
        while ((match = mcpToolPattern.exec(content)) !== null) {
          mcpToolExamples.push(`${file}: ${match[1]}`);
        }
      }

      if (mcpToolExamples.length > 0) {
        patterns.push({
          name: "MCP Tool Registration",
          description: "Pattern for registering MCP tools",
          examples: mcpToolExamples,
          frequency: mcpToolExamples.length,
          context: ["MCP", "Tool", "Registration"],
        });
      }
    }

    // Pattern detection for thinking processes
    const thinkingPattern = /thinking|thought|reasoning|analysis/i;
    const thinkingFiles = files.filter((file) => thinkingPattern.test(file));

    if (thinkingFiles.length > 0) {
      patterns.push({
        name: "Thinking Process Implementation",
        description: "Implementation of thinking and reasoning processes",
        examples: thinkingFiles.slice(0, 5),
        frequency: thinkingFiles.length,
        context: ["Thinking", "Reasoning", "Analysis"],
      });
    }

    return patterns;
  }

  /**
   * Identify conventions used in the project
   * @returns Array of conventions
   */
  private async identifyConventions(): Promise<Convention[]> {
    const conventions: Convention[] = [];

    // Naming conventions
    const filesTs = await glob("**/*.{ts,tsx}", {
      cwd: this.projectRoot,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    });

    if (filesTs.length > 0) {
      // Check naming conventions in sample files
      const sampleFiles = filesTs.slice(0, 20); // Sample up to 20 files
      const camelCaseCount = sampleFiles.filter((file) =>
        /^[a-z]+([A-Z][a-z0-9]+)*\.(ts|tsx)$/.test(path.basename(file))
      ).length;

      const kebabCaseCount = sampleFiles.filter((file) =>
        /^[a-z0-9]+(-[a-z0-9]+)*\.(ts|tsx)$/.test(path.basename(file))
      ).length;

      if (camelCaseCount > kebabCaseCount) {
        conventions.push({
          type: "naming",
          description: "Files are named using camelCase",
          examples: sampleFiles
            .filter((file) =>
              /^[a-z]+([A-Z][a-z0-9]+)*\.(ts|tsx)$/.test(path.basename(file))
            )
            .slice(0, 3),
          enforcement: "recommended",
        });
      } else if (kebabCaseCount > camelCaseCount) {
        conventions.push({
          type: "naming",
          description: "Files are named using kebab-case",
          examples: sampleFiles
            .filter((file) =>
              /^[a-z0-9]+(-[a-z0-9]+)*\.(ts|tsx)$/.test(path.basename(file))
            )
            .slice(0, 3),
          enforcement: "recommended",
        });
      }
    }

    // Structure conventions
    if (await fs.pathExists(path.join(this.projectRoot, "src"))) {
      const srcDirs = await fs.readdir(path.join(this.projectRoot, "src"));

      if (srcDirs.includes("core") && srcDirs.includes("adapters")) {
        conventions.push({
          type: "structure",
          description: "Project uses core/adapters structure pattern",
          examples: ["src/core", "src/adapters"],
          enforcement: "strict",
        });
      }
    }

    // Style conventions
    if (
      (await fs.pathExists(path.join(this.projectRoot, ".eslintrc"))) ||
      (await fs.pathExists(path.join(this.projectRoot, ".eslintrc.js"))) ||
      (await fs.pathExists(path.join(this.projectRoot, ".eslintrc.json")))
    ) {
      conventions.push({
        type: "style",
        description: "Project uses ESLint for code style enforcement",
        examples: [".eslintrc"],
        enforcement: "strict",
      });
    }

    // Process conventions
    if (
      await fs.pathExists(path.join(this.projectRoot, ".github", "workflows"))
    ) {
      conventions.push({
        type: "process",
        description: "Project uses GitHub Actions for CI/CD",
        examples: [".github/workflows"],
        enforcement: "recommended",
      });
    }

    return conventions;
  }

  /**
   * Detect tools used in the project
   * @returns Array of tool information
   */
  private async detectTools(): Promise<ToolInfo[]> {
    const tools: ToolInfo[] = [];

    // Check for package.json
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);

      // Add Node.js
      tools.push({
        name: "Node.js",
        version: "detected",
        purpose: "JavaScript runtime",
        configuration: {},
      });

      // Add npm/yarn
      if (await fs.pathExists(path.join(this.projectRoot, "yarn.lock"))) {
        tools.push({
          name: "Yarn",
          version: "detected",
          purpose: "Package manager",
          configuration: {},
        });
      } else if (
        await fs.pathExists(path.join(this.projectRoot, "package-lock.json"))
      ) {
        tools.push({
          name: "npm",
          version: "detected",
          purpose: "Package manager",
          configuration: {},
        });
      }

      // Add TypeScript
      if (
        packageJson.dependencies?.typescript ||
        packageJson.devDependencies?.typescript
      ) {
        tools.push({
          name: "TypeScript",
          version:
            packageJson.dependencies?.typescript ||
            packageJson.devDependencies?.typescript,
          purpose: "Static typing for JavaScript",
          configuration: {},
        });
      }

      // Add ESLint
      if (
        packageJson.dependencies?.eslint ||
        packageJson.devDependencies?.eslint
      ) {
        tools.push({
          name: "ESLint",
          version:
            packageJson.dependencies?.eslint ||
            packageJson.devDependencies?.eslint,
          purpose: "Code linting",
          configuration: {},
        });
      }
    }

    // Check for Python tools
    if (
      (await fs.pathExists(path.join(this.projectRoot, "requirements.txt"))) ||
      (await fs.pathExists(path.join(this.projectRoot, "pyproject.toml")))
    ) {
      tools.push({
        name: "Python",
        version: "detected",
        purpose: "Python runtime",
        configuration: {},
      });
    }

    // Check for Docker
    if (
      (await fs.pathExists(path.join(this.projectRoot, "Dockerfile"))) ||
      (await fs.pathExists(path.join(this.projectRoot, "docker-compose.yml")))
    ) {
      tools.push({
        name: "Docker",
        version: "detected",
        purpose: "Containerization",
        configuration: {},
      });
    }

    // Check for MCP tools
    const mcpConfigPath = path.join(
      this.projectRoot,
      "examples",
      "cortex-mcp-config.json"
    );
    if (await fs.pathExists(mcpConfigPath)) {
      try {
        const mcpConfig = await fs.readJson(mcpConfigPath);
        tools.push({
          name: "MCP",
          version: "detected",
          purpose: "Model Context Protocol",
          configuration: mcpConfig,
        });
      } catch (error) {
        console.error("Error reading MCP config:", error);
      }
    }

    return tools;
  }

  /**
   * Detect project type and suggest commands
   * @returns Project type information
   */
  private async detectProjectType(): Promise<{
    type: ProjectAnalysis["projectType"];
    framework?: string;
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
    confidence: number;
  }> {
    const indicators = await this.collectProjectIndicators();
    const projectType = this.determineProjectType(indicators);
    const framework = await this.detectFramework(indicators);

    return {
      type: projectType,
      framework: framework?.name,
      buildCommand: this.suggestBuildCommand(
        projectType,
        framework || undefined
      ),
      devCommand: this.suggestDevCommand(projectType, framework || undefined),
      testCommand: this.suggestTestCommand(projectType, framework || undefined),
      confidence: this.calculateConfidence(indicators, framework),
    };
  }

  /**
   * Collect project indicators
   */
  private async collectProjectIndicators(): Promise<string[]> {
    const indicators: string[] = [];

    // Check for package managers
    const files = await fs.readdir(this.projectRoot);

    for (const file of files) {
      if (file === "composer.json") indicators.push("composer");
      if (file === "package.json") indicators.push("npm");
      if (file === "pom.xml") indicators.push("maven");
      if (file === "requirements.txt") indicators.push("pip");
      if (file === "Gemfile") indicators.push("bundler");
      if (file === "go.mod") indicators.push("go-modules");
    }

    // Check for framework-specific files
    const allFiles = await this.getAllFiles();
    for (const file of allFiles) {
      if (file.includes("artisan")) indicators.push("laravel");
      if (file.includes("symfony")) indicators.push("symfony");
      if (file.includes("wp-config.php")) indicators.push("wordpress");
      if (file.includes("app.py")) indicators.push("flask");
      if (file.includes("manage.py")) indicators.push("django");
      if (file.includes("main.go")) indicators.push("go-app");
    }

    return indicators;
  }

  /**
   * Determine project type based on indicators
   */
  private determineProjectType(
    indicators: string[]
  ): ProjectAnalysis["projectType"] {
    if (indicators.includes("composer")) {
      return "php";
    }
    if (indicators.includes("npm")) {
      return "node";
    }
    if (indicators.includes("pip") || indicators.includes("requirements.txt")) {
      return "python";
    }
    if (indicators.includes("maven")) {
      return "java";
    }
    if (indicators.includes("bundler")) {
      return "ruby";
    }
    if (indicators.includes("go-modules") || indicators.includes("go-app")) {
      return "go";
    }

    return "unknown";
  }

  /**
   * Detect specific framework
   */
  private async detectFramework(
    indicators: string[]
  ): Promise<{ name: string; confidence: number } | null> {
    if (indicators.includes("laravel")) {
      return { name: "Laravel", confidence: 0.9 };
    }
    if (indicators.includes("symfony")) {
      return { name: "Symfony", confidence: 0.9 };
    }
    if (indicators.includes("wordpress")) {
      return { name: "WordPress", confidence: 0.8 };
    }
    if (indicators.includes("django")) {
      return { name: "Django", confidence: 0.9 };
    }
    if (indicators.includes("flask")) {
      return { name: "Flask", confidence: 0.8 };
    }
    if (await this.hasFile("next.config.js")) {
      return { name: "Next.js", confidence: 0.9 };
    }
    if (await this.hasFile("vite.config.js")) {
      return { name: "Vite", confidence: 0.8 };
    }

    return null;
  }

  /**
   * Suggest build command
   */
  private suggestBuildCommand(
    type: ProjectAnalysis["projectType"],
    _framework?: { name: string; confidence: number }
  ): string {
    switch (type) {
      case "php":
        return "composer install --no-dev --optimize-autoloader";
      case "node":
        return "npm run build";
      case "python":
        return "pip install -r requirements.txt";
      case "java":
        return "mvn clean install";
      case "ruby":
        return "bundle install";
      case "go":
        return "go build";
      default:
        return "";
    }
  }

  /**
   * Suggest development command
   */
  private suggestDevCommand(
    type: ProjectAnalysis["projectType"],
    framework?: { name: string; confidence: number }
  ): string {
    switch (type) {
      case "php":
        if (framework?.name === "Laravel") {
          return "php artisan serve";
        }
        if (framework?.name === "Symfony") {
          return "symfony server:start";
        }
        return "php -S localhost:8000 -t public";
      case "node":
        return "npm run dev";
      case "python":
        if (framework?.name === "Django") {
          return "python manage.py runserver";
        }
        if (framework?.name === "Flask") {
          return "python app.py";
        }
        return "python -m http.server 8000";
      case "java":
        return "mvn spring-boot:run";
      case "ruby":
        return "rails server";
      case "go":
        return "go run main.go";
      default:
        return "";
    }
  }

  /**
   * Suggest test command
   */
  private suggestTestCommand(
    type: ProjectAnalysis["projectType"],
    framework?: { name: string; confidence: number }
  ): string {
    switch (type) {
      case "php":
        if (framework?.name === "Laravel") {
          return "php artisan test";
        }
        return "vendor/bin/phpunit";
      case "node":
        return "npm test";
      case "python":
        if (framework?.name === "Django") {
          return "python manage.py test";
        }
        return "pytest";
      case "java":
        return "mvn test";
      case "ruby":
        return "bundle exec rspec";
      case "go":
        return "go test ./...";
      default:
        return "";
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    indicators: string[],
    framework?: { name: string; confidence: number } | null
  ): number {
    let confidence = 0.5; // Base confidence

    // Add confidence for package manager detection
    if (
      indicators.includes("composer") ||
      indicators.includes("npm") ||
      indicators.includes("pip") ||
      indicators.includes("maven")
    ) {
      confidence += 0.3;
    }

    // Add confidence for framework detection
    if (framework) {
      confidence += framework.confidence * 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Helper methods for file detection
   */
  private async getAllFiles(): Promise<string[]> {
    try {
      const files: string[] = [];
      const walk = async (dir: string) => {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (
            item.isDirectory() &&
            !item.name.startsWith(".") &&
            item.name !== "node_modules"
          ) {
            await walk(fullPath);
          } else if (item.isFile()) {
            files.push(fullPath);
          }
        }
      };
      await walk(this.projectRoot);
      return files;
    } catch {
      return [];
    }
  }

  private async hasFile(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectRoot, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze the project architecture
   * @returns Architecture information
   */
  private async analyzeArchitecture(): Promise<ArchitectureInfo> {
    const architecture: ArchitectureInfo = {
      type: "unknown",
      description: "",
      layers: [],
      patterns: [],
      dependencies: [],
    };

    // Check for src directory
    if (await fs.pathExists(path.join(this.projectRoot, "src"))) {
      const srcDirs = await fs.readdir(path.join(this.projectRoot, "src"));

      // Check for specific architectural patterns
      if (srcDirs.includes("core") && srcDirs.includes("adapters")) {
        architecture.type = "hexagonal";
        architecture.description = "Hexagonal/Ports & Adapters architecture";
        architecture.layers = ["core", "adapters"];
        architecture.patterns = ["dependency-inversion", "hexagonal"];
      } else if (
        srcDirs.includes("models") &&
        srcDirs.includes("views") &&
        srcDirs.includes("controllers")
      ) {
        architecture.type = "mvc";
        architecture.description = "Model-View-Controller architecture";
        architecture.layers = ["models", "views", "controllers"];
        architecture.patterns = ["mvc"];
      } else {
        architecture.type = "modular";
        architecture.description =
          "Modular architecture with feature-based organization";
        architecture.layers = srcDirs.filter((dir) => !dir.startsWith("."));
        architecture.patterns = ["modular"];
      }
    }

    // Identify dependencies
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      architecture.dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
      ];
    }

    return architecture;
  }

  /**
   * Generate project structure documentation
   * @param docsDir - Documentation directory
   */
  private async generateProjectStructureDocs(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "project-structure.md");

    let content = "# Project Structure\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;
    content += "## Directory Structure\n\n";
    content += "```\n";
    content += this.generateStructureTree(this.analysis.structure);
    content += "```\n\n";

    content += "## Key Directories\n\n";

    // Add key directories descriptions
    const keyDirs = ["src", "docs", "tests", "examples", "scripts"];
    for (const dir of keyDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (await fs.pathExists(dirPath)) {
        content += `### ${dir}/\n\n`;
        content += `Contains ${dir === "src" ? "source code" : dir === "docs" ? "documentation" : dir === "tests" ? "tests" : dir === "examples" ? "examples" : "scripts"} for the project.\n\n`;
      }
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * Generate a structure tree for the project
   * @param structure - Project structure
   * @param indent - Indentation string
   * @returns Generated structure tree
   */
  private generateStructureTree(
    structure: ProjectStructure,
    indent: string = ""
  ): string {
    if (structure.type === "file") {
      return `${indent}${structure.name}\n`;
    }

    let result = `${indent}${structure.name}/\n`;

    if (structure.children) {
      for (const child of structure.children) {
        result += this.generateStructureTree(child, indent + "  ");
      }
    }

    return result;
  }

  /**
   * Generate code patterns documentation
   * @param docsDir - Documentation directory
   */
  private async generateCodePatternsDocs(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "code-patterns.md");

    let content = "# Code Patterns\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;
    content += "## Detected Patterns\n\n";

    if (this.analysis.patterns.length === 0) {
      content += "No patterns detected.\n\n";
    } else {
      for (const pattern of this.analysis.patterns) {
        content += `### ${pattern.name}\n\n`;
        content += `${pattern.description}\n\n`;
        content += `**Frequency**: ${pattern.frequency} occurrences\n\n`;
        content += "**Examples**:\n\n";

        for (const example of pattern.examples) {
          content += `- ${example}\n`;
        }

        content += "\n";
      }
    }

    content += "## Best Practices\n\n";
    content += "1. Follow established patterns consistently\n";
    content += "2. Document new patterns in this file\n";
    content +=
      "3. Review patterns periodically to ensure they still make sense\n\n";

    await fs.writeFile(filePath, content);
  }

  /**
   * Generate conventions documentation
   * @param docsDir - Documentation directory
   */
  private async generateConventionsDocs(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "conventions.md");

    let content = "# Conventions\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;

    // Group conventions by type
    const conventionsByType: Record<string, Convention[]> = {};
    for (const convention of this.analysis.conventions) {
      if (!conventionsByType[convention.type]) {
        conventionsByType[convention.type] = [];
      }
      conventionsByType[convention.type].push(convention);
    }

    // Add conventions by type
    for (const [type, conventions] of Object.entries(conventionsByType)) {
      content += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Conventions\n\n`;

      for (const convention of conventions) {
        content += `### ${convention.description}\n\n`;
        content += `**Enforcement**: ${convention.enforcement}\n\n`;

        if (convention.examples.length > 0) {
          content += "**Examples**:\n\n";
          for (const example of convention.examples) {
            content += `- ${example}\n`;
          }
          content += "\n";
        }
      }
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * Generate tools documentation
   * @param docsDir - Documentation directory
   */
  private async generateToolsDocs(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "tools.md");

    let content = "# Tools\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;
    content += "## Detected Tools\n\n";

    if (this.analysis.tools.length === 0) {
      content += "No tools detected.\n\n";
    } else {
      for (const tool of this.analysis.tools) {
        content += `### ${tool.name}\n\n`;
        content += `**Version**: ${tool.version}\n`;
        content += `**Purpose**: ${tool.purpose}\n\n`;

        if (Object.keys(tool.configuration).length > 0) {
          content += "**Configuration**:\n\n";
          content += "```json\n";
          content += JSON.stringify(tool.configuration, null, 2);
          content += "\n```\n\n";
        }
      }
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * Generate architecture documentation
   * @param docsDir - Documentation directory
   */
  private async generateArchitectureDocs(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "architecture.md");

    let content = "# Architecture\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;

    // Architecture type
    content += `## Architecture Type: ${this.analysis.architecture.type}\n\n`;
    content += `${this.analysis.architecture.description}\n\n`;

    // Layers
    content += "## Layers\n\n";
    for (const layer of this.analysis.architecture.layers) {
      content += `- **${layer}**\n`;
    }
    content += "\n";

    // Patterns
    content += "## Architectural Patterns\n\n";
    for (const pattern of this.analysis.architecture.patterns) {
      content += `- ${pattern}\n`;
    }
    content += "\n";

    // Dependencies
    content += "## Key Dependencies\n\n";
    if (this.analysis.architecture.dependencies.length > 0) {
      for (const dependency of this.analysis.architecture.dependencies.slice(
        0,
        10
      )) {
        content += `- ${dependency}\n`;
      }

      if (this.analysis.architecture.dependencies.length > 10) {
        content += `- ... and ${this.analysis.architecture.dependencies.length - 10} more\n`;
      }
    } else {
      content += "No dependencies detected.\n";
    }
    content += "\n";

    await fs.writeFile(filePath, content);
  }

  /**
   * Generate project knowledge documentation
   * @param docsDir - Documentation directory
   */
  private async generateProjectKnowledge(docsDir: string): Promise<void> {
    const filePath = path.join(docsDir, "project-knowledge.md");

    let content = "# Project Knowledge\n\n";
    content += `_Generated on ${new Date().toISOString()}_\n\n`;

    // Combine all the analysis into a knowledge base
    content += "## Project Overview\n\n";
    content += `This project follows a **${this.analysis.architecture.type}** architecture with ${this.analysis.architecture.layers.length} main layers.\n\n`;

    // Key patterns
    content += "## Key Patterns\n\n";
    if (this.analysis.patterns.length > 0) {
      for (const pattern of this.analysis.patterns) {
        content += `- **${pattern.name}**: ${pattern.description}\n`;
      }
    } else {
      content += "No key patterns detected yet.\n";
    }
    content += "\n";

    // Tools and technologies
    content += "## Tools & Technologies\n\n";
    if (this.analysis.tools.length > 0) {
      for (const tool of this.analysis.tools) {
        content += `- **${tool.name}**: ${tool.purpose}\n`;
      }
    } else {
      content += "No tools detected yet.\n";
    }
    content += "\n";

    await fs.writeFile(filePath, content);
  }
}
