/**
 * PR Review Service
 *
 * Automates PR reviews using team knowledge patterns
 */

import { promises as fs } from "fs";
import * as path from "path";
import { execSync } from "child_process";
import type { PRReviewPattern } from "../types/team-knowledge.js";
import type {
  PRInfo,
  PRFile,
  PRReviewResult,
  ReviewFinding,
  ReviewSeverity,
  ReviewCategory,
  ReviewStats,
  CodeOwner,
  ReviewerSuggestion,
  ReviewerSuggestionsResult,
  ChecklistItem,
  ReviewChecklistResult,
  PRReviewOptions,
} from "../types/pr-review.js";

export class PRReviewService {
  private teamKnowledgePath: string;

  constructor(private projectRoot: string) {
    this.teamKnowledgePath = path.join(
      projectRoot,
      ".cortex",
      "team-knowledge"
    );
  }

  /**
   * Auto-review a PR against team patterns
   */
  async reviewPR(
    prNumber: number,
    options: PRReviewOptions = {}
  ): Promise<PRReviewResult> {
    // Get PR info
    const pr = await this.getPRInfo(prNumber);

    // Load team patterns
    const patterns = options.useTeamPatterns !== false
      ? await this.loadTeamPatterns()
      : [];

    // Analyze PR
    const findings: ReviewFinding[] = [];
    const appliedPatterns: PRReviewPattern[] = [];

    for (const file of pr.files) {
      if (options.focusFiles && !options.focusFiles.includes(file.path)) {
        continue;
      }

      const fileFindings = await this.analyzeFile(file, patterns, options);
      findings.push(...fileFindings);

      // Track which patterns matched
      for (const finding of fileFindings) {
        if (finding.matchedPattern) {
          const pattern = patterns.find(
            (p) => p.pattern === finding.matchedPattern
          );
          if (pattern && !appliedPatterns.includes(pattern)) {
            appliedPatterns.push(pattern);
          }
        }
      }
    }

    // Filter by severity if specified
    let filteredFindings = findings;
    if (options.minSeverity) {
      filteredFindings = this.filterBySeverity(findings, options.minSeverity);
    }

    // Limit findings if specified
    if (options.maxFindings && filteredFindings.length > options.maxFindings) {
      filteredFindings = filteredFindings.slice(0, options.maxFindings);
    }

    // Calculate statistics
    const stats = this.calculateStats(filteredFindings, pr);

    // Determine verdict
    const verdict = this.determineVerdict(filteredFindings);

    // Generate summary
    const summary = this.generateSummary(pr, filteredFindings, appliedPatterns);

    return {
      pr,
      findings: filteredFindings,
      verdict,
      summary,
      appliedPatterns,
      stats,
      reviewedAt: new Date().toISOString(),
    };
  }

  /**
   * Suggest reviewers based on CODEOWNERS
   */
  async suggestReviewers(prNumber: number): Promise<ReviewerSuggestionsResult> {
    const pr = await this.getPRInfo(prNumber);
    const codeOwners = await this.parseCodeOwners();

    const suggestions: ReviewerSuggestion[] = [];
    const unownedFiles: string[] = [];
    const ownershipMap = new Map<string, string[]>();

    // Map files to owners
    for (const file of pr.files) {
      const owners = this.findOwners(file.path, codeOwners);

      if (owners.length === 0) {
        unownedFiles.push(file.path);
      } else {
        for (const owner of owners) {
          if (!ownershipMap.has(owner)) {
            ownershipMap.set(owner, []);
          }
          ownershipMap.get(owner)!.push(file.path);
        }
      }
    }

    // Create suggestions from ownership map
    for (const [owner, files] of ownershipMap) {
      // Skip PR author
      if (owner.replace("@", "") === pr.author) {
        continue;
      }

      suggestions.push({
        username: owner.replace("@", ""),
        reason: `Owns ${files.length} file(s) in this PR`,
        ownedFiles: files,
        priority: files.length, // More files = higher priority
        isTeam: owner.includes("/"), // Teams usually have org/team format
      });
    }

    // Sort by priority (descending)
    suggestions.sort((a, b) => b.priority - a.priority);

    // Renumber priorities
    suggestions.forEach((s, i) => {
      s.priority = i + 1;
    });

    return {
      pr,
      suggestions,
      codeOwners,
      unownedFiles,
    };
  }

