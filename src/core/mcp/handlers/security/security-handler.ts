/**
 * Security Handler
 *
 * Handles security scanning and vulnerability detection operations
 */

import { MCPTool } from "../../decorators/index.js";
import { SecurityService } from "../../services/security-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { SecuritySeverity, SecurityCategory } from "../../types/security.js";

/**
 * MCP handler for security scanning and vulnerability detection tools.
 *
 * Provides tools to scan code for security issues, check dependencies
 * for vulnerabilities, and detect hardcoded secrets or credentials.
 */
export class SecurityHandler {
  private securityService: SecurityService;

  /**
   * @param projectRoot - Root directory of the project to analyze
   */
  constructor(private projectRoot: string) {
    this.securityService = new SecurityService(projectRoot);
  }

  /**
   * Scan files for security issues
   */
  @MCPTool({
    name: "security-scan",
    description:
      "Scan files for security vulnerabilities (OWASP Top 10, injection, XSS, crypto issues)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files or patterns to scan (empty for all)",
        },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Security categories to check (injection, xss, crypto, auth, etc.)",
        },
        minSeverity: {
          type: "string",
          enum: ["info", "low", "medium", "high", "critical"],
          description: "Minimum severity to report (default: medium)",
        },
        maxIssues: {
          type: "number",
          description: "Maximum issues to report (default: 50)",
        },
      },
    },
  })
  async handleSecurityScan(args: {
    files?: string[];
    categories?: SecurityCategory[];
    minSeverity?: SecuritySeverity;
    maxIssues?: number;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.securityService.scanFiles({
        files: args.files,
        categories: args.categories,
        minSeverity: args.minSeverity || "medium",
        maxIssues: args.maxIssues || 50,
        includeOwasp: true,
      });

      const sections: string[] = [];

      // Header
      const statusEmoji = result.totalIssues === 0 ? "✅" : "🔒";
      sections.push(`## Security Scan Results ${statusEmoji}`);
      sections.push(`\n${result.summary}`);

      // Statistics
      sections.push(`\n### Overview`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Scanned | ${result.filesScanned} |`);
      sections.push(`| Total Issues | ${result.totalIssues} |`);
      sections.push(`| Scan Time | ${new Date(result.scannedAt).toLocaleString()} |`);

      // Issues by severity
      if (result.totalIssues > 0) {
        sections.push(`\n### Issues by Severity`);
        sections.push(`| Severity | Count |`);
        sections.push(`|----------|-------|`);
        sections.push(`| 🔴 Critical | ${result.bySeverity.critical} |`);
        sections.push(`| 🟠 High | ${result.bySeverity.high} |`);
        sections.push(`| 🟡 Medium | ${result.bySeverity.medium} |`);
        sections.push(`| 🔵 Low | ${result.bySeverity.low} |`);
        sections.push(`| ⚪ Info | ${result.bySeverity.info} |`);

        // Issues by category
        const activeCategories = Object.entries(result.byCategory)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);

        if (activeCategories.length > 0) {
          sections.push(`\n### Issues by Category`);
          sections.push(`| Category | Count |`);
          sections.push(`|----------|-------|`);
          for (const [cat, count] of activeCategories) {
            sections.push(`| ${this.formatCategory(cat)} | ${count} |`);
          }
        }
      }

      // OWASP Coverage
      if (result.owaspCoverage.length > 0) {
        sections.push(`\n### OWASP Top 10 Coverage`);
        sections.push(`Detected issues matching these OWASP categories:`);
        for (const owasp of result.owaspCoverage) {
          sections.push(`- ${owasp}`);
        }
      }

      // Detailed issues
      if (result.issues.length > 0) {
        sections.push(`\n### Security Issues`);

        // Group by file
        const byFile = new Map<string, typeof result.issues>();
        for (const issue of result.issues) {
          if (!byFile.has(issue.file)) {
            byFile.set(issue.file, []);
          }
          byFile.get(issue.file)!.push(issue);
        }

        for (const [file, issues] of byFile) {
          sections.push(`\n**${file}**`);
          for (const issue of issues) {
            const emoji = this.getSeverityEmoji(issue.severity);
            const line = issue.line ? `:${issue.line}` : "";
            sections.push(`\n${emoji} **${issue.title}**${line}`);
            sections.push(`- ${issue.description}`);
            if (issue.codeSnippet) {
              sections.push(`- Code: \`${issue.codeSnippet}\``);
            }
            sections.push(`- **Remediation:** ${issue.remediation}`);
            if (issue.owasp) {
              sections.push(`- OWASP: ${issue.owasp}`);
            }
            if (issue.cweId) {
              sections.push(`- CWE: ${issue.cweId}`);
            }
          }
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      if (result.bySeverity.critical > 0 || result.bySeverity.high > 0) {
        sections.push(`1. 🚨 **URGENT:** Fix critical and high severity issues immediately`);
      }
      if (result.totalIssues > 0) {
        sections.push(`2. Review each finding and apply the suggested remediation`);
        sections.push(`3. Add security linting rules to prevent future issues`);
        sections.push(`4. Consider a security code review for sensitive areas`);
      } else {
        sections.push(`- No immediate security issues detected`);
        sections.push(`- Continue following security best practices`);
        sections.push(`- Run regular security scans as part of CI/CD`);
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.bySeverity.critical > 0 || result.bySeverity.high > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to scan for security issues: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check dependencies for vulnerabilities
   */
  @MCPTool({
    name: "security-check-deps",
    description:
      "Check dependencies for known vulnerabilities using npm audit",
    inputSchema: {
      type: "object",
      properties: {
        includeDev: {
          type: "boolean",
          description: "Include dev dependencies (default: true)",
        },
        minSeverity: {
          type: "string",
          enum: ["info", "low", "medium", "high", "critical"],
          description: "Minimum severity to report (default: low)",
        },
        includeOutdated: {
          type: "boolean",
          description: "Include outdated (non-vulnerable) packages (default: false)",
        },
      },
    },
  })
  async handleCheckDependencies(args: {
    includeDev?: boolean;
    minSeverity?: SecuritySeverity;
    includeOutdated?: boolean;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.securityService.checkDependencies({
        includeDev: args.includeDev !== false,
        minSeverity: args.minSeverity || "low",
        includeOutdated: args.includeOutdated,
      });

      const sections: string[] = [];

      // Header
      const riskEmoji = this.getRiskEmoji(result.riskLevel);
      sections.push(`## Dependency Security Check ${riskEmoji}`);
      sections.push(`\n**Risk Level:** ${result.riskLevel.toUpperCase()}`);

      // Statistics
      sections.push(`\n### Overview`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Total Dependencies | ${result.totalDependencies} |`);
      sections.push(`| Vulnerable | ${result.vulnerableCount} |`);
      if (args.includeOutdated) {
        sections.push(`| Outdated | ${result.outdatedCount} |`);
      }
      sections.push(`| Checked At | ${new Date(result.checkedAt).toLocaleString()} |`);

      // Vulnerabilities by severity
      if (result.vulnerableCount > 0) {
        sections.push(`\n### Vulnerabilities by Severity`);
        sections.push(`| Severity | Count |`);
        sections.push(`|----------|-------|`);
        sections.push(`| 🔴 Critical | ${result.bySeverity.critical} |`);
        sections.push(`| 🟠 High | ${result.bySeverity.high} |`);
        sections.push(`| 🟡 Medium | ${result.bySeverity.medium} |`);
        sections.push(`| 🔵 Low | ${result.bySeverity.low} |`);

        // Detailed vulnerabilities
        sections.push(`\n### Vulnerable Packages`);

        // Sort by severity
        const sorted = [...result.vulnerabilities].sort(
          (a, b) => this.severityToNumber(b.severity) - this.severityToNumber(a.severity)
        );

        for (const vuln of sorted.slice(0, 20)) {
          const emoji = this.getSeverityEmoji(vuln.severity);
          const direct = vuln.isDirect ? " (direct)" : " (transitive)";
          sections.push(`\n${emoji} **${vuln.name}@${vuln.version}**${direct}`);
          sections.push(`- ${vuln.title}`);
          if (vuln.cves.length > 0) {
            sections.push(`- CVEs: ${vuln.cves.join(", ")}`);
          }
          if (vuln.fixedIn) {
            sections.push(`- **Fix:** Update to ${vuln.fixedIn}`);
          }
          if (vuln.advisoryUrl) {
            sections.push(`- [Advisory](${vuln.advisoryUrl})`);
          }
        }

        if (result.vulnerabilities.length > 20) {
          sections.push(`\n*...and ${result.vulnerabilities.length - 20} more vulnerabilities*`);
        }
      }

      // Recommendations
      sections.push(`\n### Recommendations`);
      for (const rec of result.recommendations) {
        sections.push(`- ${rec}`);
      }

      // Quick fix command
      if (result.vulnerableCount > 0) {
        sections.push(`\n### Quick Fix`);
        sections.push("```bash");
        sections.push("# Attempt automatic fixes");
        sections.push("npm audit fix");
        sections.push("");
        sections.push("# Force fix (may include breaking changes)");
        sections.push("npm audit fix --force");
        sections.push("```");
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.riskLevel === "critical" || result.riskLevel === "high",
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to check dependencies: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Detect secrets in files
   */
  @MCPTool({
    name: "security-detect-secrets",
    description:
      "Detect potential secrets, API keys, and credentials in source code",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Specific files to scan (empty for all)",
        },
        entropyThreshold: {
          type: "number",
          description: "Entropy threshold for detection (default: 4.5)",
        },
        minConfidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Minimum confidence level (default: medium)",
        },
      },
    },
  })
  async handleDetectSecrets(args: {
    files?: string[];
    entropyThreshold?: number;
    minConfidence?: "high" | "medium" | "low";
  }): Promise<MCPToolResult> {
    try {
      const result = await this.securityService.detectSecrets({
        files: args.files,
        entropyThreshold: args.entropyThreshold || 4.5,
        minConfidence: args.minConfidence || "medium",
      });

      const sections: string[] = [];

      // Header
      const statusEmoji = result.totalSecrets === 0 ? "✅" : "🔐";
      sections.push(`## Secret Detection Results ${statusEmoji}`);

      // Statistics
      sections.push(`\n### Overview`);
      sections.push(`| Metric | Value |`);
      sections.push(`|--------|-------|`);
      sections.push(`| Files Scanned | ${result.filesScanned} |`);
      sections.push(`| Secrets Found | ${result.totalSecrets} |`);
      sections.push(`| High Entropy Strings | ${result.highEntropyCount} |`);
      sections.push(`| Detected At | ${new Date(result.detectedAt).toLocaleString()} |`);

      // Secrets by type
      if (result.totalSecrets > 0) {
        const activeTypes = Object.entries(result.byType)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);

        if (activeTypes.length > 0) {
          sections.push(`\n### Secrets by Type`);
          sections.push(`| Type | Count |`);
          sections.push(`|------|-------|`);
          for (const [type, count] of activeTypes) {
            sections.push(`| ${this.formatSecretType(type)} | ${count} |`);
          }
        }

        // Detailed secrets
        sections.push(`\n### Detected Secrets`);
        sections.push(`⚠️ **These values have been redacted for security**`);

        // Group by file
        const byFile = new Map<string, typeof result.secrets>();
        for (const secret of result.secrets) {
          if (!byFile.has(secret.file)) {
            byFile.set(secret.file, []);
          }
          byFile.get(secret.file)!.push(secret);
        }

        for (const [file, secrets] of byFile) {
          sections.push(`\n**${file}**`);
          for (const secret of secrets) {
            const emoji = this.getSeverityEmoji(secret.severity);
            const confidence = this.getConfidenceEmoji(secret.confidence);
            sections.push(
              `- ${emoji} Line ${secret.line}: ${this.formatSecretType(secret.type)} ${confidence}`
            );
            sections.push(`  - Match: \`${secret.match}\``);
            sections.push(`  - Detected by: ${secret.detectedBy}`);
            if (secret.entropy) {
              sections.push(`  - Entropy: ${secret.entropy.toFixed(2)}`);
            }
          }
        }
      }

      // Suggestions
      sections.push(`\n### Suggestions`);
      for (const suggestion of result.suggestions) {
        sections.push(`- ${suggestion}`);
      }

      // Immediate actions
      if (result.totalSecrets > 0) {
        sections.push(`\n### Immediate Actions Required`);
        sections.push(`1. 🔑 **Rotate** all detected credentials immediately`);
        sections.push(`2. 🗑️ **Remove** secrets from source code`);
        sections.push(`3. 📦 **Move** secrets to environment variables or a secrets manager`);
        sections.push(`4. 📜 **Check** git history for exposed secrets`);

        sections.push(`\n### Environment Variable Example`);
        sections.push("```bash");
        sections.push("# .env (add to .gitignore!)");
        sections.push("API_KEY=your-secret-here");
        sections.push("DATABASE_URL=your-connection-string");
        sections.push("```");
        sections.push("```typescript");
        sections.push("// Access via process.env");
        sections.push("const apiKey = process.env.API_KEY;");
        sections.push("```");
      }

      return {
        content: [{ type: "text", text: sections.join("\n") }],
        isError: result.totalSecrets > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to detect secrets: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: SecuritySeverity): string {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      case "info":
        return "⚪";
      default:
        return "❓";
    }
  }

  /**
   * Get risk emoji
   */
  private getRiskEmoji(risk: string): string {
    switch (risk) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      case "none":
        return "✅";
      default:
        return "❓";
    }
  }

  /**
   * Get confidence emoji
   */
  private getConfidenceEmoji(confidence: string): string {
    switch (confidence) {
      case "high":
        return "🎯";
      case "medium":
        return "📊";
      case "low":
        return "❓";
      default:
        return "";
    }
  }

  /**
   * Format category name
   */
  private formatCategory(category: string): string {
    return category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Format secret type
   */
  private formatSecretType(type: string): string {
    return type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Convert severity to number
   */
  private severityToNumber(severity: SecuritySeverity): number {
    const order: Record<SecuritySeverity, number> = {
      info: 0,
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return order[severity];
  }
}
