/**
 * MCP Server Types
 */

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Workflow phase types
 */
export type WorkflowPhase = 'clarify' | 'plan' | 'review' | 'tasks' | 'implement' | 'status';

export interface WorkflowToolArgs {
  phase: WorkflowPhase;
  workflowId?: string;
}

/**
 * Memory tool arguments (discriminated union)
 */
export type MemoryToolArgs =
  | {
      action: 'learn';
      title: string;
      content: string;
      type: 'pattern' | 'decision' | 'solution' | 'lesson';
      tags?: string[];
    }
  | {
      action: 'context';
      query: string;
    };

export interface MCPResourceResult {
  contents: Array<{
    uri: string;
    mimeType: string;
    text?: string;
    blob?: string;
  }>;
}

export interface ProjectSnapshot {
  timestamp: string;
  projectRoot: string;
  projectInfo: {
    name?: string;
    version?: string;
    description?: string;
    scripts?: Record<string, string>;
  };
  architecture: {
    typescript?: {
      target?: string;
      module?: string;
      strict?: boolean;
      outDir?: string;
    };
  };
  dependencies: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  fileStructure: Record<string, unknown>;
  recentWorkflows: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  keyDecisions: string[];
  bestPractices: string[];
}

export interface WorkflowSnapshot {
  timestamp: string;
  workflowId: string;
  workflowState: Record<string, unknown>;
  handoffContent: string;
  keyDecisions: string[];
  lessonsLearned: string[];
  technicalDebt: string[];
  recommendations: string[];
}

export interface SnapshotSearchResults {
  timestamp: string;
  totalSnapshots: number;
  projectSnapshots: ProjectSnapshot[];
  workflowSnapshots: WorkflowSnapshot[];
  searchableContent: Array<{
    id: string;
    type: string;
    timestamp: string;
    summary: string;
  }>;
}
