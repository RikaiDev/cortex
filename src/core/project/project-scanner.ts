/**
 * Project Scanner - Handles project structure scanning and file analysis
 *
 * This module provides functionality for scanning project structures,
 * analyzing file metadata, and identifying code patterns.
 */

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import * as ts from "typescript";

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
 * File metadata interface
 */
interface FileMetadata {
  language?: string;
  framework?: string;
}

// --- Start of Semantic Analysis Structures ---

/**
 * Defines the structure for a single parameter in a function or method.
 */
export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * Defines the structure for a single function or method.
 */
export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
}

/**
 * Defines the structure for a single class.
 */
export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: ParameterInfo[];
  isExported: boolean;
}

/**
 * Defines the structure for a single interface.
 */
export interface InterfaceInfo {
  name: string;
  properties: ParameterInfo[];
  isExported: boolean;
}

/**
 * Represents the semantic information extracted from a single file.
 */
export interface FileSemantics {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  imports: string[];
  exports: string[];
}

/**
 * Represents the structure of a single entry in the analysis cache.
 */
export interface CacheEntry {
  mtime: number;
  semantics: FileSemantics;
}

/**
 * Represents the entire file analysis cache.
 * The key is the absolute file path.
 */
export type FileAnalysisCache = Record<string, CacheEntry>;

// --- End of Semantic Analysis Structures ---

