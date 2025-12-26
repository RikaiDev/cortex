/**
 * Memory Module
 *
 * Manages long-term knowledge storage and retrieval
 */

import type { Experience, MemorySearchResult } from "../../types/memory.js";
import { MemoryStorage } from "./memory-storage.js";
import { LearningExtractor } from "./learning-extractor.js";

/**
 * MemoryService - Facade class for backward compatibility
 *
 * Maintains the same public API as the original MemoryService class
 * while delegating to specialized sub-modules.
 */
/**
 * Service for managing AI learning and experience memory.
 *
 * Stores patterns, decisions, solutions, and lessons learned from
 * development sessions to improve future recommendations.
 */
export class MemoryService {
  private storage: MemoryStorage;
  private extractor: LearningExtractor;

  /**
   * @param projectRoot - Root directory of the project
   */
  constructor(private projectRoot: string) {
    this.storage = new MemoryStorage(projectRoot);
    this.extractor = new LearningExtractor(this.storage, projectRoot);
  }

  /**
   * Initialize memory directory structure
   */
  async initialize(): Promise<void> {
    return this.storage.initialize();
  }

  /**
   * Record a new experience to memory
   */
  async recordExperience(exp: Partial<Experience>): Promise<string> {
    return this.storage.recordExperience(exp);
  }

  /**
   * Search experiences by query with relevance scoring
   */
  async searchExperiences(
    query: string,
    limit = 5
  ): Promise<MemorySearchResult> {
    return this.storage.searchExperiences(query, limit);
  }

  /**
   * Enhance context by retrieving relevant experiences
   */
  async enhanceContext(currentTask: string): Promise<string> {
    return this.storage.enhanceContext(currentTask);
  }

  /**
   * Extract learnings from workflow execution
   */
  async extractLearnings(workflowId: string): Promise<void> {
    return this.extractor.extractLearnings(workflowId);
  }
}
