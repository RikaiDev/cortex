import { Role, Task, ProjectKnowledge } from './types.js';

export class IntelligentRoleSelector {
  private roles: Role[] = [];
  private projectKnowledge: ProjectKnowledge;
  private roleUsageHistory: Map<string, number> = new Map();
  private userPreferences: any = {};

  constructor(roles: Role[] = [], projectKnowledge: ProjectKnowledge) {
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  /**
   * Select the optimal role for a given task
   */
  async selectOptimalRole(task: Task): Promise<Role> {
    const candidates = this.findCandidateRoles(task);
    const scoredCandidates = this.scoreCandidates(candidates, task);
    
    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    // Update usage history
    if (scoredCandidates.length > 0) {
      const selectedRole = scoredCandidates[0].role;
      this.updateUsageHistory(selectedRole.name);
      return selectedRole;
    }

    // Fallback to default role if no candidates found
    return this.getDefaultRole();
  }

  /**
   * Find candidate roles based on task keywords and context
   */
  private findCandidateRoles(task: Task): Role[] {
    const candidates: Role[] = [];
    const taskKeywords = task.keywords.map(k => k.toLowerCase());
    const taskDescription = task.description.toLowerCase();

    for (const role of this.roles) {
      const roleKeywords = role.discoveryKeywords.map(k => k.toLowerCase());
      const roleDescription = role.description.toLowerCase();
      const roleCapabilities = role.capabilities.map(c => c.toLowerCase());

      // Check keyword matches
      const keywordMatches = taskKeywords.filter(keyword => 
        roleKeywords.some(roleKeyword => roleKeyword.includes(keyword) || keyword.includes(roleKeyword))
      );

      // Check description relevance
      const descriptionRelevance = this.calculateTextRelevance(taskDescription, roleDescription);

      // Check capability matches
      const capabilityMatches = taskKeywords.filter(keyword =>
        roleCapabilities.some(capability => capability.includes(keyword) || keyword.includes(capability))
      );

      // If we have any matches, consider this role a candidate
      if (keywordMatches.length > 0 || descriptionRelevance > 0.3 || capabilityMatches.length > 0) {
        candidates.push(role);
      }
    }

    return candidates;
  }

  /**
   * Score candidate roles based on multiple factors
   */
  private scoreCandidates(candidates: Role[], task: Task): Array<{ role: Role; score: number }> {
    return candidates.map(role => {
      let score = 0;

      // Keyword matching score (40% weight)
      const keywordScore = this.calculateKeywordScore(role, task);
      score += keywordScore * 0.4;

      // Description relevance score (25% weight)
      const descriptionScore = this.calculateTextRelevance(task.description, role.description);
      score += descriptionScore * 0.25;

      // Capability matching score (20% weight)
      const capabilityScore = this.calculateCapabilityScore(role, task);
      score += capabilityScore * 0.2;

      // Usage history score (10% weight) - prefer less used roles for variety
      const usageScore = this.calculateUsageScore(role);
      score += usageScore * 0.1;

      // Priority score (5% weight)
      const priorityScore = role.metadata.priority / 10; // Normalize priority to 0-1
      score += priorityScore * 0.05;

      return { role, score };
    });
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(role: Role, task: Task): number {
    const taskKeywords = task.keywords.map(k => k.toLowerCase());
    const roleKeywords = role.discoveryKeywords.map(k => k.toLowerCase());
    
    let matches = 0;
    const totalKeywords = taskKeywords.length;

    for (const taskKeyword of taskKeywords) {
      for (const roleKeyword of roleKeywords) {
        if (roleKeyword.includes(taskKeyword) || taskKeyword.includes(roleKeyword)) {
          matches++;
          break;
        }
      }
    }

    return totalKeywords > 0 ? matches / totalKeywords : 0;
  }

  /**
   * Calculate text relevance using simple similarity
   */
  private calculateTextRelevance(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate capability matching score
   */
  private calculateCapabilityScore(role: Role, task: Task): number {
    const taskKeywords = task.keywords.map(k => k.toLowerCase());
    const roleCapabilities = role.capabilities.map(c => c.toLowerCase());
    
    let matches = 0;
    const totalCapabilities = roleCapabilities.length;

    for (const capability of roleCapabilities) {
      for (const keyword of taskKeywords) {
        if (capability.includes(keyword) || keyword.includes(capability)) {
          matches++;
          break;
        }
      }
    }

    return totalCapabilities > 0 ? matches / totalCapabilities : 0;
  }

  /**
   * Calculate usage score (prefer less used roles)
   */
  private calculateUsageScore(role: Role): number {
    const usageCount = this.roleUsageHistory.get(role.name) || 0;
    // Inverse relationship: less usage = higher score
    return Math.max(0, 1 - (usageCount * 0.1));
  }

  /**
   * Update role usage history
   */
  private updateUsageHistory(roleName: string): void {
    const currentUsage = this.roleUsageHistory.get(roleName) || 0;
    this.roleUsageHistory.set(roleName, currentUsage + 1);
  }

  /**
   * Get default role when no specific role is found
   */
  private getDefaultRole(): Role {
    // Try to find a general-purpose role
    const generalRole = this.roles.find(role => 
      role.name.toLowerCase().includes('assistant') ||
      role.name.toLowerCase().includes('general') ||
      role.name.toLowerCase().includes('helper')
    );

    if (generalRole) {
      return generalRole;
    }

    // Create a fallback role if none exists
    return {
      name: 'General Assistant',
      description: 'General-purpose AI assistant for various tasks',
      capabilities: ['code review', 'documentation', 'problem solving'],
      discoveryKeywords: ['general', 'assistant', 'help'],
      implementationGuidelines: 'Provide general assistance and guidance',
      examples: [],
      metadata: {
        sourceFile: 'fallback',
        lastModified: new Date(),
        version: '1.0.0',
        tags: ['fallback', 'general'],
        priority: 1
      }
    };
  }

  /**
   * Get role recommendations for a task
   */
  async getRoleRecommendations(task: Task): Promise<Array<{ role: Role; confidence: number; reason: string }>> {
    const candidates = this.findCandidateRoles(task);
    const scoredCandidates = this.scoreCandidates(candidates, task);
    
    return scoredCandidates.slice(0, 3).map(({ role, score }) => ({
      role,
      confidence: score,
      reason: this.generateRecommendationReason(role, task)
    }));
  }

  /**
   * Generate explanation for role recommendation
   */
  private generateRecommendationReason(role: Role, task: Task): string {
    const taskKeywords = task.keywords.map(k => k.toLowerCase());
    const roleKeywords = role.discoveryKeywords.map(k => k.toLowerCase());
    
    const matchingKeywords = taskKeywords.filter(keyword =>
      roleKeywords.some(roleKeyword => roleKeyword.includes(keyword) || keyword.includes(roleKeyword))
    );

    if (matchingKeywords.length > 0) {
      return `Matches keywords: ${matchingKeywords.join(', ')}`;
    }

    const descriptionRelevance = this.calculateTextRelevance(task.description, role.description);
    if (descriptionRelevance > 0.3) {
      return `High description relevance (${Math.round(descriptionRelevance * 100)}%)`;
    }

    return `General capability match for ${task.context.projectType} projects`;
  }

  /**
   * Update roles and project knowledge
   */
  updateKnowledge(roles: Role[], projectKnowledge: ProjectKnowledge): void {
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  /**
   * Get role usage statistics
   */
  getUsageStatistics(): Record<string, number> {
    return Object.fromEntries(this.roleUsageHistory);
  }

  /**
   * Reset usage history
   */
  resetUsageHistory(): void {
    this.roleUsageHistory.clear();
  }
} 