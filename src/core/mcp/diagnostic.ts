/**
 * Diagnostic Engine - solve real problems
 * Linus: Keep it simple
 */

export interface ProjectContext {
  framework: string;
  dependencies: string[];
  patterns: string[];
  conventions: Record<string, unknown>;
  recentFiles?: string[];
  codeSnippets?: string[];
  errorPatterns?: string[];
  componentStructure?: string;
  dataFlow?: string;
}

export interface DiagnosticResult {
  issue: string;
  technology: string;
  component?: string;
  timestamp: string;
  analysis: {
    severity: "low" | "medium" | "high";
    category: string;
    likelyCauses: string[];
    confidence: number;
  };
  steps: DiagnosticStep[];
  solutions: Solution[];
  projectContext?: ProjectContext;
  diagnosticPrompt?: string;
}

export interface DiagnosticStep {
  step: number;
  action: string;
  description: string;
}

export interface Solution {
  title: string;
  code?: string;
  explanation: string;
}

/**
 * Diagnostic engine - straight to the point
 */
export class DiagnosticEngine {
  /**
   * Generate diagnostic prompt for LLM with rich project context
   */
  diagnose(
    issue: string,
    component?: string,
    technology: string = "unknown",
    projectContext?: ProjectContext
  ): DiagnosticResult {
    // Generate a comprehensive diagnostic prompt for LLM
    const diagnosticPrompt = this.generateDiagnosticPrompt(
      issue,
      component,
      technology,
      projectContext
    );

    return {
      issue,
      technology,
      component,
      timestamp: new Date().toISOString(),
      analysis: {
        severity: "medium",
        category: "analysis-needed",
        likelyCauses: ["Analysis in progress - see diagnostic prompt"],
        confidence: 0.8,
      },
      steps: [],
      solutions: [],
      projectContext,
      diagnosticPrompt,
    };
  }

  /**
   * Generate comprehensive diagnostic prompt for LLM
   */
  private generateDiagnosticPrompt(
    issue: string,
    component: string | undefined,
    technology: string,
    context?: ProjectContext
  ): string {
    let prompt = `## Diagnostic Analysis Request

**Issue:** ${issue}
**Technology Stack:** ${technology}
${component ? `**Component:** ${component}` : ""}

`;

    if (context) {
      prompt += this.generateContextSection(context);
    }

    prompt += `
## Required Analysis

Please provide a comprehensive diagnostic analysis including:

1. **Root Cause Analysis** - Identify the most likely causes based on the provided context
2. **Diagnostic Steps** - Specific, actionable steps to investigate the issue
3. **Solutions** - Concrete solutions with code examples when applicable
4. **Prevention** - Best practices to avoid similar issues

## Context-Aware Recommendations

Consider the following when providing recommendations:
- Technology stack and framework capabilities
- Project architecture and patterns
- Existing dependencies and their usage
- Code structure and conventions
- Recent changes that might be related

Format your response as a structured diagnostic report.`;

    return prompt;
  }

  /**
   * Generate detailed context section for the prompt
   */
  private generateContextSection(context: ProjectContext): string {
    let section = `## Project Context

**Framework:** ${context.framework}
**Dependencies:** ${context.dependencies.join(", ")}

`;

    if (context.patterns && context.patterns.length > 0) {
      section += `**Code Patterns:** ${context.patterns.join(", ")}

`;
    }

    if (context.recentFiles && context.recentFiles.length > 0) {
      section += `**Recent Files:** ${context.recentFiles.slice(0, 5).join(", ")}

`;
    }

    if (context.codeSnippets && context.codeSnippets.length > 0) {
      section += `**Relevant Code Snippets:**
${context.codeSnippets.map((snippet, i) => `${i + 1}. ${snippet}`).join("\n")}

`;
    }

    if (context.componentStructure) {
      section += `**Component Structure:**
${context.componentStructure}

`;
    }

    if (context.dataFlow) {
      section += `**Data Flow:**
${context.dataFlow}

`;
    }

    if (context.errorPatterns && context.errorPatterns.length > 0) {
      section += `**Common Error Patterns:**
${context.errorPatterns.map((pattern) => `- ${pattern}`).join("\n")}

`;
    }

    return section;
  }
}
