/**
 * Constitution Validation Types
 * 
 * Defines types for constitution-based quality validation.
 */

export interface ConstitutionPrinciple {
  /** Principle identifier */
  id: string;
  
  /** Principle name */
  name: string;
  
  /** Category */
  category: 'Code Quality' | 'Testing' | 'UX' | 'Performance' | 'Integrity' | 'User Confirmation';
  
  /** Description */
  description: string;
  
  /** Specific rules */
  rules: ConstitutionRule[];
}

export interface ConstitutionRule {
  /** Rule statement */
  statement: string;
  
  /** Rationale for this rule */
  rationale: string;
  
  /** Associated checkpoints */
  checkpoints: string[];
}

export interface Constitution {
  /** Semantic version */
  version: string;
  
  /** Official adoption date (ISO 8601) */
  ratified: string;
  
  /** Last modification date (ISO 8601) */
  lastAmended: string;
  
  /** List of principles */
  principles: ConstitutionPrinciple[];
  
  /** Quality gates for workflow phases */
  gates: ConstitutionGate[];
}

export interface ConstitutionGate {
  /** Phase name */
  phase: string;
  
  /** Required principles that must pass */
  requiredPrinciples: string[];
  
  /** Passing criteria */
  passingCriteria: string;
}

export interface ValidationReport {
  /** Phase being validated */
  phase: string;
  
  /** Overall status */
  status: 'PASS' | 'FAIL' | 'WARNING';
  
  /** Individual checks */
  checks: {
    principle: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
  }[];
  
  /** Detailed violations if any */
  violations?: {
    principle: string;
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    remediation?: string;
  }[];
}

