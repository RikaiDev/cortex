/**
 * Workflow System Types
 * 
 * Defines types for workflow phases, execution, and state management.
 */

export interface WorkflowPhase {
  /** Phase identifier */
  name: 'spec' | 'plan' | 'tasks' | 'implement';
  
  /** Path to markdown template file */
  template: string;
  
  /** Rules to validate against */
  validationRules: string[];
  
  /** Multi-Role system role responsible for this phase */
  assignedRole: string;
  
  /** Generated file name */
  outputFile: string;
  
  /** Current status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface PhaseResult {
  /** Phase name */
  phase: string;
  
  /** Parent workflow identifier */
  workflowId: string;
  
  /** Execution outcome */
  status: 'success' | 'failure' | 'partial';
  
  /** Generated content (markdown) */
  output: string;
  
  /** Compliance check results */
  validation: ValidationResult;
  
  /** Execution time in milliseconds */
  duration: number;
  
  /** Completion timestamp (ISO 8601) */
  timestamp: string;
}

export interface Workflow {
  /** Unique identifier */
  id: string;
  
  /** Feature name */
  title: string;
  
  /** Current phase */
  status: 'spec' | 'plan' | 'tasks' | 'implement' | 'completed';
  
  /** Completed phase outputs */
  phases: PhaseResult[];
  
  /** Start time (ISO 8601) */
  createdAt: string;
  
  /** Last modification (ISO 8601) */
  updatedAt: string;
  
  /** Active Multi-Role assignment */
  currentRole: string;
}

export interface ValidationResult {
  /** Whether validation passed */
  passed: boolean;
  
  /** List of violations found */
  violations: string[];
  
  /** Principles that were checked */
  principles: string[];
  
  /** Detailed messages */
  messages?: string[];
  
  /** Severity level */
  severity?: 'error' | 'warning' | 'info';
}