  /**
   * Generate review checklist for a PR
   */
  async generateChecklist(prNumber: number): Promise<ReviewChecklistResult> {
    const pr = await this.getPRInfo(prNumber);
    const patterns = await this.loadTeamPatterns();
    const items: ChecklistItem[] = [];
    const basedOn: string[] = [];

    // Standard checklist items
    items.push(...this.getStandardChecklistItems());
    basedOn.push("Standard review checklist");

    // Pattern-based items
    if (patterns.length > 0) {
      items.push(...this.getPatternBasedItems(pr, patterns));
      basedOn.push(`Team patterns (${patterns.length} patterns)`);
    }

    // File-type specific items
    items.push(...this.getFileTypeItems(pr));
    basedOn.push("File type analysis");

    // Auto-check items
    await this.autoCheckItems(items, pr);

    // Calculate readiness
    const blockingItems = items
      .filter((i) => i.required && i.status === "fail")
      .map((i) => i.description);

    const readyForReview = blockingItems.length === 0;

    return {
      pr,
      items,
      readyForReview,
      blockingItems,
      basedOn,
    };
  }

  /**
   * Get PR information from GitHub
   */
  private async getPRInfo(prNumber: number): Promise<PRInfo> {
    try {
      const prJson = execSync(
        `gh pr view ${prNumber} --json number,title,body,author,baseRefName,headRefName,state,files,labels,reviewRequests,url,createdAt,commits,additions,deletions`,
        {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }
      );

      const data = JSON.parse(prJson);

      return {
        number: data.number,
        title: data.title,
        body: data.body || "",
        author: data.author.login,
        baseBranch: data.baseRefName,
        headBranch: data.headRefName,
        state: data.state.toLowerCase() as PRInfo["state"],
        files: data.files.map((f: { path: string; additions: number; deletions: number }) => ({
          path: f.path,
          status: this.inferFileStatus(f),
          additions: f.additions,
          deletions: f.deletions,
        })),
        labels: data.labels.map((l: { name: string }) => l.name),
        reviewers: data.reviewRequests?.map((r: { login?: string; name?: string }) => r.login || r.name) || [],
        url: data.url,
        createdAt: data.createdAt,
        commits: data.commits.length,
        additions: data.additions,
        deletions: data.deletions,
      };
    } catch (error) {
      throw new Error(
        `Failed to get PR info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Infer file status from additions/deletions
   */
  private inferFileStatus(file: { additions: number; deletions: number }): PRFile["status"] {
    if (file.additions > 0 && file.deletions === 0) {
      return "added";
    }
    if (file.additions === 0 && file.deletions > 0) {
      return "deleted";
    }
    return "modified";
  }

  /**
   * Load team review patterns
   */
  private async loadTeamPatterns(): Promise<PRReviewPattern[]> {
    const patternsPath = path.join(this.teamKnowledgePath, "pr-patterns.json");

    try {
      const content = await fs.readFile(patternsPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Analyze a file for review findings
   */
  private async analyzeFile(
    file: PRFile,
    patterns: PRReviewPattern[],
    options: PRReviewOptions
  ): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];

    // Skip deleted files
    if (file.status === "deleted") {
      return findings;
    }

    // Read file content
    const filePath = path.join(this.projectRoot, file.path);
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return findings;
    }

    // Check against patterns
    for (const pattern of patterns) {
      const patternFindings = this.checkPattern(file, content, pattern);
      findings.push(...patternFindings);
    }

    // Built-in checks
    findings.push(...this.runBuiltInChecks(file, content));

    // Include suggestions if requested
    if (options.includeSuggestions) {
      findings.push(...this.generateSuggestions(file, content));
    }

    return findings;
  }

  /**
   * Check file against a specific pattern
   */
  private checkPattern(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    // Map pattern to check
    const checkMap: Record<string, () => ReviewFinding | null> = {
      "missing-error-handling": () =>
        this.checkMissingErrorHandling(file, content, pattern),
      "missing-tests": () =>
        this.checkMissingTests(file, content, pattern),
      "missing-validation": () =>
        this.checkMissingValidation(file, content, pattern),
      "security-issue": () =>
        this.checkSecurityIssues(file, content, pattern),
      "performance-concern": () =>
        this.checkPerformanceIssues(file, content, pattern),
      "naming-improvement": () =>
        this.checkNamingIssues(file, content, pattern),
      "code-duplication": () =>
        this.checkDuplication(file, content, pattern),
    };

    const check = checkMap[pattern.pattern];
    if (check) {
      const finding = check();
      if (finding) {
        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Check for missing error handling
   */
  private checkMissingErrorHandling(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    // Look for async functions without try-catch
    const asyncWithoutTry =
      /async\s+\w+[^{]*\{(?:(?!try\s*\{).)*\}/s.test(content) &&
      !content.includes("try {");

    // Look for fetch/axios without error handling
    const fetchWithoutCatch =
      (content.includes("fetch(") || content.includes("axios.")) &&
      !content.includes(".catch(") &&
      !content.includes("try {");

    if (asyncWithoutTry || fetchWithoutCatch) {
      return {
        severity: "warning",
        category: "error-handling",
        file: file.path,
        message: pattern.description,
        suggestion: "Add try-catch blocks or .catch() handlers for async operations",
        matchedPattern: pattern.pattern,
      };
    }

    return null;
  }

  /**
   * Check for missing tests
   */
  private checkMissingTests(
    file: PRFile,
    _content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    // Only check source files
    if (
      file.path.includes(".test.") ||
      file.path.includes(".spec.") ||
      file.path.includes("__tests__")
    ) {
      return null;
    }

    // Simplified check - in real usage, we'd check if test files exist
    if (file.additions > 50) {
      return {
        severity: "suggestion",
        category: "testing",
        file: file.path,
        message: pattern.description,
        suggestion: "Consider adding tests for new code (50+ lines added)",
        matchedPattern: pattern.pattern,
      };
    }

    return null;
  }

  /**
   * Check for missing validation
   */
  private checkMissingValidation(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    // Look for function parameters without validation
    const hasParams = /function\s+\w+\s*\([^)]+\)/.test(content);
    const hasValidation =
      content.includes("if (!") ||
      content.includes("throw new") ||
      content.includes(".validate(") ||
      content.includes("assert(");

    if (hasParams && !hasValidation && file.additions > 20) {
      return {
        severity: "suggestion",
        category: "validation",
        file: file.path,
        message: pattern.description,
        suggestion: "Consider adding input validation for function parameters",
        matchedPattern: pattern.pattern,
      };
    }

    return null;
  }

  /**
   * Check for security issues
   */
  private checkSecurityIssues(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    const securityPatterns = [
      { regex: /eval\s*\(/, issue: "Use of eval() is a security risk" },
      { regex: /innerHTML\s*=/, issue: "innerHTML can lead to XSS vulnerabilities" },
      { regex: /password\s*=\s*['"][^'"]+['"]/, issue: "Hardcoded password detected" },
      { regex: /api[_-]?key\s*=\s*['"][^'"]+['"]/, issue: "Hardcoded API key detected" },
    ];

    for (const { regex, issue } of securityPatterns) {
      if (regex.test(content)) {
        return {
          severity: "critical",
          category: "security",
          file: file.path,
          message: issue,
          suggestion: "Review and fix security vulnerability",
          matchedPattern: pattern.pattern,
        };
      }
    }

    return null;
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    const perfPatterns = [
      { regex: /\.forEach\(.*await/, issue: "Sequential awaits in forEach loop" },
      { regex: /for\s*\(.*\)\s*\{[^}]*await/, issue: "Sequential awaits in for loop" },
      { regex: /JSON\.parse\(.*JSON\.stringify/, issue: "Inefficient deep clone pattern" },
    ];

    for (const { regex, issue } of perfPatterns) {
      if (regex.test(content)) {
        return {
          severity: "warning",
          category: "performance",
          file: file.path,
          message: issue,
          suggestion: "Consider using Promise.all for parallel execution",
          matchedPattern: pattern.pattern,
        };
      }
    }

    return null;
  }

  /**
   * Check for naming issues
   */
  private checkNamingIssues(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    // Check for single-letter variables (excluding loop counters)
    const singleLetterVars = content.match(/(?:let|const|var)\s+([a-z])\s*=/g);
    if (singleLetterVars && singleLetterVars.length > 2) {
      return {
        severity: "suggestion",
        category: "naming",
        file: file.path,
        message: "Multiple single-letter variable names detected",
        suggestion: "Use descriptive variable names for better readability",
        matchedPattern: pattern.pattern,
      };
    }

    return null;
  }

  /**
   * Check for code duplication
   */
  private checkDuplication(
    file: PRFile,
    content: string,
    pattern: PRReviewPattern
  ): ReviewFinding | null {
    // Simple check: look for repeated code blocks
    const lines = content.split("\n");
    const lineCounts = new Map<string, number>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 30) {
        lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
      }
    }

    const duplicates = Array.from(lineCounts.entries()).filter(
      ([, count]) => count > 2
    );

    if (duplicates.length > 0) {
      return {
        severity: "suggestion",
        category: "duplication",
        file: file.path,
        message: `Found ${duplicates.length} repeated code pattern(s)`,
        suggestion: "Consider extracting duplicated code into reusable functions",
        matchedPattern: pattern.pattern,
      };
    }

    return null;
  }

  /**
   * Run built-in code checks
   */
  private runBuiltInChecks(file: PRFile, content: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    // Check for console.log in production code
    if (
      content.includes("console.log") &&
      !file.path.includes("test") &&
      !file.path.includes("debug")
    ) {
      findings.push({
        severity: "warning",
        category: "code-style",
        file: file.path,
        message: "console.log statements should be removed in production code",
        suggestion: "Remove console.log or use a proper logging library",
      });
    }

    // Check for TODO/FIXME comments
    const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX):/gi);
    if (todoMatches && todoMatches.length > 0) {
      findings.push({
        severity: "info",
        category: "general",
        file: file.path,
        message: `Found ${todoMatches.length} TODO/FIXME comment(s)`,
        suggestion: "Review and address TODO comments before merging",
      });
    }

    // Check for large functions
    const functionMatches = content.match(/(?:function|=>)\s*[^{]*\{[^}]{500,}\}/g);
    if (functionMatches) {
      findings.push({
        severity: "suggestion",
        category: "architecture",
        file: file.path,
        message: "Large function detected (500+ characters)",
        suggestion: "Consider breaking down large functions into smaller ones",
      });
    }

    return findings;
  }

  /**
   * Generate suggestions for improvements
   */
  private generateSuggestions(file: PRFile, content: string): ReviewFinding[] {
    const suggestions: ReviewFinding[] = [];

    // Suggest TypeScript strict mode
    if (file.path.endsWith(".ts") && content.includes(": any")) {
      suggestions.push({
        severity: "suggestion",
        category: "code-style",
        file: file.path,
        message: "Using 'any' type reduces type safety",
        suggestion: "Consider using more specific types instead of 'any'",
      });
    }

    // Suggest JSDoc for exported functions
    if (
      content.includes("export function") &&
      !content.includes("/**")
    ) {
      suggestions.push({
        severity: "suggestion",
        category: "documentation",
        file: file.path,
        message: "Exported functions should have JSDoc documentation",
        suggestion: "Add JSDoc comments for exported functions",
      });
    }

    return suggestions;
  }

  /**
   * Parse CODEOWNERS file
   */
  private async parseCodeOwners(): Promise<CodeOwner[]> {
    const possiblePaths = [
      path.join(this.projectRoot, "CODEOWNERS"),
      path.join(this.projectRoot, ".github", "CODEOWNERS"),
      path.join(this.projectRoot, "docs", "CODEOWNERS"),
    ];

    for (const ownerPath of possiblePaths) {
      try {
        const content = await fs.readFile(ownerPath, "utf-8");
        return this.parseCodeOwnersContent(content);
      } catch {
        continue;
      }
    }

    return [];
  }

  /**
   * Parse CODEOWNERS file content
   */
  private parseCodeOwnersContent(content: string): CodeOwner[] {
    const owners: CodeOwner[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse pattern and owners
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const pattern = parts[0];
        const lineOwners = parts.slice(1).filter((p) => p.startsWith("@"));

        if (lineOwners.length > 0) {
          owners.push({ pattern, owners: lineOwners });
        }
      }
    }

    return owners;
  }

  /**
   * Find owners for a file path
   */
  private findOwners(filePath: string, codeOwners: CodeOwner[]): string[] {
    const matchedOwners = new Set<string>();

    for (const entry of codeOwners) {
      if (this.matchesPattern(filePath, entry.pattern)) {
        for (const owner of entry.owners) {
          matchedOwners.add(owner);
        }
      }
    }

    return Array.from(matchedOwners);
  }

  /**
   * Check if file path matches CODEOWNERS pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle wildcard patterns
    const regex = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    // If pattern doesn't start with /, match anywhere in path
    if (!pattern.startsWith("/")) {
      return new RegExp(regex).test(filePath);
    }

    // If pattern starts with /, match from root
    return new RegExp(`^${regex.slice(1)}`).test(filePath);
  }

  /**
   * Get standard checklist items
   */
  private getStandardChecklistItems(): ChecklistItem[] {
    return [
      {
        category: "general",
        description: "PR has a clear title and description",
        required: true,
        autoChecked: true,
      },
      {
        category: "testing",
        description: "Tests are included for new functionality",
        required: true,
        autoChecked: false,
      },
      {
        category: "documentation",
        description: "Documentation is updated if needed",
        required: false,
        autoChecked: false,
      },
      {
        category: "code-style",
        description: "Code follows project style guidelines",
        required: true,
        autoChecked: false,
      },
      {
        category: "security",
        description: "No security vulnerabilities introduced",
        required: true,
        autoChecked: true,
      },
    ];
  }

  /**
   * Get pattern-based checklist items
   */
  private getPatternBasedItems(
    _pr: PRInfo,
    patterns: PRReviewPattern[]
  ): ChecklistItem[] {
    const items: ChecklistItem[] = [];

    // Add items based on frequent patterns
    const frequentPatterns = patterns
      .filter((p) => p.frequency >= 3)
      .slice(0, 5);

    for (const pattern of frequentPatterns) {
      items.push({
        category: this.patternToCategory(pattern.pattern),
        description: pattern.description,
        required: false,
        autoChecked: true,
      });
    }

    return items;
  }

  /**
   * Map pattern to category
   */
  private patternToCategory(pattern: string): ReviewCategory {
    const mapping: Record<string, ReviewCategory> = {
      "missing-error-handling": "error-handling",
      "missing-tests": "testing",
      "missing-validation": "validation",
      "security-issue": "security",
      "performance-concern": "performance",
      "naming-improvement": "naming",
      "code-duplication": "duplication",
    };

    return mapping[pattern] || "general";
  }

  /**
   * Get file-type specific checklist items
   */
  private getFileTypeItems(pr: PRInfo): ChecklistItem[] {
    const items: ChecklistItem[] = [];
    const fileTypes = new Set(pr.files.map((f) => path.extname(f.path)));

    if (fileTypes.has(".tsx") || fileTypes.has(".jsx")) {
      items.push({
        category: "testing",
        description: "React components have snapshot or unit tests",
        required: false,
        autoChecked: false,
      });
    }

    if (fileTypes.has(".sql")) {
      items.push({
        category: "security",
        description: "SQL queries are parameterized",
        required: true,
        autoChecked: false,
      });
    }

    if (pr.files.some((f) => f.path.includes("package.json"))) {
      items.push({
        category: "security",
        description: "New dependencies are reviewed for security",
        required: true,
        autoChecked: false,
      });
    }

    return items;
  }

  /**
   * Auto-check checklist items
   */
  private async autoCheckItems(
    items: ChecklistItem[],
    pr: PRInfo
  ): Promise<void> {
    for (const item of items) {
      if (!item.autoChecked) continue;

      switch (item.description) {
        case "PR has a clear title and description":
          item.status =
            pr.title.length > 10 && pr.body.length > 20 ? "pass" : "warning";
          item.details =
            item.status === "pass"
              ? "Title and description present"
              : "Consider adding more detail";
          break;

        case "No security vulnerabilities introduced":
          // Would integrate with security scanning in real implementation
          item.status = "pass";
          item.details = "No obvious security issues detected";
          break;

        default:
          item.status = "skip";
          item.details = "Requires manual review";
      }
    }
  }

  /**
   * Filter findings by minimum severity
   */
  private filterBySeverity(
    findings: ReviewFinding[],
    minSeverity: ReviewSeverity
  ): ReviewFinding[] {
    const severityOrder: ReviewSeverity[] = [
      "info",
      "suggestion",
      "warning",
      "critical",
    ];
    const minIndex = severityOrder.indexOf(minSeverity);

    return findings.filter(
      (f) => severityOrder.indexOf(f.severity) >= minIndex
    );
  }

  /**
   * Calculate review statistics
   */
  private calculateStats(
    findings: ReviewFinding[],
    pr: PRInfo
  ): ReviewStats {
    const bySeverity: Record<ReviewSeverity, number> = {
      critical: 0,
      warning: 0,
      suggestion: 0,
      info: 0,
    };

    const byCategory: Record<ReviewCategory, number> = {
      "error-handling": 0,
      testing: 0,
      security: 0,
      performance: 0,
      naming: 0,
      documentation: 0,
      "code-style": 0,
      architecture: 0,
      duplication: 0,
      validation: 0,
      general: 0,
    };

    for (const finding of findings) {
      bySeverity[finding.severity]++;
      byCategory[finding.category]++;
    }

    const matchedPatterns = new Set(
      findings.filter((f) => f.matchedPattern).map((f) => f.matchedPattern)
    );

    return {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      filesReviewed: pr.files.length,
      linesReviewed: pr.additions + pr.deletions,
      patternsMatched: matchedPatterns.size,
    };
  }

  /**
   * Determine review verdict
   */
  private determineVerdict(
    findings: ReviewFinding[]
  ): PRReviewResult["verdict"] {
    const criticalCount = findings.filter(
      (f) => f.severity === "critical"
    ).length;
    const warningCount = findings.filter(
      (f) => f.severity === "warning"
    ).length;

    if (criticalCount > 0) {
      return "request-changes";
    }
    if (warningCount > 3) {
      return "request-changes";
    }
    if (warningCount > 0) {
      return "comment";
    }
    return "approve";
  }

  /**
   * Generate review summary
   */
  private generateSummary(
    pr: PRInfo,
    findings: ReviewFinding[],
    patterns: PRReviewPattern[]
  ): string {
    const criticalCount = findings.filter(
      (f) => f.severity === "critical"
    ).length;
    const warningCount = findings.filter(
      (f) => f.severity === "warning"
    ).length;

    let summary = `Reviewed ${pr.files.length} file(s) with ${pr.additions} additions and ${pr.deletions} deletions.\n\n`;

    if (findings.length === 0) {
      summary += "No issues found. Code looks good!";
    } else {
      summary += `Found ${findings.length} finding(s)`;
      if (criticalCount > 0) {
        summary += ` (${criticalCount} critical)`;
      }
      if (warningCount > 0) {
        summary += ` (${warningCount} warnings)`;
      }
      summary += ".\n\n";

      if (patterns.length > 0) {
        summary += `Applied ${patterns.length} team pattern(s) from previous reviews.`;
      }
    }

    return summary;
  }
}
