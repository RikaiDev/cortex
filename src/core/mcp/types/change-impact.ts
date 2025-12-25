/**
 * Change Impact Analysis Types
 *
 * Types for analyzing code dependencies and change impact
 */

export interface DependencyNode {
  file: string;
  imports: ImportReference[];
  exports: ExportReference[];
  references: CodeReference[];
}

export interface ImportReference {
  source: string; // File being imported from
  specifiers: string[]; // What is being imported (function, class, etc.)
  importType: "named" | "default" | "namespace" | "side-effect";
  line: number;
}

export interface ExportReference {
  name: string;
  type: "function" | "class" | "interface" | "type" | "const" | "default";
  line: number;
  isReExport?: boolean;
  originalSource?: string; // If re-exporting from another file
}

export interface CodeReference {
  symbol: string; // Function/class/variable name
  file: string; // File where it's defined
  line: number; // Line where it's used
  type: "call" | "instantiate" | "reference" | "extend" | "implement";
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  dependents: Map<string, Set<string>>; // Reverse lookup: who depends on this file
  lastBuilt: Date;
  fileCount: number;
}

export interface ChangeImpactResult {
  targetFiles: string[];
  affectedFiles: string[];
  impactLevel: "low" | "medium" | "high" | "critical";
  details: ImpactDetail[];
  suggestions: string[];
  breakingChanges: BreakingChange[];
}

export interface ImpactDetail {
  file: string;
  reason: string;
  importedSymbols?: string[];
  usageCount?: number;
  severity: "info" | "warning" | "error";
}

export interface BreakingChange {
  file: string;
  symbol: string;
  changeType: "removed" | "renamed" | "signature-changed" | "moved";
  affectedFiles: string[];
  suggestion?: string;
}

export interface ImpactAnalysisOptions {
  includeTests?: boolean;
  maxDepth?: number; // How many levels deep to analyze
  excludePatterns?: string[];
}
