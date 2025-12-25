/**
 * Checkpoint Types
 *
 * Supports resumable work sessions by saving task state
 */

export interface CheckpointFile {
  path: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
}

export interface Checkpoint {
  id: string;
  workflowId?: string;
  taskId: string;
  taskDescription: string;
  checkpoint: string; // ISO timestamp
  completed: CheckpointFile[];
  pending: CheckpointFile[];
  context: string;
  nextStep: string;
  metadata: {
    branch?: string;
    lastCommit?: string;
    modifiedFiles: string[];
    totalFiles: number;
    completedCount: number;
  };
}

export interface CheckpointIndex {
  version: string;
  lastUpdated: string;
  totalCheckpoints: number;
  checkpoints: Array<{
    id: string;
    taskId: string;
    taskDescription: string;
    checkpoint: string;
    completedCount: number;
    totalFiles: number;
    isActive: boolean;
  }>;
}
