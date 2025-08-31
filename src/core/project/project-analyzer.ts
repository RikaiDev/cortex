/**
 * Project Analyzer - Linus Torvalds' Code Quality Assessment
 *
 * **I am Linus Torvalds**, creator and chief architect of the Linux kernel, 30 years of kernel maintenance experience, reviewed millions of lines of code.
 * I define Cortex AI's project analysis system:
 *
 * 1. **"Good Taste"** - Project structure must be simple and effective, eliminating unnecessary complexity
 * 2. **Pragmatism** - Only analyze truly valuable project features, not theoretically perfect but actually useless characteristics
 * 3. **Backward Compatibility** - Analysis results must consider existing code compatibility, cannot break existing functionality
 * 4. **Quality First** - Better to have simple analysis than complex but defective analysis
 *
 * This module analyzes a project's structure, patterns, and conventions
 * to provide insights and generate documentation.
 */

import path from "path";
import fs from "fs-extra";
import { ProjectScanner } from "./project-scanner.js";
import { ProjectTypeDetector } from "./project-type-detector.js";
import { CommandSuggester } from "./command-suggester.js";
import { DocumentationGenerator } from "./documentation-generator.js";

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
  projectType:
    | "php"
    | "node"
    | "python"
    | "java"
    | "ruby"
    | "go"
    | "rust"
    | "unknown";
  isMultiLanguage?: boolean;
  languages?: string[];
  framework?: string;
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  confidence: number;
  semanticAnalysis?: Record<string, unknown>; // Holds results from AST analysis
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
  type: "build" | "test" | "lint" | "format" | "deploy" | "other";
  command: string;
  configFiles: string[];
  version?: string;
  purpose?: string;
  description: string;
  configuration?: Record<string, unknown>;
  priority: "primary" | "secondary" | "optional";
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
  private scanner: ProjectScanner;
  private typeDetector: ProjectTypeDetector;
  private commandSuggester: CommandSuggester;
  private docGenerator: DocumentationGenerator;

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
      projectType: this.detectProjectTypeFromPath(projectRoot),
      confidence: 0,
    };

    // Initialize sub-modules
    this.scanner = new ProjectScanner(projectRoot);
    this.typeDetector = new ProjectTypeDetector(projectRoot);
    this.commandSuggester = new CommandSuggester(projectRoot);
    this.docGenerator = new DocumentationGenerator(projectRoot);
  }

  /**
   * Analyze the project
   * @returns Project analysis result
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    try {
      // Use ProjectScanner for structure analysis
      this.analysis.structure = await this.scanner.scanProjectStructure(
        this.projectRoot
      );

      // Perform semantic analysis using AST
      this.analysis.semanticAnalysis =
        await this.scanner.performSemanticAnalysis();

      // The old methods are now superseded by semantic analysis
      // this.analysis.patterns = await this.scanner.analyzeCodePatterns();
      // this.analysis.conventions = await this.scanner.identifyConventions();
      this.analysis.tools = await this.scanner.detectTools();

      // Architecture analysis with real project dependencies
      const dependencies = await this.extractProjectDependencies();
      this.analysis.architecture = {
        type: this.detectArchitectureType(dependencies),
        description: this.generateArchitectureDescription(dependencies),
        layers: this.detectArchitectureLayers(),
        patterns: this.detectArchitecturePatterns(dependencies),
        dependencies: dependencies,
      };

      // Detect project type using ProjectTypeDetector
      const projectTypeInfo = await this.typeDetector.detectProjectType();
      this.analysis.projectType = projectTypeInfo.type;
      this.analysis.isMultiLanguage = projectTypeInfo.isMultiLanguage;
      this.analysis.languages = projectTypeInfo.languages;
      this.analysis.framework = projectTypeInfo.framework;
      this.analysis.buildCommand = projectTypeInfo.buildCommand;
      this.analysis.devCommand = projectTypeInfo.devCommand;
      this.analysis.testCommand = projectTypeInfo.testCommand;
      this.analysis.confidence = projectTypeInfo.confidence;

      return this.analysis;
    } catch (error) {
      console.error("Error during project analysis:", error);
      // Return basic analysis on error
      return this.analysis;
    }
  }

  /**
   * Generate project documentation
   */
  async generateDocumentation(): Promise<void> {
    try {
      // Use DocumentationGenerator to create all documentation
      await this.docGenerator.generateDocumentation();
      console.log("✅ Project documentation generated successfully");
    } catch (error) {
      console.error("Error generating documentation:", error);
      throw error;
    }
  }

  /**
   * Extract project dependencies from various dependency files - UNIVERSAL
   */
  private async extractProjectDependencies(): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      // Node.js projects
      const packageJsonPath = path.join(this.projectRoot, "package.json");
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        dependencies.push(...Object.keys(allDeps));
      }

      // Python projects
      const requirementsPath = path.join(this.projectRoot, "requirements.txt");
      if (await fs.pathExists(requirementsPath)) {
        const content = await fs.readFile(requirementsPath, "utf-8");
        const lines = content
          .split("\n")
          .filter((line: string) => line.trim() && !line.startsWith("#"));
        dependencies.push(
          ...lines.map((line: string) => line.split("==")[0].trim())
        );
      }

      // Python pyproject.toml
      const pyprojectPath = path.join(this.projectRoot, "pyproject.toml");
      if (await fs.pathExists(pyprojectPath)) {
        const content = await fs.readFile(pyprojectPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (
            line.includes("=") &&
            (line.includes("dependencies") || line.includes("dev-dependencies"))
          ) {
            const match = line.match(/["']([^"']+)["']/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // PHP projects
      const composerPath = path.join(this.projectRoot, "composer.json");
      if (await fs.pathExists(composerPath)) {
        const composerJson = await fs.readJson(composerPath);
        const allDeps = {
          ...composerJson.require,
          ...composerJson["require-dev"],
        };
        dependencies.push(...Object.keys(allDeps));
      }

      // Java Maven projects
      const pomXmlPath = path.join(this.projectRoot, "pom.xml");
      if (await fs.pathExists(pomXmlPath)) {
        const content = await fs.readFile(pomXmlPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.includes("<artifactId>") && !line.includes("project")) {
            const match = line.match(/<artifactId>([^<]+)<\/artifactId>/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // Java Gradle projects
      const gradlePath = path.join(this.projectRoot, "build.gradle");
      if (await fs.pathExists(gradlePath)) {
        const content = await fs.readFile(gradlePath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.includes("implementation") || line.includes("api")) {
            const match = line.match(/['"]([^'"]+)['"]/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // Go projects
      const goModPath = path.join(this.projectRoot, "go.mod");
      if (await fs.pathExists(goModPath)) {
        const content = await fs.readFile(goModPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.startsWith("require") || line.startsWith("\t")) {
            const match = line.match(/([^\s]+)\s+v[\d.]+/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // Rust projects
      const cargoPath = path.join(this.projectRoot, "Cargo.toml");
      if (await fs.pathExists(cargoPath)) {
        const content = await fs.readFile(cargoPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (
            line.includes("=") &&
            (line.includes("dependencies") || line.includes("dev-dependencies"))
          ) {
            const match = line.match(/["']([^"']+)["']/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // Ruby projects
      const gemfilePath = path.join(this.projectRoot, "Gemfile");
      if (await fs.pathExists(gemfilePath)) {
        const content = await fs.readFile(gemfilePath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.includes("gem ")) {
            const match = line.match(/gem\s+['"]([^'"]+)['"]/);
            if (match) dependencies.push(match[1]);
          }
        }
      }

      // If no dependencies found, return empty array
      return dependencies.length > 0 ? dependencies : [];
    } catch (error) {
      console.error("Error extracting dependencies:", error);
      return [];
    }
  }

  /**
   * Detect project type from project path and files - COMPREHENSIVE
   */
  private detectProjectTypeFromPath(
    projectRoot: string
  ): ProjectAnalysis["projectType"] {
    try {
      // Priority-based detection (most specific first)
      const indicators = [
        // Node.js/JavaScript/TypeScript
        {
          type: "node" as const,
          files: ["package.json", "yarn.lock", "pnpm-lock.yaml"],
        },
        { type: "node" as const, patterns: ["*.js", "*.ts", "*.jsx", "*.tsx"] },

        // Python
        {
          type: "python" as const,
          files: ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"],
        },
        { type: "python" as const, patterns: ["*.py"] },

        // PHP
        {
          type: "php" as const,
          files: ["composer.json", "index.php", "artisan"],
        },
        { type: "php" as const, patterns: ["*.php"] },

        // Java
        {
          type: "java" as const,
          files: ["pom.xml", "build.gradle", "build.gradle.kts"],
        },
        { type: "java" as const, patterns: ["*.java"] },

        // Go
        { type: "go" as const, files: ["go.mod", "go.sum"] },
        { type: "go" as const, patterns: ["*.go"] },

        // Rust
        { type: "rust" as const, files: ["Cargo.toml", "Cargo.lock"] },
        { type: "rust" as const, patterns: ["*.rs"] },

        // Ruby
        { type: "ruby" as const, files: ["Gemfile", "Rakefile"] },
        { type: "ruby" as const, patterns: ["*.rb"] },
      ];

      // Use the new method to find all project files
      const projectFiles = this.findProjectFiles(projectRoot);

      // Count how many different types have files
      const typesWithFiles = Object.entries(projectFiles)
        .filter(([_type, files]) => files.length > 0) // eslint-disable-line @typescript-eslint/no-unused-vars
        .map(([_type]) => _type); // eslint-disable-line @typescript-eslint/no-unused-vars

      // If we have multiple types, it's a multi-language project
      if (typesWithFiles.length > 1) {
        // For now, return the type with the most files
        // TODO: Add support for multi-language project type
        let maxType = "unknown";
        let maxCount = 0;

        for (const [type, files] of Object.entries(projectFiles)) {
          if (files.length > maxCount) {
            maxCount = files.length;
            maxType = type;
          }
        }

        return maxType as ProjectAnalysis["projectType"];
      }

      // Single language project - return the found type
      if (projectFiles.node.length > 0) return "node";
      if (projectFiles.python.length > 0) return "python";
      if (projectFiles.java.length > 0) return "java";
      if (projectFiles.go.length > 0) return "go";
      if (projectFiles.rust.length > 0) return "rust";
      if (projectFiles.php.length > 0) return "php";
      if (projectFiles.ruby.length > 0) return "ruby";

      // Check file patterns (lower priority)
      const allFiles = this.getAllFilesRecursively(projectRoot);
      for (const indicator of indicators) {
        if (indicator.patterns) {
          for (const pattern of indicator.patterns) {
            const regex = new RegExp(pattern.replace("*", ".*"));
            if (allFiles.some((file) => regex.test(path.basename(file)))) {
              return indicator.type;
            }
          }
        }
      }

      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Find all project configuration files recursively
   */
  private findProjectFiles(rootDir: string): { [key: string]: string[] } {
    const projectFiles: { [key: string]: string[] } = {
      node: [],
      python: [],
      java: [],
      go: [],
      rust: [],
      php: [],
      ruby: [],
    };

    function scanDir(currentPath: string, depth: number = 0): void {
      if (depth > 5) return; // Limit depth to prevent infinite recursion

      try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Skip common system directories
            if (
              ![
                "node_modules",
                ".git",
                ".venv",
                "__pycache__",
                "target",
                "build",
                "dist",
                ".next",
              ].includes(item)
            ) {
              scanDir(fullPath, depth + 1);
            }
          } else {
            // Check for project files
            if (item === "package.json") {
              projectFiles.node.push(fullPath);
            } else if (
              item === "pyproject.toml" ||
              item === "requirements.txt" ||
              item === "setup.py"
            ) {
              projectFiles.python.push(fullPath);
            } else if (item === "pom.xml" || item === "build.gradle") {
              projectFiles.java.push(fullPath);
            } else if (item === "go.mod") {
              projectFiles.go.push(fullPath);
            } else if (item === "Cargo.toml") {
              projectFiles.rust.push(fullPath);
            } else if (item === "composer.json") {
              projectFiles.php.push(fullPath);
            } else if (item === "Gemfile") {
              projectFiles.ruby.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Silently ignore permission errors
      }
    }

    scanDir(rootDir);
    return projectFiles;
  }

  /**
   * Get all files recursively from project root
   */
  private getAllFilesRecursively(dirPath: string, maxDepth = 3): string[] {
    const files: string[] = [];

    function scanDir(currentPath: string, depth: number): void {
      if (depth > maxDepth) return;

      try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);

          if (
            stat.isDirectory() &&
            !item.startsWith(".") &&
            item !== "node_modules"
          ) {
            scanDir(fullPath, depth + 1);
          } else if (stat.isFile()) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }

    scanDir(dirPath, 0);
    return files;
  }

  /**
   * Detect architecture type based on project type and dependencies - UNIVERSAL
   */
  private detectArchitectureType(dependencies: string[]): string {
    // Node.js projects
    if (dependencies.includes("@modelcontextprotocol/sdk")) {
      return "mcp-server";
    }
    if (
      dependencies.includes("express") ||
      dependencies.includes("fastify") ||
      dependencies.includes("koa")
    ) {
      return "web-api";
    }
    if (
      dependencies.includes("react") ||
      dependencies.includes("vue") ||
      dependencies.includes("angular")
    ) {
      return "frontend";
    }
    if (dependencies.includes("commander") && dependencies.includes("chalk")) {
      return "cli-tool";
    }

    // Python projects
    if (
      dependencies.includes("django") ||
      dependencies.includes("flask") ||
      dependencies.includes("fastapi")
    ) {
      return "web-api";
    }
    if (dependencies.includes("click") || dependencies.includes("typer")) {
      return "cli-tool";
    }

    // PHP projects
    if (
      dependencies.includes("laravel/framework") ||
      dependencies.includes("symfony")
    ) {
      return "web-api";
    }

    // Java projects
    if (
      dependencies.includes("spring-boot") ||
      dependencies.includes("spring-web")
    ) {
      return "web-api";
    }
    if (dependencies.includes("spring-boot-starter-data-jpa")) {
      return "data-api";
    }

    // Go projects
    if (
      dependencies.includes("gin") ||
      dependencies.includes("echo") ||
      dependencies.includes("fiber")
    ) {
      return "web-api";
    }
    if (dependencies.includes("cobra") || dependencies.includes("cli")) {
      return "cli-tool";
    }

    // Rust projects
    if (
      dependencies.includes("actix-web") ||
      dependencies.includes("rocket") ||
      dependencies.includes("warp")
    ) {
      return "web-api";
    }
    if (dependencies.includes("clap") || dependencies.includes("structopt")) {
      return "cli-tool";
    }

    // Ruby projects
    if (dependencies.includes("rails") || dependencies.includes("sinatra")) {
      return "web-api";
    }
    if (dependencies.includes("thor")) {
      return "cli-tool";
    }

    return "modular";
  }

  /**
   * Generate architecture description based on dependencies - UNIVERSAL
   */
  private generateArchitectureDescription(dependencies: string[]): string {
    const features = [];

    // Node.js features
    if (dependencies.includes("@modelcontextprotocol/sdk")) {
      features.push("MCP protocol integration");
    }
    if (
      dependencies.includes("express") ||
      dependencies.includes("fastify") ||
      dependencies.includes("koa")
    ) {
      features.push("web framework");
    }
    if (
      dependencies.includes("react") ||
      dependencies.includes("vue") ||
      dependencies.includes("angular")
    ) {
      features.push("frontend framework");
    }
    if (dependencies.includes("commander")) {
      features.push("CLI interface");
    }
    if (dependencies.includes("chalk")) {
      features.push("terminal UI");
    }
    if (dependencies.includes("fs-extra")) {
      features.push("file system operations");
    }

    // Python features
    if (dependencies.includes("django")) {
      features.push("Django web framework");
    }
    if (dependencies.includes("flask")) {
      features.push("Flask web framework");
    }
    if (dependencies.includes("fastapi")) {
      features.push("FastAPI web framework");
    }
    if (dependencies.includes("click") || dependencies.includes("typer")) {
      features.push("CLI interface");
    }

    // PHP features
    if (dependencies.includes("laravel/framework")) {
      features.push("Laravel framework");
    }
    if (dependencies.includes("symfony")) {
      features.push("Symfony framework");
    }

    // Java features
    if (dependencies.includes("spring-boot")) {
      features.push("Spring Boot framework");
    }
    if (dependencies.includes("spring-boot-starter-data-jpa")) {
      features.push("JPA data layer");
    }

    // Go features
    if (
      dependencies.includes("gin") ||
      dependencies.includes("echo") ||
      dependencies.includes("fiber")
    ) {
      features.push("web framework");
    }
    if (dependencies.includes("cobra")) {
      features.push("CLI framework");
    }

    // Rust features
    if (
      dependencies.includes("actix-web") ||
      dependencies.includes("rocket") ||
      dependencies.includes("warp")
    ) {
      features.push("web framework");
    }
    if (dependencies.includes("clap")) {
      features.push("CLI framework");
    }

    // Ruby features
    if (dependencies.includes("rails")) {
      features.push("Rails framework");
    }
    if (dependencies.includes("sinatra")) {
      features.push("Sinatra web framework");
    }

    return features.length > 0
      ? `${features.join(", ")} architecture`
      : "Generic modular architecture";
  }

  /**
   * Detect architecture layers from project structure
   */
  private detectArchitectureLayers(): string[] {
    const layers = ["core"];

    // Check for common layer patterns
    const srcPath = path.join(this.projectRoot, "src");
    if (fs.existsSync(srcPath)) {
      const srcContents = fs.readdirSync(srcPath);
      if (srcContents.includes("adapters")) layers.push("adapters");
      if (srcContents.includes("services")) layers.push("services");
      if (srcContents.includes("utils")) layers.push("utils");
      if (srcContents.includes("cli")) layers.push("presentation");
    }

    return layers;
  }

  /**
   * Detect architecture patterns from dependencies - UNIVERSAL
   */
  private detectArchitecturePatterns(dependencies: string[]): string[] {
    const patterns = [];

    // Node.js patterns
    if (dependencies.includes("@modelcontextprotocol/sdk")) {
      patterns.push("protocol-adapter");
    }
    if (dependencies.includes("commander")) {
      patterns.push("command-pattern");
    }
    if (dependencies.includes("fs-extra")) {
      patterns.push("repository");
    }
    if (dependencies.includes("zod")) {
      patterns.push("validation");
    }

    // Python patterns
    if (dependencies.includes("sqlalchemy")) {
      patterns.push("repository");
      patterns.push("unit-of-work");
    }
    if (dependencies.includes("pydantic")) {
      patterns.push("validation");
    }

    // Java patterns
    if (dependencies.includes("spring-boot-starter-data-jpa")) {
      patterns.push("repository");
      patterns.push("unit-of-work");
    }
    if (dependencies.includes("spring-boot-starter-validation")) {
      patterns.push("validation");
    }

    // Go patterns
    if (dependencies.includes("gorm")) {
      patterns.push("repository");
    }

    // Rust patterns
    if (dependencies.includes("diesel") || dependencies.includes("sqlx")) {
      patterns.push("repository");
    }
    if (dependencies.includes("validator")) {
      patterns.push("validation");
    }

    // PHP patterns
    if (dependencies.includes("doctrine/orm")) {
      patterns.push("repository");
      patterns.push("unit-of-work");
    }

    return patterns.length > 0 ? patterns : ["modular"];
  }
}
