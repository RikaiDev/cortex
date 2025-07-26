import { Role, RoleDiscoveryResult, CodePattern } from './types.js';
import { marked } from 'marked';
import matter from 'gray-matter';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class DynamicRoleDiscovery {
  private rolesDirectory: string;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.rolesDirectory = path.join(projectRoot, 'docs', 'ai-collaboration', 'roles');
  }

  /**
   * Scan project documentation and discover roles
   */
  async scanProjectDocs(): Promise<Role[]> {
    try {
      // Ensure roles directory exists
      await fs.ensureDir(this.rolesDirectory);
      
      // Find all markdown files in roles directory
      const roleFiles = await glob('**/*.md', {
        cwd: this.rolesDirectory,
        absolute: true
      });

      const roles: Role[] = [];

      for (const file of roleFiles) {
        try {
          const role = await this.parseRoleDefinition(file);
          if (role) {
            roles.push(role);
          }
        } catch (error) {
          console.warn(`Failed to parse role file: ${file}`, error);
        }
      }

      return roles;
    } catch (error) {
      console.error('Error scanning project docs:', error);
      return [];
    }
  }

  /**
   * Parse markdown file and extract role definition
   */
  async parseRoleDefinition(filePath: string): Promise<Role | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);
      
      // Parse markdown to extract structured information
      const parsed = marked.parse(markdownContent, {
        mangle: false,
        headerIds: false
      });
      
      // Extract role information from markdown
      const roleInfo = this.extractRoleInfo(parsed, data);
      
      if (!roleInfo.name || !roleInfo.description) {
        return null;
      }

      const stats = await fs.stat(filePath);
      
      return {
        name: roleInfo.name,
        description: roleInfo.description,
        capabilities: roleInfo.capabilities || [],
        discoveryKeywords: roleInfo.keywords || [],
        implementationGuidelines: roleInfo.guidelines || '',
        examples: roleInfo.examples || [],
        metadata: {
          sourceFile: path.relative(this.projectRoot, filePath),
          lastModified: stats.mtime,
          version: roleInfo.version || '1.0.0',
          tags: roleInfo.tags || [],
          priority: roleInfo.priority || 1
        }
      };
    } catch (error) {
      console.error(`Error parsing role definition: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Extract role information from parsed markdown
   */
  private extractRoleInfo(parsedMarkdown: string, frontMatter: any): any {
    const info: any = {
      name: frontMatter.name || frontMatter.title,
      description: frontMatter.description,
      capabilities: frontMatter.capabilities || [],
      keywords: frontMatter.keywords || frontMatter.discoveryKeywords || [],
      guidelines: frontMatter.implementationGuidelines || frontMatter.guidelines || '',
      examples: frontMatter.examples || [],
      version: frontMatter.version,
      tags: frontMatter.tags || [],
      priority: frontMatter.priority
    };

    // Extract from markdown content if not in front matter
    if (!info.name) {
      const nameMatch = parsedMarkdown.match(/^#\s*Role:\s*(.+)$/m);
      if (nameMatch) {
        info.name = nameMatch[1].trim();
      }
    }

    if (!info.description) {
      const descMatch = parsedMarkdown.match(/^##\s*Description\s*\n+(.+?)(?=\n##|\n$)/s);
      if (descMatch) {
        info.description = descMatch[1].trim();
      }
    }

    // Extract capabilities
    if (!info.capabilities.length) {
      const capabilitiesMatch = parsedMarkdown.match(/^##\s*Capabilities\s*\n+((?:-|\*)\s*.+\n?)+/m);
      if (capabilitiesMatch) {
        info.capabilities = capabilitiesMatch[1]
          .split('\n')
          .filter(line => line.trim().match(/^[-*]\s+/))
          .map(line => line.replace(/^[-*]\s+/, '').trim());
      }
    }

    // Extract keywords
    if (!info.keywords.length) {
      const keywordsMatch = parsedMarkdown.match(/^##\s*Keywords\s*\n+(.+?)(?=\n##|\n$)/s);
      if (keywordsMatch) {
        info.keywords = keywordsMatch[1]
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      }
    }

    return info;
  }

  /**
   * Analyze project patterns and extract coding conventions
   */
  async analyzeProjectPatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    
    try {
      // Analyze source code structure
      const sourceFiles = await glob('src/**/*.{ts,js,tsx,jsx}', {
        cwd: this.projectRoot,
        absolute: true
      });

      // Extract naming conventions
      const namingPatterns = await this.extractNamingPatterns(sourceFiles);
      patterns.push(...namingPatterns);

      // Extract architectural patterns
      const architecturalPatterns = await this.extractArchitecturalPatterns(sourceFiles);
      patterns.push(...architecturalPatterns);

    } catch (error) {
      console.error('Error analyzing project patterns:', error);
    }

    return patterns;
  }

  /**
   * Extract naming conventions from source files
   */
  private async extractNamingPatterns(_files: string[]): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    
    // This is a simplified implementation
    // In a real implementation, you would analyze actual code patterns
    
    patterns.push({
      name: 'camelCase Functions',
      description: 'Functions use camelCase naming convention',
      examples: ['getUserData', 'processInput', 'validateForm'],
      frequency: 0.8,
      context: ['function declarations', 'method names']
    });

    patterns.push({
      name: 'PascalCase Classes',
      description: 'Classes use PascalCase naming convention',
      examples: ['UserService', 'DataProcessor', 'ApiClient'],
      frequency: 0.9,
      context: ['class declarations', 'interface names']
    });

    return patterns;
  }

  /**
   * Extract architectural patterns from source files
   */
  private async extractArchitecturalPatterns(_files: string[]): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    
    // Simplified implementation
    patterns.push({
      name: 'Service Layer Pattern',
      description: 'Business logic separated into service classes',
      examples: ['UserService', 'AuthService', 'DataService'],
      frequency: 0.7,
      context: ['service classes', 'business logic']
    });

    patterns.push({
      name: 'Repository Pattern',
      description: 'Data access abstracted through repository interfaces',
      examples: ['UserRepository', 'ProductRepository'],
      frequency: 0.6,
      context: ['data access', 'repository classes']
    });

    return patterns;
  }

  /**
   * Generate comprehensive discovery result
   */
  async discover(): Promise<RoleDiscoveryResult> {
    const roles = await this.scanProjectDocs();
    const patterns = await this.analyzeProjectPatterns();
    
    const recommendations = this.generateRecommendations(roles, patterns);
    
    return {
      roles,
      knowledge: {
        architecture: [],
        codingPatterns: patterns,
        technologyStack: [],
        conventions: [],
        constraints: []
      },
      patterns,
      recommendations
    };
  }

  /**
   * Generate recommendations based on discovered roles and patterns
   */
  private generateRecommendations(roles: Role[], patterns: CodePattern[]): string[] {
    const recommendations: string[] = [];

    if (roles.length === 0) {
      recommendations.push(
        'Create your first role definition in docs/ai-collaboration/roles/',
        'Start with a general-purpose role like "Code Assistant" or "Architecture Designer"'
      );
    }

    if (patterns.length < 3) {
      recommendations.push(
        'Add more code examples to help Cortex understand your coding patterns',
        'Consider documenting your architectural decisions'
      );
    }

    if (roles.length > 0) {
      recommendations.push(
        `Discovered ${roles.length} roles - Cortex is ready to assist with specialized tasks`,
        'Try asking questions related to your defined roles'
      );
    }

    return recommendations;
  }
} 