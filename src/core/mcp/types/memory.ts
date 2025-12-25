/**
 * Memory System Types
 * 
 * Defines types for the long-term knowledge system that stores
 * and retrieves past experiences, patterns, decisions, and lessons.
 */

export interface Experience {
  /** Unique identifier */
  id: string;
  
  /** Experience category */
  type: 'pattern' | 'decision' | 'solution' | 'lesson';
  
  /** Brief descriptive title (max 200 characters) */
  title: string;
  
  /** Full markdown content */
  content: string;
  
  /** Searchable keywords (1-10 tags) */
  tags: string[];
  
  /** Creation date (ISO 8601) */
  date: string;
  
  /** Associated workflows that used/generated this experience */
  workflowIds: string[];
  
  /** Effectiveness metric if tracked (0-1) */
  successRate?: number;
  
  /** Flexible additional data */
  metadata: Record<string, unknown>;
}

export interface MemoryIndex {
  /** Index format version */
  version: string;
  
  /** Last modification time (ISO 8601) */
  lastUpdated: string;
  
  /** Total number of indexed experiences */
  totalExperiences: number;
  
  /** Count by category */
  categories: {
    patterns: number;
    decisions: number;
    solutions: number;
    lessons: number;
  };
  
  /** Searchable entries */
  index: ExperienceIndexEntry[];
}

export interface ExperienceIndexEntry {
  /** Unique identifier */
  id: string;
  
  /** Experience category */
  type: 'pattern' | 'decision' | 'solution' | 'lesson';
  
  /** Brief title */
  title: string;
  
  /** Searchable keywords */
  tags: string[];
  
  /** Relative path from .cortex/memory/ */
  path: string;
  
  /** Relevance score (computed during search) */
  relevanceScore: number;
  
  /** Usage count (how many workflows used this) */
  usageCount: number;
}

export interface MemorySearchResult {
  /** Matching experiences */
  experiences: Experience[];
  
  /** Search query used */
  query: string;
  
  /** Total matches found */
  totalMatches: number;
  
  /** Search duration in milliseconds */
  searchTime: number;
}

