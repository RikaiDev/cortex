/**
 * Query Parser - natural language query parsing
 * Linus: Keep it simple, one job per file
 */

export interface ParsedQuery {
  intent: "diagnostic" | "context" | "experience" | "task_enhancement";
  description: string;
  component?: string;
  technology?: string;
  contextType?: string;
}

/**
 * Query parser - pattern matching
 */
export class QueryParser {
  private contextTools: {
    extractComponentFromQuery?: (query: string) => string | null;
  };

  constructor(contextTools: {
    extractComponentFromQuery?: (query: string) => string | null;
  }) {
    this.contextTools = contextTools;
  }

  /**
   * Parse query
   */
  parse(query: string): ParsedQuery {
    const intent = this.classifyIntent(query);

    switch (intent) {
      case "diagnostic":
        return {
          intent,
          description: query,
          component:
            this.contextTools.extractComponentFromQuery?.(query) || undefined,
          technology: this.inferTechnology(query),
        };

      case "context":
        return {
          intent,
          description: query,
          contextType: this.extractContextType(query),
        };

      case "experience":
        return {
          intent,
          description: query,
          technology: this.inferTechnology(query),
        };

      default:
        return {
          intent: "diagnostic",
          description: query,
          component:
            this.contextTools.extractComponentFromQuery?.(query) || undefined,
        };
    }
  }

  /**
   * Simple intent classification
   */
  private classifyIntent(query: string): ParsedQuery["intent"] {
    const lowerQuery = query.toLowerCase();

    if (this.isDiagnosticQuery(lowerQuery)) return "diagnostic";
    if (this.isContextQuery(lowerQuery)) return "context";
    if (this.isExperienceQuery(lowerQuery)) return "experience";

    return "diagnostic"; // default fallback
  }

  private isDiagnosticQuery(query: string): boolean {
    const keywords = [
      "unable",
      "cannot",
      "problem",
      "error",
      "issue",
      "bug",
      "fix",
      "check",
      "why",
      "how to",
      "solve",
      "fix",
      "debug",
      "troubleshoot",
      "無法",
      "不能",
      "問題",
      "錯誤",
      "為什麼",
      "怎麼",
      "如何",
      "解決",
      "修復",
      "檢查",
      "沒有",
      "不顯示",
      "不工作",
    ];
    return keywords.some((keyword) => query.includes(keyword));
  }

  private isContextQuery(query: string): boolean {
    const keywords = [
      "structure",
      "overview",
      "architecture",
      "how",
      "what",
      "介紹",
      "結構",
      "架構",
      "怎麼",
    ];
    return keywords.some((keyword) => query.includes(keyword));
  }

  private isExperienceQuery(query: string): boolean {
    const keywords = [
      "experience",
      "similar",
      "before",
      "previous",
      "solution",
      "經驗",
      "類似",
      "之前",
      "解決方案",
    ];
    return keywords.some((keyword) => query.includes(keyword));
  }

  /**
   * Simple technology inference
   */
  private inferTechnology(query: string): string {
    const techPatterns = {
      react: /\b(react|jsx|tsx|component|hook|state|props)\b/i,
      vue: /\b(vue|v-model|template|directive)\b/i,
      angular: /\b(angular|ng-|service|directive)\b/i,
      nodejs: /\b(node|express|npm|async|promise)\b/i,
      python: /\b(django|flask|fastapi|python|def\s+class)\b/i,
    };

    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(query)) {
        return tech;
      }
    }

    return "react"; // default
  }

  /**
   * Extract context type
   */
  private extractContextType(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("structure") || lowerQuery.includes("結構"))
      return "structure";
    if (lowerQuery.includes("patterns") || lowerQuery.includes("模式"))
      return "patterns";
    if (lowerQuery.includes("changes") || lowerQuery.includes("變更"))
      return "recent-changes";
    if (lowerQuery.includes("files") || lowerQuery.includes("文件"))
      return "key-files";

    return "structure";
  }
}
