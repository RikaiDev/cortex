/**
 * Constitution Validator Service
 * 
 * Validates workflow phases against constitutional principles
 * to ensure quality standards and implementation integrity.
 */

import * as path from 'node:path';
import * as fs from 'fs-extra';
import type { 
  Constitution, 
  ConstitutionPrinciple,
  ValidationCheckpoint,
  ValidationReport
} from '../types/validation.js';
import type { ValidationResult } from '../types/workflow.js';

export class ConstitutionValidator {
  private constitutionPath: string;
  private cachedConstitution: Constitution | null = null;

  constructor(private projectRoot: string) {
    this.constitutionPath = path.join(projectRoot, '.cortex', 'constitution.md');
  }

  /**
   * Load and parse constitution principles
   */
  async loadPrinciples(): Promise<ConstitutionPrinciple[]> {
    if (this.cachedConstitution) {
      return this.cachedConstitution.principles;
    }

    if (!(await fs.pathExists(this.constitutionPath))) {
      throw new Error('Constitution file not found. Run `cortex init` first.');
    }

    const content = await fs.readFile(this.constitutionPath, 'utf-8');
    const constitution = this.parseConstitution(content);
    this.cachedConstitution = constitution;

    return constitution.principles;
  }

  /**
   * Parse constitution markdown file
   */
  private parseConstitution(content: string): Constitution {
    // Extract version
    const versionMatch = content.match(/\*\*Version\*\*: ([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : '1.0.0';

    // Extract dates
    const ratifiedMatch = content.match(/\*\*Ratified\*\*: ([\d-]+)/);
    const ratified = ratifiedMatch ? ratifiedMatch[1] : new Date().toISOString().split('T')[0];

    const amendedMatch = content.match(/\*\*Last Amended\*\*: ([\d-]+)/);
    const lastAmended = amendedMatch ? amendedMatch[1] : ratified;

    // Parse principles (simplified - would need more robust parsing in production)
    const principles: ConstitutionPrinciple[] = [
      {
        id: 'code-quality',
        name: 'Code Quality',
        category: 'Code Quality',
        description: 'Write clear, maintainable code',
        rules: [],
      },
      {
        id: 'testing-standards',
        name: 'Testing Standards',
        category: 'Testing',
        description: 'Test what matters with proper lifecycle',
        rules: [],
      },
      {
        id: 'ux-consistency',
        name: 'User Experience Consistency',
        category: 'UX',
        description: 'Cross-platform behavior and documentation quality',
        rules: [],
      },
      {
        id: 'performance',
        name: 'Performance Requirements',
        category: 'Performance',
        description: 'Response time standards and resource efficiency',
        rules: [],
      },
      {
        id: 'implementation-integrity',
        name: 'Real Implementation Integrity',
        category: 'Integrity',
        description: 'No fake code, honest communication, real testing',
        rules: [],
      },
      {
        id: 'user-confirmation',
        name: 'User Confirmation and Feedback',
        category: 'User Confirmation',
        description: 'Mandatory checkpoints and progressive disclosure',
        rules: [],
      },
    ];

    return {
      version,
      ratified,
      lastAmended,
      principles,
      gates: [],
    };
  }

  /**
   * Get principles relevant to a specific phase
   */
  getPrinciplesForPhase(phase: 'spec' | 'plan' | 'tasks' | 'implement'): ConstitutionPrinciple[] {
    // Phase-specific principle mapping
    const phaseMap: Record<string, string[]> = {
      spec: ['code-quality', 'user-confirmation'],
      plan: ['code-quality', 'implementation-integrity', 'user-confirmation'],
      tasks: ['testing-standards', 'implementation-integrity', 'user-confirmation'],
      implement: ['code-quality', 'testing-standards', 'implementation-integrity', 'performance'],
    };

    const principles = this.cachedConstitution?.principles || [];
    const relevantIds = phaseMap[phase] || [];

    return principles.filter((p) => relevantIds.includes(p.id));
  }

  /**
   * Validate phase output against constitution
   */
  async validatePhase(
    phase: 'spec' | 'plan' | 'tasks' | 'implement',
    output: string
  ): Promise<ValidationReport> {
    const principles = await this.loadPrinciples();
    const relevantPrinciples = this.getPrinciplesForPhase(phase);

    const checks: ValidationReport['checks'] = [];
    const violations: ValidationReport['violations'] = [];

    // Run validation checks
    for (const principle of relevantPrinciples) {
      const result = this.checkPrinciple(principle, output, phase);
      
      const message = result.messages?.[0] || `Checked ${principle.name}`;
      
      checks.push({
        principle: principle.name,
        status: result.passed ? 'PASS' : 'FAIL',
        message,
      });

      if (!result.passed) {
        violations.push({
          principle: principle.name,
          rule: principle.description,
          severity: 'error',
          message: result.messages?.[0] || `Violation of ${principle.name}`,
          remediation: this.getRemediation(principle.id),
        });
      }
    }

    const status = violations.length === 0 ? 'PASS' : 'FAIL';

    return {
      phase,
      status,
      checks,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Check a specific principle against content
   */
  private checkPrinciple(
    principle: ConstitutionPrinciple,
    content: string,
    phase: string
  ): ValidationResult {
    const violations: string[] = [];
    const messages: string[] = [];

    // Implementation Integrity checks
    if (principle.id === 'implementation-integrity') {
      // Check for mock/stub/fake patterns
      const mockPattern = /\b(mock|stub|fake|dummy)\b/gi;
      if (mockPattern.test(content)) {
        violations.push('Found mock/stub/fake references');
        messages.push('Constitution violation: No mock data allowed in production code');
      }

      // Check for hardcoded values
      const hardcodePattern = /hardcode|TODO: change this|FIXME/gi;
      if (hardcodePattern.test(content)) {
        violations.push('Found hardcoded values or TODOs');
        messages.push('Constitution violation: No hardcoded values or temporary TODOs');
      }
    }

    // User Confirmation checks
    if (principle.id === 'user-confirmation' && phase !== 'implement') {
      // Check if output includes confirmation checkpoint
      const hasCheckpoint = content.includes('[WAITING FOR USER CONFIRMATION]') ||
                           content.includes('Next steps:') ||
                           content.includes('Would you like to');
      
      if (!hasCheckpoint) {
        violations.push('Missing user confirmation checkpoint');
        messages.push('Constitution violation: Must pause for user confirmation at phase end');
      }
    }

    // Performance checks (for implement phase)
    if (principle.id === 'performance' && phase === 'implement') {
      // Check if performance monitoring is mentioned
      const hasPerfMonitoring = content.includes('performance') || 
                               content.includes('< 2 seconds') ||
                               content.includes('< 500ms');
      
      if (!hasPerfMonitoring) {
        messages.push('Note: Consider adding performance monitoring');
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      principles: [principle.name],
      messages,
    };
  }

  /**
   * Get remediation guidance for a principle violation
   */
  private getRemediation(principleId: string): string {
    const remediations: Record<string, string> = {
      'implementation-integrity': 
        'Remove all mock/stub/fake references and replace with real implementations. ' +
        'Remove hardcoded values and use proper configuration. ' +
        'Complete all TODOs before marking as done.',
      
      'user-confirmation':
        'Add user confirmation checkpoint at end of phase output. ' +
        'Include summary, next-step options, and [WAITING FOR USER CONFIRMATION] marker.',
      
      'code-quality':
        'Follow TypeScript strict mode, use descriptive names, handle errors explicitly.',
      
      'testing-standards':
        'Write tests before implementation (TDD). Test real implementations, not mocks.',
      
      'performance':
        'Add performance monitoring to validate < 2s tool responses and < 500ms file operations.',
    };

    return remediations[principleId] || 'Review constitution principles and adjust implementation.';
  }

  /**
   * Format validation result as readable report
   */
  formatValidationResult(report: ValidationReport): string {
    const lines: string[] = [
      `## Constitution Validation: ${report.phase.toUpperCase()} Phase`,
      '',
      `**Status**: ${report.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}`,
      '',
      '### Checks Performed:',
      '',
    ];

    for (const check of report.checks) {
      const icon = check.status === 'PASS' ? '✓' : '✗';
      lines.push(`- ${icon} ${check.principle}: ${check.message}`);
    }

    if (report.violations && report.violations.length > 0) {
      lines.push('', '### Violations Found:', '');
      
      for (const violation of report.violations) {
        lines.push(`#### ${violation.principle}`);
        lines.push(`**Severity**: ${violation.severity.toUpperCase()}`);
        lines.push(`**Rule**: ${violation.rule}`);
        lines.push(`**Issue**: ${violation.message}`);
        if (violation.remediation) {
          lines.push(`**How to Fix**: ${violation.remediation}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

