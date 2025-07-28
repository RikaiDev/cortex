// Core types for Cortex AI Collaboration Brain

export interface Role {
  name: string;
  description: string;
  capabilities: string[];
  discoveryKeywords: string[];
  implementationGuidelines: string;
  examples: Example[];
  metadata: RoleMetadata;
}

export interface Example {
  title: string;
  description: string;
  input: string;
  output: string;
  context?: string;
}

export interface RoleMetadata {
  sourceFile: string;
  lastModified: Date;
  version: string;
  tags: string[];
  priority: number;
}

export interface ProjectKnowledge {
  architecture: ArchitecturePattern[];
  codingPatterns: CodePattern[];
  technologyStack: TechnologyInfo[];
  conventions: Convention[];
  constraints: Constraint[];
}

export interface ArchitecturePattern {
  name: string;
  description: string;
  implementation: string;
  benefits: string[];
  tradeoffs: string[];
}

export interface CodePattern {
  name: string;
  description: string;
  examples: string[];
  frequency: number;
  context: string[];
}

export interface TechnologyInfo {
  name: string;
  version: string;
  purpose: string;
  configuration: Record<string, any>;
}

export interface Convention {
  type: "naming" | "structure" | "style" | "process";
  description: string;
  examples: string[];
  enforcement: "strict" | "recommended" | "optional";
}

export interface Constraint {
  type: "security" | "performance" | "compliance" | "business";
  description: string;
  impact: "high" | "medium" | "low";
  mitigation?: string;
}
