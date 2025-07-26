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

export interface Task {
  id: string;
  description: string;
  keywords: string[];
  context: TaskContext;
  priority: "low" | "medium" | "high" | "critical";
  complexity: "simple" | "moderate" | "complex";
}

export interface TaskContext {
  projectType: string;
  technologyStack: string[];
  currentFile?: string;
  userPreferences: UserPreferences;
}

export interface UserPreferences {
  codingStyle: string;
  preferredLanguages: string[];
  teamSize: number;
  projectMaturity: "startup" | "growing" | "enterprise";
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

export interface Interaction {
  id: string;
  timestamp: Date;
  userInput: string;
  selectedRole: Role;
  aiResponse: string;
  feedback?: Feedback;
  context: InteractionContext;
}

export interface Feedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  improvements?: string[];
}

export interface InteractionContext {
  sessionId: string;
  projectPath: string;
  currentTask?: Task;
  userHistory: string[];
}

export interface AIRoleDiscoveryEngine {
  discoverRoles(): Promise<Role[]>;
  learnFromDocs(): Promise<ProjectKnowledge>;
  selectRole(_task: Task): Promise<Role>;
  evolveFromInteraction(_interaction: Interaction): Promise<void>;
}

export interface RoleDiscoveryResult {
  roles: Role[];
  knowledge: ProjectKnowledge;
  patterns: CodePattern[];
  recommendations: string[];
}

export interface EvolutionMetrics {
  roleUsage: Record<string, number>;
  userSatisfaction: number;
  taskSuccessRate: number;
  learningProgress: number;
}
