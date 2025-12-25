/**
 * Template System Types
 *
 * Simple types for template processing.
 * The template + command architecture doesn't require complex structured types.
 */

export interface TemplateVariables {
  /** Feature name */
  FEATURE?: string;

  /** ISO date */
  DATE?: string;

  /** Git branch name */
  BRANCH?: string;

  /** Unique workflow identifier */
  WORKFLOW_ID?: string;

  /** User stories extracted from input */
  USER_STORIES?: string;

  /** Generated or extracted requirements */
  REQUIREMENTS?: string;

  /** Technical context from research */
  TECHNICAL_CONTEXT?: string;

  /** Mapped to Multi-Role system */
  ROLE_ASSIGNMENTS?: string;

  /** Generated from plan */
  TASK_LIST?: string;

  /** Computed dependencies */
  DEPENDENCIES?: string;

  /** Additional custom variables */
  [key: string]: string | undefined;
}
