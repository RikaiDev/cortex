// Base adapter interface for all AI platforms
// This provides a unified interface for Cursor, Gemini, Claude, etc.

export interface Role {
  name: string;
  description: string;
  keywords: string[];
  capabilities: string[];
}

export interface ProjectKnowledge {
  patterns: string[];
  conventions: string[];
  preferences: string[];
}

export interface AIAdapter {
  name: string;
  version: string;

  // Core functionality
  generateConfig(): Promise<string>;
  injectRules(): Promise<void>;
}

export abstract class BaseAdapter implements AIAdapter {
  protected projectPath: string;
  protected roles: Role[];
  protected projectKnowledge: ProjectKnowledge;

  constructor(
    projectPath: string,
    roles: Role[],
    projectKnowledge: ProjectKnowledge
  ) {
    this.projectPath = projectPath;
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  abstract get name(): string;
  abstract get version(): string;

  abstract generateConfig(): Promise<string>;
  abstract injectRules(): Promise<void>;
}
