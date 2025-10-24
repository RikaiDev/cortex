import * as fs from 'fs/promises';
import * as path from 'path';

interface TechInfo {
  language?: string;
  framework?: string;
  database?: string;
  projectType?: string;
}

interface ContextSection {
  activeTechnologies: string[];
  recentChanges: string[];
  lastUpdated: string;
}

export class ContextManager {
  private workflowDir: string;
  private contextPath: string;

  constructor(workflowDir: string) {
    this.workflowDir = workflowDir;
    this.contextPath = path.join(workflowDir, 'CONTEXT.md');
  }

  /**
   * Update context file after plan generation
   */
  async updateContext(workflowId: string): Promise<void> {
    // 1. Extract tech info from plan.md
    const planPath = path.join(this.workflowDir, 'plan.md');
    const techInfo = await this.extractTechInfo(planPath);

    if (!techInfo.language && !techInfo.framework && !techInfo.database) {
      console.log('No significant tech info found to update context');
      return;
    }

    // 2. Load or create context file
    const context = await this.loadContext();

    // 3. Update sections
    this.updateActiveTechnologies(context, techInfo, workflowId);
    this.updateRecentChanges(context, techInfo, workflowId);
    context.lastUpdated = new Date().toISOString().split('T')[0];

    // 4. Write back to file
    await this.saveContext(context);

    console.log(`✓ Updated context for workflow ${workflowId}`);
  }

  /**
   * Extract tech information from plan.md
   */
  private async extractTechInfo(planPath: string): Promise<TechInfo> {
    try {
      const content = await fs.readFile(planPath, 'utf-8');

      const extractField = (fieldName: string): string | undefined => {
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+)`, 'i');
        const match = content.match(regex);
        if (match && match[1]) {
          const value = match[1].trim();
          if (value === 'NEEDS CLARIFICATION' || value === 'N/A') {
            return undefined;
          }
          return value;
        }
        return undefined;
      };

      return {
        language: extractField('Language/Version'),
        framework: extractField('Primary Dependencies'),
        database: extractField('Storage'),
        projectType: extractField('Project Type'),
      };
    } catch (error) {
      console.warn(`Failed to extract tech info from plan: ${error}`);
      return {};
    }
  }

  /**
   * Load existing context or create new one
   */
  private async loadContext(): Promise<ContextSection> {
    try {
      const exists = await this.fileExists(this.contextPath);
      if (!exists) {
        return {
          activeTechnologies: [],
          recentChanges: [],
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }

      const content = await fs.readFile(this.contextPath, 'utf-8');
      return this.parseContext(content);
    } catch (error) {
      console.warn(`Failed to load context: ${error}`);
      return {
        activeTechnologies: [],
        recentChanges: [],
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    }
  }

  /**
   * Parse context file content
   */
  private parseContext(content: string): ContextSection {
    const context: ContextSection = {
      activeTechnologies: [],
      recentChanges: [],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    // Parse Active Technologies section
    const techMatch = content.match(/## Active Technologies\s*([\s\S]*?)(?=\n##|\n$)/);
    if (techMatch) {
      const lines = techMatch[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-')) {
          context.activeTechnologies.push(trimmed);
        }
      }
    }

    // Parse Recent Changes section
    const changesMatch = content.match(/## Recent Changes\s*([\s\S]*?)(?=\n##|\n$)/);
    if (changesMatch) {
      const lines = changesMatch[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-')) {
          context.recentChanges.push(trimmed);
        }
      }
    }

    // Parse Last Updated
    const dateMatch = content.match(/\*\*Last updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      context.lastUpdated = dateMatch[1];
    }

    return context;
  }

  /**
   * Update Active Technologies section
   */
  private updateActiveTechnologies(
    context: ContextSection,
    techInfo: TechInfo,
    workflowId: string
  ): void {
    const newTechs: string[] = [];

    // Format tech stack
    const techStack = this.formatTechStack(techInfo);
    if (techStack) {
      const entry = `- ${techStack} (${workflowId})`;
      if (!context.activeTechnologies.some(tech => tech.includes(techStack))) {
        newTechs.push(entry);
      }
    }

    // Add database separately if exists
    if (techInfo.database && techInfo.database !== 'N/A') {
      const dbEntry = `- ${techInfo.database} (${workflowId})`;
      if (!context.activeTechnologies.some(tech => tech.includes(techInfo.database!))) {
        newTechs.push(dbEntry);
      }
    }

    // Prepend new technologies
    context.activeTechnologies = [...newTechs, ...context.activeTechnologies];
  }

  /**
   * Update Recent Changes section (keep last 3)
   */
  private updateRecentChanges(
    context: ContextSection,
    techInfo: TechInfo,
    workflowId: string
  ): void {
    const techStack = this.formatTechStack(techInfo);
    let changeDescription = '';

    if (techStack && techInfo.database && techInfo.database !== 'N/A') {
      changeDescription = `${techStack} + ${techInfo.database}`;
    } else if (techStack) {
      changeDescription = techStack;
    } else if (techInfo.database && techInfo.database !== 'N/A') {
      changeDescription = techInfo.database;
    }

    if (changeDescription) {
      const entry = `- ${workflowId}: Added ${changeDescription}`;
      
      // Remove if workflow already exists in recent changes
      context.recentChanges = context.recentChanges.filter(
        change => !change.startsWith(`- ${workflowId}:`)
      );

      // Prepend new change and keep only last 3
      context.recentChanges = [entry, ...context.recentChanges].slice(0, 3);
    }
  }

  /**
   * Format tech stack string
   */
  private formatTechStack(techInfo: TechInfo): string | null {
    const parts: string[] = [];

    if (techInfo.language) {
      parts.push(techInfo.language);
    }

    if (techInfo.framework) {
      parts.push(techInfo.framework);
    }

    return parts.length > 0 ? parts.join(' + ') : null;
  }

  /**
   * Save context back to file
   */
  private async saveContext(context: ContextSection): Promise<void> {
    const projectName = path.basename(path.dirname(this.workflowDir));
    
    let content = `# ${projectName} - Project Context\n\n`;
    content += `**Last updated**: ${context.lastUpdated}\n\n`;
    content += `This file maintains project-wide context and technology decisions across workflows.\n\n`;

    // Active Technologies section
    content += `## Active Technologies\n\n`;
    if (context.activeTechnologies.length > 0) {
      content += context.activeTechnologies.join('\n') + '\n';
    } else {
      content += `No technologies recorded yet.\n`;
    }
    content += '\n';

    // Recent Changes section
    content += `## Recent Changes\n\n`;
    if (context.recentChanges.length > 0) {
      content += context.recentChanges.join('\n') + '\n';
    } else {
      content += `No recent changes recorded yet.\n`;
    }
    content += '\n';

    // Manual Additions section (preserved)
    const existingContent = await this.readExistingManualAdditions();
    if (existingContent) {
      content += existingContent;
    } else {
      content += `## Manual Additions\n\n`;
      content += `<!-- Add any manual notes, decisions, or context here -->\n`;
      content += `<!-- This section is preserved across automatic updates -->\n\n`;
    }

    await fs.writeFile(this.contextPath, content, 'utf-8');
  }

  /**
   * Read existing manual additions to preserve them
   */
  private async readExistingManualAdditions(): Promise<string | null> {
    try {
      const exists = await this.fileExists(this.contextPath);
      if (!exists) {
        return null;
      }

      const content = await fs.readFile(this.contextPath, 'utf-8');
      const match = content.match(/## Manual Additions\s*([\s\S]*)/);
      if (match) {
        return `## Manual Additions\n${match[1]}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

