/**
 * Documentation Service
 *
 * Analyzes documentation coverage, validates examples, and generates templates
 */

import { promises as fs } from "fs";
import * as path from "path";
import type {
  DocStatus,
  DocumentableEntity,
  DocQuality,
  DocTag,
  DocTagType,
  DocBlock,
  DocumentableItem,
  DocCoverageMetrics,
  FileDocAnalysis,
  DocExample,
  DocIssue,
  DocTemplate,
  DocAnalysisResult,
  MissingDocResult,
  DocValidationResult,
  DocGenerationResult,
  DocAnalysisOptions,
  DocThresholds,
} from "../types/documentation.js";
import { DEFAULT_DOC_THRESHOLDS } from "../types/documentation.js";

/**
 * Service for analyzing documentation coverage and generating templates.
 *
 * Parses JSDoc/TSDoc comments, calculates coverage metrics, validates
 * code examples, and generates documentation stubs for undocumented code.
 */
export class DocumentationService {
  private thresholds: DocThresholds;

  /** Directories to exclude */
  private static readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".nyc_output",
    "__pycache__",
    ".pytest_cache",
    "vendor",
  ];

  /** File extensions to analyze */
  private static readonly EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

  constructor(
    private readonly projectRoot: string,
    thresholds?: Partial<DocThresholds>
  ) {
    this.thresholds = { ...DEFAULT_DOC_THRESHOLDS, ...thresholds };
  }

  /**
   * Analyze documentation coverage
   */
  async analyzeDocumentation(
    options: DocAnalysisOptions = {}
  ): Promise<DocAnalysisResult> {
    const files = options.files || (await this.findSourceFiles());
    const fileAnalyses: FileDocAnalysis[] = [];
    const allIssues: DocIssue[] = [];

    for (const file of files) {
      const analysis = await this.analyzeFile(file, options);
      fileAnalyses.push(analysis);
      allIssues.push(...this.findIssues(analysis));
    }

    // Calculate overall coverage
    const coverage = this.calculateOverallCoverage(fileAnalyses);
    const qualityScore = this.calculateQualityScore(coverage, allIssues);
    const quality = this.getQualityRating(qualityScore);

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalItems: coverage.total,
      coverage,
      qualityScore,
      quality,
      files: fileAnalyses,
      issues: allIssues,
      summary: this.generateAnalysisSummary(coverage, qualityScore, allIssues),
    };
  }

  /**
   * Find undocumented code
   */
  async findMissingDocumentation(
    options: DocAnalysisOptions = {}
  ): Promise<MissingDocResult> {
    const files = options.files || (await this.findSourceFiles());
    const byFile: MissingDocResult["byFile"] = [];
    const byType: Record<DocumentableEntity, number> = {
      class: 0,
      interface: 0,
      type: 0,
      enum: 0,
      function: 0,
      method: 0,
      property: 0,
      constant: 0,
      variable: 0,
    };

    let totalMissing = 0;
    const priorityItems: DocumentableItem[] = [];

    for (const file of files) {
      const analysis = await this.analyzeFile(file, options);
      const missingItems = analysis.items.filter(
        (item) => item.status === "missing" || item.status === "partial"
      );

      if (missingItems.length > 0) {
        byFile.push({
          file: path.relative(this.projectRoot, file),
          count: missingItems.length,
          items: missingItems,
        });

        for (const item of missingItems) {
          byType[item.type]++;
          totalMissing++;

          // Priority: public exported items
          if (item.isPublic) {
            priorityItems.push(item);
          }
        }
      }
    }

    // Sort by count descending
    byFile.sort((a, b) => b.count - a.count);

    // Sort priority items by type importance
    const typeOrder: DocumentableEntity[] = [
      "class",
      "interface",
      "function",
      "method",
      "type",
      "enum",
      "property",
      "constant",
      "variable",
    ];
    priorityItems.sort(
      (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    );

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalMissing,
      byType,
      byFile,
      priorityItems: priorityItems.slice(0, 20),
      summary: this.generateMissingSummary(totalMissing, byType, priorityItems),
    };
  }

  /**
   * Validate documentation examples
   */
  async validateDocumentation(
    options: DocAnalysisOptions = {}
  ): Promise<DocValidationResult> {
    const files = options.files || (await this.findSourceFiles());
    const examples: DocExample[] = [];
    const issues: DocIssue[] = [];

    for (const file of files) {
      const content = await this.readFile(file);
      if (!content) continue;

      const fileExamples = this.extractExamples(file, content);
      examples.push(...fileExamples);

      // Validate each example
      for (const example of fileExamples) {
        const validation = this.validateExample(example);
        if (!validation.isValid) {
          example.isValid = false;
          example.error = validation.error;
          issues.push({
            type: "invalid-example",
            severity: "warning",
            file: path.relative(this.projectRoot, file),
            line: example.line,
            entityName: example.entityName,
            description: `Invalid code example: ${validation.error}`,
            suggestion: "Fix the syntax error in the example code",
          });
        }
      }
    }

    const validCount = examples.filter((e) => e.isValid).length;

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalExamples: examples.length,
      validExamples: validCount,
      invalidExamples: examples.length - validCount,
      examples,
      issues,
      summary: this.generateValidationSummary(examples, issues),
    };
  }

  /**
   * Generate documentation templates for missing docs
   */
  async generateDocumentation(
    options: DocAnalysisOptions = {}
  ): Promise<DocGenerationResult> {
    const missing = await this.findMissingDocumentation(options);
    const templates: DocTemplate[] = [];

    for (const fileGroup of missing.byFile) {
      for (const item of fileGroup.items) {
        const template = this.generateTemplate(item);
        templates.push(template);
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      filesProcessed: missing.byFile.length,
      templatesGenerated: templates.length,
      templates,
      summary: this.generateGenerationSummary(templates),
    };
  }

  /**
   * Find source files to analyze
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    await this.walkDirectory(this.projectRoot, files);
    return files;
  }

  /**
   * Walk directory recursively
   */
  private async walkDirectory(dir: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!DocumentationService.EXCLUDE_DIRS.includes(entry.name)) {
            await this.walkDirectory(fullPath, files);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (DocumentationService.EXTENSIONS.includes(ext)) {
            // Skip test files and declaration files
            if (
              !entry.name.includes(".test.") &&
              !entry.name.includes(".spec.") &&
              !entry.name.endsWith(".d.ts")
            ) {
              files.push(fullPath);
            }
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(
    filePath: string,
    options: DocAnalysisOptions
  ): Promise<FileDocAnalysis> {
    const relativePath = path.relative(this.projectRoot, filePath);
    const content = await this.readFile(filePath);

    if (!content) {
      return this.emptyFileAnalysis(relativePath);
    }

    const items = this.extractDocumentableItems(
      filePath,
      content,
      options.includePrivate ?? false
    );
    const coverage = this.calculateFileCoverage(items);
    const qualityScore = this.calculateFileQualityScore(items);

    return {
      file: relativePath,
      items,
      coverage,
      qualityScore,
      quality: this.getQualityRating(qualityScore),
    };
  }

  /**
   * Extract documentable items from content
   */
  private extractDocumentableItems(
    filePath: string,
    content: string,
    includePrivate: boolean
  ): DocumentableItem[] {
    const items: DocumentableItem[] = [];
    const lines = content.split("\n");
    const relativePath = path.relative(this.projectRoot, filePath);

    // Track doc blocks
    const docBlocks = this.extractDocBlocks(content);

    // Extract classes
    const classPattern = /^(\s*)(export\s+)?(abstract\s+)?class\s+(\w+)/gm;
    let match;

    while ((match = classPattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const isPublic = !!match[2];

      if (!isPublic && !includePrivate) continue;

      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);
      items.push({
        name: match[4],
        type: "class",
        file: relativePath,
        startLine: lineNum,
        endLine: this.findBlockEnd(lines, lineNum),
        isPublic,
        status: this.getDocStatus(docBlock),
        documentation: docBlock,
      });
    }

    // Extract interfaces
    const interfacePattern = /^(\s*)(export\s+)?interface\s+(\w+)/gm;
    while ((match = interfacePattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const isPublic = !!match[2];

      if (!isPublic && !includePrivate) continue;

      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);
      items.push({
        name: match[3],
        type: "interface",
        file: relativePath,
        startLine: lineNum,
        endLine: this.findBlockEnd(lines, lineNum),
        isPublic,
        status: this.getDocStatus(docBlock),
        documentation: docBlock,
      });
    }

    // Extract type aliases
    const typePattern = /^(\s*)(export\s+)?type\s+(\w+)\s*=/gm;
    while ((match = typePattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const isPublic = !!match[2];

      if (!isPublic && !includePrivate) continue;

      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);
      items.push({
        name: match[3],
        type: "type",
        file: relativePath,
        startLine: lineNum,
        endLine: lineNum,
        isPublic,
        status: this.getDocStatus(docBlock),
        documentation: docBlock,
      });
    }

    // Extract enums
    const enumPattern = /^(\s*)(export\s+)?(const\s+)?enum\s+(\w+)/gm;
    while ((match = enumPattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const isPublic = !!match[2];

      if (!isPublic && !includePrivate) continue;

      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);
      items.push({
        name: match[4],
        type: "enum",
        file: relativePath,
        startLine: lineNum,
        endLine: this.findBlockEnd(lines, lineNum),
        isPublic,
        status: this.getDocStatus(docBlock),
        documentation: docBlock,
      });
    }

    // Extract functions
    const functionPattern =
      /^(\s*)(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/gm;
    while ((match = functionPattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const isPublic = !!match[2];

      if (!isPublic && !includePrivate) continue;

      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);
      const params = this.parseParameters(match[5]);
      const paramDocs = this.getDocumentedParams(docBlock);

      items.push({
        name: match[4],
        type: "function",
        file: relativePath,
        startLine: lineNum,
        endLine: this.findBlockEnd(lines, lineNum),
        isPublic,
        status: this.getFunctionDocStatus(docBlock, params, paramDocs),
        documentation: docBlock,
        parameters: params.map((p) => ({
          name: p,
          isDocumented: paramDocs.includes(p),
        })),
        isReturnDocumented: this.hasReturnDoc(docBlock),
      });
    }

    // Extract exported constants
    const constPattern = /^(\s*)(export\s+)const\s+(\w+)\s*[=:]/gm;
    while ((match = constPattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      const docBlock = this.findDocBlockBefore(docBlocks, lineNum);

      items.push({
        name: match[3],
        type: "constant",
        file: relativePath,
        startLine: lineNum,
        endLine: lineNum,
        isPublic: true,
        status: this.getDocStatus(docBlock),
        documentation: docBlock,
      });
    }

    return items;
  }

  /**
   * Extract JSDoc blocks from content
   */
  private extractDocBlocks(content: string): DocBlock[] {
    const blocks: DocBlock[] = [];
    const pattern = /\/\*\*[\s\S]*?\*\//g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const startLine = this.getLineNumber(content, match.index);
      const endLine = this.getLineNumber(
        content,
        match.index + match[0].length
      );
      const block = this.parseDocBlock(match[0], startLine);
      block.endLine = endLine;
      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Parse a JSDoc block
   */
  private parseDocBlock(raw: string, startLine: number): DocBlock {
    const lines = raw.split("\n");
    const tags: DocTag[] = [];
    let description = "";
    let currentTag: DocTag | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
        .replace(/^\s*\/\*\*\s*/, "")
        .replace(/^\s*\*\/\s*$/, "")
        .replace(/^\s*\*\s?/, "")
        .trim();

      if (!line) continue;

      // Check for tag
      const tagMatch = line.match(
        /^@(\w+)(?:\s+(\{[^}]+\}))?(?:\s+(\w+))?\s*(.*)?$/
      );
      if (tagMatch) {
        if (currentTag) {
          tags.push(currentTag);
        }

        const tagType = tagMatch[1] as DocTagType;
        currentTag = {
          type: tagType,
          name: tagMatch[3],
          value: tagMatch[4] || "",
          line: startLine + i,
        };
      } else if (currentTag) {
        // Continue previous tag
        currentTag.value += " " + line;
      } else {
        // Part of description
        description += (description ? " " : "") + line;
      }
    }

    if (currentTag) {
      tags.push(currentTag);
    }

    return {
      description: description.trim(),
      tags,
      startLine,
      endLine: startLine,
      raw,
    };
  }

  /**
   * Find doc block before a line
   */
  private findDocBlockBefore(
    blocks: DocBlock[],
    line: number
  ): DocBlock | undefined {
    // Find the closest doc block that ends just before this line
    for (const block of blocks) {
      if (block.endLine === line - 1 || block.endLine === line - 2) {
        return block;
      }
    }
    return undefined;
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split("\n");
    return lines.length;
  }

  /**
   * Find end of code block
   */
  private findBlockEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let started = false;

    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === "{") {
          braceCount++;
          started = true;
        } else if (char === "}") {
          braceCount--;
          if (started && braceCount === 0) {
            return i + 1;
          }
        }
      }
    }

    return startLine;
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];

    const params: string[] = [];
    let depth = 0;
    let current = "";

    for (const char of paramString) {
      if (char === "(" || char === "<" || char === "{" || char === "[") {
        depth++;
        current += char;
      } else if (char === ")" || char === ">" || char === "}" || char === "]") {
        depth--;
        current += char;
      } else if (char === "," && depth === 0) {
        const param = this.extractParamName(current.trim());
        if (param) params.push(param);
        current = "";
      } else {
        current += char;
      }
    }

    const lastParam = this.extractParamName(current.trim());
    if (lastParam) params.push(lastParam);

    return params;
  }

  /**
   * Extract parameter name from declaration
   */
  private extractParamName(param: string): string | null {
    if (!param) return null;
    const match = param.match(/^(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Get documented parameters from doc block
   */
  private getDocumentedParams(docBlock?: DocBlock): string[] {
    if (!docBlock) return [];
    return docBlock.tags
      .filter((t) => t.type === "param" && t.name)
      .map((t) => t.name!);
  }

  /**
   * Check if doc block has @returns
   */
  private hasReturnDoc(docBlock?: DocBlock): boolean {
    if (!docBlock) return false;
    return docBlock.tags.some((t) => t.type === "returns");
  }

  /**
   * Get documentation status
   */
  private getDocStatus(docBlock?: DocBlock): DocStatus {
    if (!docBlock) return "missing";
    if (!docBlock.description && docBlock.tags.length === 0) return "missing";
    if (!docBlock.description) return "partial";
    return "documented";
  }

  /**
   * Get function documentation status
   */
  private getFunctionDocStatus(
    docBlock: DocBlock | undefined,
    params: string[],
    documentedParams: string[]
  ): DocStatus {
    if (!docBlock) return "missing";
    if (!docBlock.description) return "partial";

    // Check if all params are documented
    const allParamsDocumented = params.every((p) =>
      documentedParams.includes(p)
    );
    if (!allParamsDocumented && params.length > 0) return "partial";

    return "documented";
  }

  /**
   * Extract code examples from content
   */
  private extractExamples(filePath: string, content: string): DocExample[] {
    const examples: DocExample[] = [];
    const relativePath = path.relative(this.projectRoot, filePath);

    // Find @example tags
    const examplePattern = /@example\s*\n\s*\*?\s*```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = examplePattern.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      const language = match[1] || "typescript";
      const code = match[2].replace(/^\s*\*\s?/gm, "").trim();

      // Find the entity this example belongs to
      const entityName = this.findEntityForExample(content, match.index);

      examples.push({
        file: relativePath,
        line,
        entityName,
        code,
        isValid: true,
        language,
      });
    }

    return examples;
  }

  /**
   * Find entity name for an example
   */
  private findEntityForExample(content: string, exampleIndex: number): string {
    // Look for the next function/class/interface declaration after the doc block
    const afterExample = content.substring(exampleIndex);
    const match = afterExample.match(
      /\*\/\s*\n\s*(export\s+)?(async\s+)?(function|class|interface|type|const|enum)\s+(\w+)/
    );
    return match ? match[4] : "unknown";
  }

  /**
   * Validate a code example
   */
  private validateExample(example: DocExample): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // Basic syntax validation - check for common issues
      const code = example.code;

      // Check for unclosed brackets
      const brackets: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
      };
      const stack: string[] = [];

      for (const char of code) {
        if (brackets[char]) {
          stack.push(brackets[char]);
        } else if (Object.values(brackets).includes(char)) {
          if (stack.pop() !== char) {
            return { isValid: false, error: `Mismatched bracket: ${char}` };
          }
        }
      }

      if (stack.length > 0) {
        return { isValid: false, error: "Unclosed brackets" };
      }

      // Check for unclosed strings
      const stringPattern = /(['"`])(?:(?!\1)[^\\]|\\.)*$/;
      if (stringPattern.test(code)) {
        return { isValid: false, error: "Unclosed string" };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Find issues in file analysis
   */
  private findIssues(analysis: FileDocAnalysis): DocIssue[] {
    const issues: DocIssue[] = [];

    for (const item of analysis.items) {
      // Missing documentation
      if (item.status === "missing") {
        issues.push({
          type: "missing-doc",
          severity: item.isPublic ? "error" : "warning",
          file: analysis.file,
          line: item.startLine,
          entityName: item.name,
          description: `Missing documentation for ${item.type} '${item.name}'`,
          suggestion: `Add JSDoc comment above ${item.type} declaration`,
        });
      }

      // Empty description
      if (
        item.documentation &&
        !item.documentation.description &&
        item.status !== "missing"
      ) {
        issues.push({
          type: "empty-description",
          severity: "warning",
          file: analysis.file,
          line: item.startLine,
          entityName: item.name,
          description: `Empty description for ${item.type} '${item.name}'`,
          suggestion: "Add a meaningful description to the JSDoc comment",
        });
      }

      // Missing parameter documentation
      if (item.parameters) {
        for (const param of item.parameters) {
          if (!param.isDocumented && this.thresholds.requireParams) {
            issues.push({
              type: "missing-param",
              severity: "warning",
              file: analysis.file,
              line: item.startLine,
              entityName: item.name,
              description: `Missing @param documentation for '${param.name}'`,
              suggestion: `Add @param ${param.name} - description`,
            });
          }
        }
      }

      // Missing return documentation
      if (
        item.type === "function" &&
        !item.isReturnDocumented &&
        this.thresholds.requireReturns
      ) {
        issues.push({
          type: "missing-return",
          severity: "info",
          file: analysis.file,
          line: item.startLine,
          entityName: item.name,
          description: `Missing @returns documentation for function '${item.name}'`,
          suggestion: "Add @returns description",
        });
      }
    }

    return issues;
  }

  /**
   * Generate documentation template for an item
   */
  private generateTemplate(item: DocumentableItem): DocTemplate {
    let template = "/**\n";
    template += ` * ${this.generateDescription(item)}\n`;

    // Add parameter docs for functions
    if (item.parameters && item.parameters.length > 0) {
      template += " *\n";
      for (const param of item.parameters) {
        template += ` * @param ${param.name} - TODO: Add description\n`;
      }
    }

    // Add return doc for functions
    if (item.type === "function" || item.type === "method") {
      template += " * @returns TODO: Add return description\n";
    }

    template += " */";

    return {
      entityName: item.name,
      entityType: item.type,
      file: item.file,
      insertLine: item.startLine,
      template,
      confidence: 0.8,
    };
  }

  /**
   * Generate description for an item
   */
  private generateDescription(item: DocumentableItem): string {
    // Convert camelCase/PascalCase to words
    const words = item.name
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase();

    switch (item.type) {
      case "class":
        return `${words} class`;
      case "interface":
        return `${words} interface`;
      case "function":
        return `${words}`;
      case "method":
        return `${words}`;
      case "type":
        return `${words} type`;
      case "enum":
        return `${words} enum`;
      case "constant":
        return `${words} constant`;
      default:
        return `TODO: Add description for ${item.name}`;
    }
  }

  /**
   * Calculate file coverage
   */
  private calculateFileCoverage(items: DocumentableItem[]): DocCoverageMetrics {
    const byType: Record<
      DocumentableEntity,
      { total: number; documented: number }
    > = {
      class: { total: 0, documented: 0 },
      interface: { total: 0, documented: 0 },
      type: { total: 0, documented: 0 },
      enum: { total: 0, documented: 0 },
      function: { total: 0, documented: 0 },
      method: { total: 0, documented: 0 },
      property: { total: 0, documented: 0 },
      constant: { total: 0, documented: 0 },
      variable: { total: 0, documented: 0 },
    };

    let total = 0;
    let documented = 0;
    let partial = 0;
    let missing = 0;

    for (const item of items) {
      total++;
      byType[item.type].total++;

      if (item.status === "documented") {
        documented++;
        byType[item.type].documented++;
      } else if (item.status === "partial") {
        partial++;
      } else {
        missing++;
      }
    }

    return {
      total,
      documented,
      partial,
      missing,
      coverage: total > 0 ? Math.round((documented / total) * 100) : 100,
      byType,
    };
  }

  /**
   * Calculate overall coverage
   */
  private calculateOverallCoverage(
    files: FileDocAnalysis[]
  ): DocCoverageMetrics {
    const byType: Record<
      DocumentableEntity,
      { total: number; documented: number }
    > = {
      class: { total: 0, documented: 0 },
      interface: { total: 0, documented: 0 },
      type: { total: 0, documented: 0 },
      enum: { total: 0, documented: 0 },
      function: { total: 0, documented: 0 },
      method: { total: 0, documented: 0 },
      property: { total: 0, documented: 0 },
      constant: { total: 0, documented: 0 },
      variable: { total: 0, documented: 0 },
    };

    let total = 0;
    let documented = 0;
    let partial = 0;
    let missing = 0;

    for (const file of files) {
      total += file.coverage.total;
      documented += file.coverage.documented;
      partial += file.coverage.partial;
      missing += file.coverage.missing;

      for (const type of Object.keys(byType) as DocumentableEntity[]) {
        byType[type].total += file.coverage.byType[type].total;
        byType[type].documented += file.coverage.byType[type].documented;
      }
    }

    return {
      total,
      documented,
      partial,
      missing,
      coverage: total > 0 ? Math.round((documented / total) * 100) : 100,
      byType,
    };
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(
    coverage: DocCoverageMetrics,
    issues: DocIssue[]
  ): number {
    let score = coverage.coverage;

    // Deduct for issues
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    score -= errorCount * 5;
    score -= warningCount * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate file quality score
   */
  private calculateFileQualityScore(items: DocumentableItem[]): number {
    if (items.length === 0) return 100;

    let score = 0;
    for (const item of items) {
      if (item.status === "documented") {
        score += 100;
      } else if (item.status === "partial") {
        score += 50;
      }
    }

    return Math.round(score / items.length);
  }

  /**
   * Get quality rating from score
   */
  private getQualityRating(score: number): DocQuality {
    if (score >= 90) return "excellent";
    if (score >= this.thresholds.goodCoverage) return "good";
    if (score >= this.thresholds.fairCoverage) return "fair";
    if (score > 0) return "poor";
    return "none";
  }

  /**
   * Generate empty file analysis
   */
  private emptyFileAnalysis(file: string): FileDocAnalysis {
    return {
      file,
      items: [],
      coverage: {
        total: 0,
        documented: 0,
        partial: 0,
        missing: 0,
        coverage: 100,
        byType: {
          class: { total: 0, documented: 0 },
          interface: { total: 0, documented: 0 },
          type: { total: 0, documented: 0 },
          enum: { total: 0, documented: 0 },
          function: { total: 0, documented: 0 },
          method: { total: 0, documented: 0 },
          property: { total: 0, documented: 0 },
          constant: { total: 0, documented: 0 },
          variable: { total: 0, documented: 0 },
        },
      },
      qualityScore: 100,
      quality: "excellent",
    };
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(
    coverage: DocCoverageMetrics,
    score: number,
    issues: DocIssue[]
  ): string {
    const lines: string[] = [];

    lines.push(`Documentation Coverage: ${coverage.coverage}%`);
    lines.push(`Quality Score: ${score}/100`);
    lines.push("");
    lines.push(`Documented: ${coverage.documented}/${coverage.total} items`);
    if (coverage.partial > 0) {
      lines.push(`Partially documented: ${coverage.partial} items`);
    }
    if (coverage.missing > 0) {
      lines.push(`Missing documentation: ${coverage.missing} items`);
    }

    if (issues.length > 0) {
      lines.push("");
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings = issues.filter((i) => i.severity === "warning").length;
      lines.push(`Issues: ${errors} errors, ${warnings} warnings`);
    }

    return lines.join("\n");
  }

  /**
   * Generate missing documentation summary
   */
  private generateMissingSummary(
    total: number,
    byType: Record<DocumentableEntity, number>,
    priority: DocumentableItem[]
  ): string {
    const lines: string[] = [];

    lines.push(`Total missing documentation: ${total} items`);
    lines.push("");
    lines.push("By type:");

    for (const [type, count] of Object.entries(byType)) {
      if (count > 0) {
        lines.push(`  - ${type}: ${count}`);
      }
    }

    if (priority.length > 0) {
      lines.push("");
      lines.push(`Priority items (public APIs): ${priority.length}`);
    }

    return lines.join("\n");
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(
    examples: DocExample[],
    issues: DocIssue[]
  ): string {
    const valid = examples.filter((e) => e.isValid).length;
    const lines: string[] = [];

    lines.push(`Total examples: ${examples.length}`);
    lines.push(`Valid: ${valid}`);
    lines.push(`Invalid: ${examples.length - valid}`);

    if (issues.length > 0) {
      lines.push("");
      lines.push(`Issues found: ${issues.length}`);
    }

    return lines.join("\n");
  }

  /**
   * Generate generation summary
   */
  private generateGenerationSummary(templates: DocTemplate[]): string {
    const lines: string[] = [];

    lines.push(`Templates generated: ${templates.length}`);

    if (templates.length > 0) {
      const byType: Record<string, number> = {};
      for (const t of templates) {
        byType[t.entityType] = (byType[t.entityType] || 0) + 1;
      }

      lines.push("");
      lines.push("By type:");
      for (const [type, count] of Object.entries(byType)) {
        lines.push(`  - ${type}: ${count}`);
      }
    }

    return lines.join("\n");
  }
}
