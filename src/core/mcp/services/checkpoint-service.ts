/**
 * Checkpoint Service
 *
 * Manages task checkpoints for resumable work sessions.
 * Allows developers to pause and resume tasks without losing context.
 */

import * as path from "node:path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import type { Checkpoint, CheckpointIndex } from "../types/checkpoint.js";

/**
 * Service for managing task checkpoints and resumable work sessions.
 *
 * Allows saving, resuming, and managing checkpoints that preserve
 * task context across development sessions.
 */
export class CheckpointService {
  private checkpointsPath: string;
  private indexPath: string;

  /**
   * @param projectRoot - Root directory of the project
   */
  constructor(private projectRoot: string) {
    const cortexDir = path.join(projectRoot, ".cortex");
    this.checkpointsPath = path.join(cortexDir, "checkpoints");
    this.indexPath = path.join(this.checkpointsPath, "index.json");
  }

  /**
   * Initialize checkpoints directory
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.checkpointsPath);
    if (!(await fs.pathExists(this.indexPath))) {
      const emptyIndex: CheckpointIndex = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalCheckpoints: 0,
        checkpoints: [],
      };
      await fs.writeJson(this.indexPath, emptyIndex, { spaces: 2 });
    }
  }

  /**
   * Save a checkpoint
   */
  async saveCheckpoint(checkpoint: Partial<Checkpoint>): Promise<string> {
    await this.initialize();

    // Generate checkpoint ID
    const checkpointId =
      checkpoint.id || `checkpoint-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const fullCheckpoint: Checkpoint = {
      id: checkpointId,
      workflowId: checkpoint.workflowId,
      taskId: checkpoint.taskId || checkpointId,
      taskDescription: checkpoint.taskDescription || "Task in progress",
      checkpoint: new Date().toISOString(),
      completed: checkpoint.completed || [],
      pending: checkpoint.pending || [],
      context: checkpoint.context || "",
      nextStep: checkpoint.nextStep || "",
      metadata: {
        branch: checkpoint.metadata?.branch,
        lastCommit: checkpoint.metadata?.lastCommit,
        modifiedFiles: checkpoint.metadata?.modifiedFiles || [],
        totalFiles:
          (checkpoint.completed?.length || 0) +
          (checkpoint.pending?.length || 0),
        completedCount: checkpoint.completed?.length || 0,
      },
    };

    // Save checkpoint file
    const fileName = `${checkpointId}.json`;
    const filePath = path.join(this.checkpointsPath, fileName);
    await fs.writeJson(filePath, fullCheckpoint, { spaces: 2 });

    // Update index
    await this.updateIndex(fullCheckpoint);

    return checkpointId;
  }

  /**
   * Load a checkpoint by ID
   */
  async loadCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    await this.initialize();

    const filePath = path.join(this.checkpointsPath, `${checkpointId}.json`);
    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    return fs.readJson(filePath);
  }

  /**
   * Get the latest checkpoint
   */
  async getLatestCheckpoint(): Promise<Checkpoint | null> {
    await this.initialize();

    const index: CheckpointIndex = await fs.readJson(this.indexPath);
    if (index.checkpoints.length === 0) {
      return null;
    }

    // Sort by checkpoint timestamp descending
    const sorted = [...index.checkpoints].sort(
      (a, b) =>
        new Date(b.checkpoint).getTime() - new Date(a.checkpoint).getTime()
    );

    const latestId = sorted[0].id;
    return this.loadCheckpoint(latestId);
  }

  /**
   * List all checkpoints
   */
  async listCheckpoints(limit = 10): Promise<CheckpointIndex["checkpoints"]> {
    await this.initialize();

    const index: CheckpointIndex = await fs.readJson(this.indexPath);

    // Sort by checkpoint timestamp descending
    const sorted = [...index.checkpoints].sort(
      (a, b) =>
        new Date(b.checkpoint).getTime() - new Date(a.checkpoint).getTime()
    );

    return sorted.slice(0, limit);
  }

  /**
   * Clear a checkpoint
   */
  async clearCheckpoint(checkpointId: string): Promise<boolean> {
    await this.initialize();

    const filePath = path.join(this.checkpointsPath, `${checkpointId}.json`);
    if (!(await fs.pathExists(filePath))) {
      return false;
    }

    // Remove file
    await fs.remove(filePath);

    // Update index
    const index: CheckpointIndex = await fs.readJson(this.indexPath);
    index.checkpoints = index.checkpoints.filter((c) => c.id !== checkpointId);
    index.totalCheckpoints = index.checkpoints.length;
    index.lastUpdated = new Date().toISOString();
    await fs.writeJson(this.indexPath, index, { spaces: 2 });

    return true;
  }

  /**
   * Clear all checkpoints
   */
  async clearAllCheckpoints(): Promise<number> {
    await this.initialize();

    const index: CheckpointIndex = await fs.readJson(this.indexPath);
    const count = index.checkpoints.length;

    // Remove all checkpoint files
    for (const checkpoint of index.checkpoints) {
      const filePath = path.join(this.checkpointsPath, `${checkpoint.id}.json`);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }

    // Reset index
    const emptyIndex: CheckpointIndex = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      totalCheckpoints: 0,
      checkpoints: [],
    };
    await fs.writeJson(this.indexPath, emptyIndex, { spaces: 2 });

    return count;
  }

  /**
   * Mark checkpoint as active/inactive
   */
  async setCheckpointActive(
    checkpointId: string,
    isActive: boolean
  ): Promise<void> {
    await this.initialize();

    const index: CheckpointIndex = await fs.readJson(this.indexPath);
    const checkpointEntry = index.checkpoints.find(
      (c) => c.id === checkpointId
    );

    if (checkpointEntry) {
      checkpointEntry.isActive = isActive;
      index.lastUpdated = new Date().toISOString();
      await fs.writeJson(this.indexPath, index, { spaces: 2 });
    }
  }

  /**
   * Update index with new checkpoint
   */
  private async updateIndex(checkpoint: Checkpoint): Promise<void> {
    const index: CheckpointIndex = await fs.readJson(this.indexPath);

    // Remove existing entry if updating
    index.checkpoints = index.checkpoints.filter((c) => c.id !== checkpoint.id);

    // Add new entry
    index.checkpoints.push({
      id: checkpoint.id,
      taskId: checkpoint.taskId,
      taskDescription: checkpoint.taskDescription,
      checkpoint: checkpoint.checkpoint,
      completedCount: checkpoint.metadata.completedCount,
      totalFiles: checkpoint.metadata.totalFiles,
      isActive: true,
    });

    index.totalCheckpoints = index.checkpoints.length;
    index.lastUpdated = new Date().toISOString();

    await fs.writeJson(this.indexPath, index, { spaces: 2 });
  }

  /**
   * Format checkpoint as resume context
   */
  formatCheckpointAsContext(checkpoint: Checkpoint): string {
    const lines = [
      "## 📍 Resuming from Checkpoint",
      "",
      `**Task**: ${checkpoint.taskDescription}`,
      `**Checkpoint**: ${new Date(checkpoint.checkpoint).toLocaleString()}`,
      "",
      "### Progress",
      `- **Completed**: ${checkpoint.metadata.completedCount}/${checkpoint.metadata.totalFiles} files`,
      "",
    ];

    if (checkpoint.completed.length > 0) {
      lines.push("### ✅ Completed Files");
      for (const file of checkpoint.completed) {
        lines.push(`- \`${file.path}\` - ${file.description}`);
      }
      lines.push("");
    }

    if (checkpoint.pending.length > 0) {
      lines.push("### ⏳ Pending Files");
      for (const file of checkpoint.pending) {
        lines.push(`- \`${file.path}\` - ${file.description}`);
      }
      lines.push("");
    }

    if (checkpoint.context) {
      lines.push("### 📝 Context");
      lines.push(checkpoint.context);
      lines.push("");
    }

    if (checkpoint.nextStep) {
      lines.push("### ➡️ Next Step");
      lines.push(checkpoint.nextStep);
      lines.push("");
    }

    if (checkpoint.metadata.branch) {
      lines.push(`**Branch**: \`${checkpoint.metadata.branch}\``);
    }

    return lines.join("\n");
  }
}
