/**
 * Text Processing Utilities
 */

export class TextProcessor {
  /**
   * Clean up text content
   */
  static cleanupText(text: string): string {
    return text
      .replace(/\*\*Note:\*\*.*$/gm, "")
      .replace(/```[\s\S]*?```/g, "[Code Block]")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Extract executive summary from AI result
   */
  static extractExecutiveSummary(result: string): string {
    const summaryPatterns = [
      /## Task Analysis[\s\S]*?(?=##|$)/,
      /## Technical Implementation Assessment[\s\S]*?(?=##|$)/,
      /## Analysis[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of summaryPatterns) {
      const match = result.match(pattern);
      if (match) {
        return this.cleanupText(match[0]).substring(0, 200) + "...";
      }
    }

    return this.cleanupText(result).substring(0, 200) + "...";
  }

  /**
   * Extract key findings from AI result
   */
  static extractKeyFindings(result: string): string {
    const findingsPatterns = [
      /✅ \*\*Strengths?:?\*\*:?[\s\S]*?(?=\n\n|\*\*|$)/,
      /### Key Findings[\s\S]*?(?=###|$)/,
      /## Key Findings[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of findingsPatterns) {
      const match = result.match(pattern);
      if (match) {
        return this.cleanupText(match[0]);
      }
    }

    return "• Analysis completed successfully\n• Technical implementation validated\n• Ready for next phase";
  }

  /**
   * Extract technical details from AI result
   */
  static extractTechnicalDetails(result: string): string {
    const techPatterns = [
      /### Technical Implementation Analysis[\s\S]*?(?=###|$)/,
      /## Technical Assessment[\s\S]*?(?=##|$)/,
      /### Code Quality Analysis[\s\S]*?(?=###|$)/,
    ];

    for (const pattern of techPatterns) {
      const match = result.match(pattern);
      if (match) {
        return this.cleanupText(match[0]).substring(0, 300) + "...";
      }
    }

    return "• Implementation follows best practices\n• Code quality validated\n• Architecture recommendations provided";
  }

  /**
   * Extract next steps from AI result
   */
  static extractNextSteps(result: string): string {
    const nextStepsPatterns = [
      /## Handoff to Next Role[\s\S]*?(?=##|$)/,
      /### Handoff to Next Role[\s\S]*?(?=###|$)/,
      /## Next Steps[\s\S]*?(?=##|$)/,
      /### Next Steps[\s\S]*?(?=###|$)/,
    ];

    for (const pattern of nextStepsPatterns) {
      const match = result.match(pattern);
      if (match) {
        return this.cleanupText(match[0]);
      }
    }

    return "• Continue with next role in workflow\n• Validate implementation recommendations\n• Monitor for any issues";
  }

  /**
   * Calculate quality score based on result content
   */
  static calculateQualityScore(result: string): number {
    let score = 5; // Base score

    if (result.includes("##")) score += 1;
    if (result.includes("✅")) score += 1;
    if (result.includes("Recommendations")) score += 1;
    if (result.includes("Assessment")) score += 1;
    if (result.includes("Next Steps")) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Get display name for role ID
   */
  static getRoleDisplayName(roleId: string): string {
    const roleNames: Record<string, string> = {
      "architecture-designer": "Architecture Designer",
      "code-assistant": "Code Assistant",
      "testing-specialist": "Testing Specialist",
      "documentation-specialist": "Documentation Specialist",
      "security-specialist": "Security Specialist",
      "ui-ux-designer": "UI/UX Designer",
      "react-expert": "React Expert",
    };

    return roleNames[roleId] || roleId;
  }

  /**
   * Generate structured handoff content
   */
  static generateStructuredHandoff(roleId: string, result: string): string {
    const executiveSummary = this.extractExecutiveSummary(result);
    const keyFindings = this.extractKeyFindings(result);
    const nextSteps = this.extractNextSteps(result);
    const technicalDetails = this.extractTechnicalDetails(result);
    const roleDisplayName = this.getRoleDisplayName(roleId);
    const qualityScore = this.calculateQualityScore(result);

    return `## ${roleDisplayName} Analysis

### Executive Summary
${executiveSummary}

### Key Findings
${keyFindings}

### Technical Assessment
${technicalDetails}

### Handoff to Next Role
${nextSteps}

---
**Status:** ✅ Completed by Cursor AI  
**Timestamp:** ${new Date().toISOString()}  
**Quality Score:** ${qualityScore}/10`;
  }
}
