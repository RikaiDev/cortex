/**
 * Danger Zone Types
 *
 * Types for protected code region management
 */

/**
 * Represents a protected code region that should not be modified without explicit user confirmation
 */
export interface DangerZone {
  /** File path relative to project root */
  file: string;

  /** Starting line number (1-indexed) */
  startLine: number;

  /** Ending line number (1-indexed), optional for single-line protection */
  endLine?: number;

  /** Reason why this region is protected */
  reason: string;

  /** How this zone was marked: 'comment' (from code) or 'config' (from danger-zones.json) */
  markedBy: "comment" | "config";

  /** When this zone was created */
  createdAt: string;
}

/**
 * Configuration file format for danger zones
 */
export interface DangerZoneConfig {
  zones: Array<{
    file: string;
    startLine?: number;
    endLine?: number;
    reason: string;
  }>;
}

/**
 * Result of checking files against danger zones
 */
export interface DangerZoneCheckResult {
  /** Whether any danger zones were found */
  hasDangerZones: boolean;

  /** List of affected danger zones */
  zones: DangerZone[];

  /** Warning message to display */
  message?: string;
}