export class ProjectScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Scan project structure recursively
   */
  async scanProjectStructure(dirPath: string): Promise<ProjectStructure> {
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
        metadata: this.analyzeFileMetadata(name),
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
   */
  private analyzeFileMetadata(filename: string): FileMetadata {
    const ext = path.extname(filename);

    // Language detection
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".js": "javascript",
      ".tsx": "typescript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".go": "go",
      ".rs": "rust",
      ".php": "php",
      ".rb": "ruby",
      ".md": "markdown",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".xml": "xml",
      ".html": "html",
      ".css": "css",
      ".scss": "scss",
      ".less": "less",
    };

    const language = languageMap[ext];

    // Framework detection based on filename patterns
    let framework: string | undefined;
    const lowerName = filename.toLowerCase();

    if (lowerName.includes("package.json")) {
      framework = "node";
    } else if (
      lowerName.includes("requirements.txt") ||
      lowerName.includes("setup.py")
    ) {
      framework = "python";
    } else if (
      lowerName.includes("pom.xml") ||
      lowerName.includes("build.gradle")
    ) {
      framework = "java";
    } else if (lowerName.includes("cargo.toml")) {
      framework = "rust";
    } else if (lowerName.includes("go.mod")) {
      framework = "go";
    }

    return {
      language,
      framework,
    };
  }

  /**
   * Analyze code patterns in the project
   */
  async analyzeCodePatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];

    try {
      // Get all source files
      const sourceFiles = await this.getAllFiles();
      const codeFiles = sourceFiles.filter((file) =>
        /\.(ts|js|tsx|jsx|py|java|cpp|c|go|rs)$/.test(file)
      );

      // Analyze each file for patterns
      for (const file of codeFiles.slice(0, 10)) {
        // Limit to first 10 files for performance
        const content = await fs.readFile(file, "utf-8");
        const filePatterns = this.extractPatternsFromFile(content, file);
        patterns.push(...filePatterns);
      }

      // Remove duplicates and sort by frequency
      const uniquePatterns = this.deduplicatePatterns(patterns);
      return uniquePatterns.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error("Error analyzing code patterns:", error);
      return [];
    }
  }

  /**
   * Extract patterns from a single file
   */
  private extractPatternsFromFile(
    content: string,
    filePath: string
  ): CodePattern[] {
    const patterns: CodePattern[] = [];

    // Pattern detection logic would go here
    // This is a simplified version

    if (content.includes("async") && content.includes("await")) {
      patterns.push({
        name: "Async/Await Pattern",
        description:
          "Uses modern async/await syntax for asynchronous operations",
        examples: [
          "async function fetchData() { const result = await api.get(); }",
        ],
        frequency: 1,
        context: [filePath],
      });
    }

    if (content.includes("interface") || content.includes("type")) {
      patterns.push({
        name: "Type Definitions",
        description: "Uses TypeScript interfaces or type definitions",
        examples: ["interface User { name: string; age: number; }"],
        frequency: 1,
        context: [filePath],
      });
    }

    return patterns;
  }

  /**
   * Remove duplicate patterns
   */
  private deduplicatePatterns(patterns: CodePattern[]): CodePattern[] {
    const seen = new Set<string>();
    return patterns.filter((pattern) => {
      const key = pattern.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get all files in the project
   */
  private async getAllFiles(): Promise<string[]> {
    try {
      const pattern = "**/*";
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        absolute: true,
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/build/**",
          "**/.next/**",
          "**/.nuxt/**",
          "**/.vuepress/**",
          "**/.cache/**",
          "**/.DS_Store",
          "**/.*",
        ],
      });
      return files;
    } catch (error) {
      console.error("Error getting all files:", error);
      return [];
    }
  }

  /**
   * Identify coding conventions used in the project
   */
  async identifyConventions(): Promise<Convention[]> {
    const conventions: Convention[] = [];

    try {
      const sourceFiles = await this.getAllFiles();
      const codeFiles = sourceFiles.filter((file) =>
        /\.(ts|js|tsx|jsx)$/.test(file)
      );

      // Analyze naming conventions
      const namingConvention = await this.analyzeNamingConvention(codeFiles);
      if (namingConvention) {
        conventions.push(namingConvention);
      }

      // Analyze file structure conventions
      const structureConvention =
        await this.analyzeStructureConvention(codeFiles);
      if (structureConvention) {
        conventions.push(structureConvention);
      }
    } catch (error) {
      console.error("Error identifying conventions:", error);
    }

    return conventions;
  }

  /**
   * Analyze naming conventions
   */
  private async analyzeNamingConvention(
    files: string[]
  ): Promise<Convention | null> {
    // Analyze a sample of files for naming patterns
    const sampleFiles = files.slice(0, 20);
    let kebabCaseCount = 0;
    let camelCaseCount = 0;
    let pascalCaseCount = 0;

    for (const file of sampleFiles) {
      const filename = path.basename(file, path.extname(file));

      if (filename.includes("-")) {
        kebabCaseCount++;
      } else if (
        filename[0] === filename[0].toLowerCase() &&
        /[A-Z]/.test(filename)
      ) {
        camelCaseCount++;
      } else if (filename[0] === filename[0].toUpperCase()) {
        pascalCaseCount++;
      }
    }

    // Determine the predominant naming convention
    if (kebabCaseCount > camelCaseCount && kebabCaseCount > pascalCaseCount) {
      return {
        type: "naming",
        description:
          "Files are named using kebab-case (lowercase with hyphens)",
        enforcement: "recommended",
        examples: ["user-service.ts", "data-manager.js"],
      };
    }

    return null;
  }

  /**
   * Analyze structure conventions
   */
  private async analyzeStructureConvention(
    files: string[]
  ): Promise<Convention | null> {
    // Check if files follow a consistent directory structure
    const directories = new Set<string>();

    for (const file of files) {
      const relativePath = path.relative(this.projectRoot, file);
      const dir = path.dirname(relativePath);
      if (dir !== ".") {
        directories.add(dir);
      }
    }

    if (directories.has("src/core") && directories.has("src/adapters")) {
      return {
        type: "structure",
        description:
          "Project uses core/adapters structure pattern for better separation of concerns",
        enforcement: "strict",
        examples: ["src/core/", "src/adapters/"],
      };
    }

    return null;
  }

  /**
   * Detect tools and their configurations
   */
  async detectTools(): Promise<ToolInfo[]> {
    const tools: ToolInfo[] = [];

    // Check for common development tools
    const toolChecks: ToolInfo[] = [
      {
        name: "TypeScript",
        type: "other" as const,
        command: "tsc",
        configFiles: ["tsconfig.json"],
        description: "TypeScript compiler for type checking",
        priority: "primary" as const,
      },
      {
        name: "ESLint",
        type: "lint" as const,
        command: "eslint",
        configFiles: [".eslintrc.js", ".eslintrc.json", ".eslintrc.yml"],
        description: "JavaScript/TypeScript linting tool",
        priority: "primary" as const,
      },
      {
        name: "Prettier",
        type: "format" as const,
        command: "prettier",
        configFiles: [".prettierrc", ".prettierrc.json", "prettier.config.js"],
        description: "Code formatting tool",
        priority: "secondary" as const,
      },
    ];

    for (const tool of toolChecks) {
      if (await this.hasToolConfig(tool.configFiles)) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Check if any of the config files exist
   */
  private async hasToolConfig(configFiles: string[]): Promise<boolean> {
    for (const configFile of configFiles) {
      if (await fs.pathExists(path.join(this.projectRoot, configFile))) {
        return true;
      }
    }
    return false;
  }

  // --- Start of Semantic Analysis Methods ---

  /**
   * Performs a full semantic analysis of all relevant source files in the project.
   * Uses a caching mechanism to avoid re-analyzing unchanged files.
   * @returns A map where keys are file paths and values are the semantic analysis results.
   */
  async performSemanticAnalysis(): Promise<Record<string, FileSemantics>> {
    const sourceFiles = await this.getAllFiles();
    const tsFiles = sourceFiles.filter((file) => /\.ts$/.test(file));
    const cache = await this.loadAnalysisCache();
    const analysisResults: Record<string, FileSemantics> = {};

    for (const file of tsFiles) {
      try {
        const result = await this.analyzeFileSemantics(file, cache);
        analysisResults[file] = result;
      } catch (error) {
        console.error(`Error analyzing semantics for ${file}:`, error);
      }
    }

    await this.saveAnalysisCache(cache);
    return analysisResults;
  }

  /**
   * Analyzes a single file to extract semantic information using AST.
   * Handles cache-checking, -reading, and -writing.
   * @param filePath The absolute path to the file to analyze.
   * @param cache The analysis cache, which will be updated by this method.
   * @returns The semantic information for the file.
   */
  private async analyzeFileSemantics(
    filePath: string,
    cache: FileAnalysisCache
  ): Promise<FileSemantics> {
    const stats = await fs.stat(filePath);
    const mtime = stats.mtime.getTime();

    // Check cache first
    if (cache[filePath] && cache[filePath].mtime === mtime) {
      return cache[filePath].semantics;
    }

    // If not in cache or modified, perform analysis
    const content = await fs.readFile(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // --- Start of AST Traversal Logic ---
    const semantics: FileSemantics = {
      functions: [],
      classes: [],
      interfaces: [],
      imports: [],
      exports: [],
    };

    const visit = (node: ts.Node): void => {
      // Extract imports
      if (ts.isImportDeclaration(node)) {
        const importPath = node.moduleSpecifier
          .getText(sourceFile)
          .replace(/['"]/g, "");
        semantics.imports.push(importPath);
      }

      // Extract functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported =
          node.modifiers?.some(
            (mod: ts.ModifierLike) => mod.kind === ts.SyntaxKind.ExportKeyword
          ) ?? false;
        const funcInfo: FunctionInfo = {
          name: node.name.text,
          parameters: node.parameters.map((p) => ({
            name: p.name.getText(sourceFile),
            type: p.type?.getText(sourceFile) ?? "any",
            optional: !!p.questionToken,
          })),
          returnType: node.type?.getText(sourceFile) ?? "void",
          isAsync:
            node.modifiers?.some(
              (mod: ts.ModifierLike) => mod.kind === ts.SyntaxKind.AsyncKeyword
            ) ?? false,
          isExported: isExported || ts.isSourceFile(node.parent), // Top-level functions in module are often exported by default
        };
        semantics.functions.push(funcInfo);
      }

      // Extract classes
      if (ts.isClassDeclaration(node) && node.name) {
        const isExported =
          node.modifiers?.some(
            (mod: ts.ModifierLike) => mod.kind === ts.SyntaxKind.ExportKeyword
          ) ?? false;
        const classInfo: ClassInfo = {
          name: node.name.text,
          methods: [],
          properties: [],
          isExported: isExported,
        };

        node.members.forEach((member) => {
          if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
            classInfo.methods.push({
              name: member.name.text,
              parameters: member.parameters.map((p) => ({
                name: p.name.getText(sourceFile),
                type: p.type?.getText(sourceFile) ?? "any",
                optional: !!p.questionToken,
              })),
              returnType: member.type?.getText(sourceFile) ?? "void",
              isAsync:
                member.modifiers?.some(
                  (mod: ts.ModifierLike) =>
                    mod.kind === ts.SyntaxKind.AsyncKeyword
                ) ?? false,
              isExported:
                member.modifiers?.some(
                  (mod: ts.ModifierLike) =>
                    mod.kind === ts.SyntaxKind.ExportKeyword
                ) ?? false, // Not directly applicable on class methods
            });
          } else if (
            ts.isPropertyDeclaration(member) &&
            ts.isIdentifier(member.name)
          ) {
            classInfo.properties.push({
              name: member.name.text,
              type: member.type?.getText(sourceFile) ?? "any",
              optional: !!member.questionToken,
            });
          }
        });
        semantics.classes.push(classInfo);
      }

      // Extract interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const isExported =
          node.modifiers?.some(
            (mod: ts.ModifierLike) => mod.kind === ts.SyntaxKind.ExportKeyword
          ) ?? false;
        const interfaceInfo: InterfaceInfo = {
          name: node.name.text,
          properties: [],
          isExported: isExported,
        };
        node.members.forEach((member) => {
          if (
            ts.isPropertySignature(member) &&
            member.name &&
            ts.isIdentifier(member.name)
          ) {
            interfaceInfo.properties.push({
              name: member.name.text,
              type: member.type?.getText(sourceFile) ?? "any",
              optional: !!member.questionToken,
            });
          }
        });
        semantics.interfaces.push(interfaceInfo);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    // --- End of AST Traversal Logic ---

    // Update cache
    cache[filePath] = { mtime, semantics };

    return semantics;
  }

  /**
   * Loads the semantic analysis cache from the filesystem.
   * @returns The loaded cache object, or an empty object if it doesn't exist.
   */
  private async loadAnalysisCache(): Promise<FileAnalysisCache> {
    const cachePath = path.join(
      this.projectRoot,
      ".cortex",
      "analysis-cache.json"
    );
    try {
      if (await fs.pathExists(cachePath)) {
        return await fs.readJson(cachePath);
      }
    } catch (error) {
      console.error("Error loading analysis cache:", error);
    }
    return {};
  }

  /**
   * Saves the semantic analysis cache to the filesystem.
   * @param cache The cache object to save.
   */
  private async saveAnalysisCache(cache: FileAnalysisCache): Promise<void> {
    const cachePath = path.join(
      this.projectRoot,
      ".cortex",
      "analysis-cache.json"
    );
    try {
      await fs.ensureDir(path.dirname(cachePath));
      await fs.writeJson(cachePath, cache, { spaces: 2 });
    } catch (error) {
      console.error("Error saving analysis cache:", error);
    }
  }

  // --- End of Semantic Analysis Methods ---
}
