/**
 * Role Manager
 *
 * This module manages AI collaboration roles, enabling AI systems to act
 * in specialized roles with specific capabilities and knowledge.
 */

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

/**
 * Role definition interface
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  skills: string[];
  examples: string[];
  patterns: string[];
  executionSteps: string[];
  compatibleRoles: string[];
  incompatibleRoles: string[];
}

/**
 * Role mapping interface
 */
export interface RoleMapping {
  roleId: string;
  taskId: string;
  context: Record<string, any>;
  assignmentReason: string;
  capabilities: string[];
}

/**
 * Role assignment result interface
 */
export interface RoleAssignmentResult {
  mappings: RoleMapping[];
  primaryRole: string;
  secondaryRoles: string[];
  executionPlan: string;
}

/**
 * Role execution result interface
 */
export interface RoleExecutionResult {
  roleId: string;
  taskId: string;
  result: string;
  insights: string[];
  nextSteps: string[];
}

/**
 * Role manager for managing AI collaboration roles
 */
export class RoleManager {
  private projectRoot: string;
  private rolesPath: string;
  private roles: Map<string, Role>;

  /**
   * Creates a new instance of the RoleManager class
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.rolesPath = path.join(
      projectRoot,
      "docs",
      "ai-collaboration",
      "roles"
    );
    this.roles = new Map();
  }

  /**
   * Initialize the role manager
   */
  async initialize(): Promise<void> {
    // Load roles from files
    await this.loadRoles();
  }

  /**
   * Load roles from markdown files
   */
  private async loadRoles(): Promise<void> {
    try {
      // Ensure roles path exists
      await fs.ensureDir(this.rolesPath);

      // Find all role markdown files
      const files = await glob("*.md", { cwd: this.rolesPath });

      for (const file of files) {
        // Skip README.md
        if (file.toLowerCase() === "readme.md") {
          continue;
        }

        const filePath = path.join(this.rolesPath, file);
        const content = await fs.readFile(filePath, "utf-8");

        // Parse role from markdown content
        const role = this.parseRoleMarkdown(content, file);

        if (role) {
          this.roles.set(role.id, role);
        }
      }

      console.log(`Loaded ${this.roles.size} roles`);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  }

  /**
   * Parse role from markdown content
   * @param content - Markdown content
   * @param filename - Markdown filename
   * @returns Parsed role or null if parsing failed
   */
  private parseRoleMarkdown(content: string, filename: string): Role | null {
    try {
      // Default values
      const role: Role = {
        id: path.basename(filename, ".md"),
        name: "",
        description: "",
        capabilities: [],
        skills: [],
        examples: [],
        patterns: [],
        executionSteps: [],
        compatibleRoles: [],
        incompatibleRoles: [],
      };

      // Extract title (name)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        role.name = titleMatch[1];
      }

      // Extract description
      const descMatch = content.match(/^##\s+Description\s*\n+([^#]+)/im);
      if (descMatch) {
        role.description = descMatch[1].trim();
      }

      // Extract capabilities
      const capMatch = content.match(/^##\s+Capabilities\s*\n+([^#]+)/im);
      if (capMatch) {
        role.capabilities = capMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim());
      }

      // Extract skills
      const skillsMatch = content.match(/^##\s+Skills\s*\n+([^#]+)/im);
      if (skillsMatch) {
        role.skills = skillsMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim());
      }

      // Extract examples
      const examplesMatch = content.match(/^##\s+Examples\s*\n+([^#]+)/im);
      if (examplesMatch) {
        role.examples = examplesMatch[1]
          .split("\n\n")
          .filter((block) => block.trim() !== "");
      }

      // Extract patterns
      const patternsMatch = content.match(/^##\s+Patterns\s*\n+([^#]+)/im);
      if (patternsMatch) {
        role.patterns = patternsMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim());
      }

      // Extract execution steps
      const executionMatch = content.match(
        /^##\s+Execution\s+Steps\s*\n+([^#]+)/im
      );
      if (executionMatch) {
        role.executionSteps = executionMatch[1]
          .split("\n")
          .filter((line) => /^\d+\./.test(line.trim()))
          .map((line) => line.trim());
      }

      // Extract compatible roles
      const compatibleMatch = content.match(
        /^##\s+Compatible\s+Roles\s*\n+([^#]+)/im
      );
      if (compatibleMatch) {
        role.compatibleRoles = compatibleMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim());
      }

      // Extract incompatible roles
      const incompatibleMatch = content.match(
        /^##\s+Incompatible\s+Roles\s*\n+([^#]+)/im
      );
      if (incompatibleMatch) {
        role.incompatibleRoles = incompatibleMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim());
      }

      return role;
    } catch (error) {
      console.error(`Error parsing role from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Get all available roles
   * @returns Map of roles
   */
  getAllRoles(): Map<string, Role> {
    return new Map(this.roles);
  }

  /**
   * Get a specific role by ID
   * @param roleId - Role ID
   * @returns Role or null if not found
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Assign roles to tasks based on task requirements and context
   * @param tasks - Array of tasks
   * @param context - Task context
   * @returns Role assignment result
   */
  assignRoles(
    tasks: Array<{ id: string; name: string; description: string }>,
    context: Record<string, any> = {}
  ): RoleAssignmentResult {
    // Initialize mappings
    const mappings: RoleMapping[] = [];

    for (const task of tasks) {
      // Find most suitable role for the task
      const matchingRole = this.findMatchingRole(task, context);

      if (matchingRole) {
        mappings.push({
          roleId: matchingRole.id,
          taskId: task.id,
          context,
          assignmentReason: `Role ${matchingRole.name} matches task ${task.name} based on capabilities`,
          capabilities: matchingRole.capabilities,
        });
      }
    }

    // Determine primary role
    const primaryRole = this.determinePrimaryRole(mappings);

    // Determine secondary roles
    const secondaryRoles = this.determineSecondaryRoles(mappings, primaryRole);

    // Generate execution plan
    const executionPlan = this.generateExecutionPlan(
      mappings,
      primaryRole,
      secondaryRoles
    );

    return {
      mappings,
      primaryRole,
      secondaryRoles,
      executionPlan,
    };
  }

  /**
   * Find a matching role for a task
   * @param task - Task to match
   * @param context - Task context
   * @returns Matching role or null if no match found
   */
  private findMatchingRole(
    task: { id: string; name: string; description: string },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Record<string, any>
  ): Role | null {
    // Match roles based on task name and description
    const taskText = `${task.name} ${task.description}`.toLowerCase();
    let bestRole: Role | null = null;
    let bestScore = 0;

    for (const [_, role] of this.roles) {
      let score = 0;

      // Check if task name or description contains role name
      if (taskText.includes(role.name.toLowerCase())) {
        score += 3;
      }

      // Check if task matches role capabilities
      for (const capability of role.capabilities) {
        if (taskText.includes(capability.toLowerCase())) {
          score += 2;
        }
      }

      // Check if task matches role skills
      for (const skill of role.skills) {
        if (taskText.includes(skill.toLowerCase())) {
          score += 1;
        }
      }

      // Update best match if better score
      if (score > bestScore) {
        bestScore = score;
        bestRole = role;
      }
    }

    // If no role matches well, use default "code-assistant" role if available
    if (bestScore === 0) {
      return this.roles.get("code-assistant") || null;
    }

    return bestRole;
  }

  /**
   * Determine the primary role from mappings
   * @param mappings - Role mappings
   * @returns Primary role ID
   */
  private determinePrimaryRole(mappings: RoleMapping[]): string {
    if (mappings.length === 0) {
      return "code-assistant"; // Default role
    }

    // Count role occurrences
    const roleCounts = new Map<string, number>();
    for (const mapping of mappings) {
      const count = roleCounts.get(mapping.roleId) || 0;
      roleCounts.set(mapping.roleId, count + 1);
    }

    // Find most common role
    let primaryRole = "code-assistant";
    let maxCount = 0;

    for (const [roleId, count] of roleCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        primaryRole = roleId;
      }
    }

    return primaryRole;
  }

  /**
   * Determine secondary roles from mappings
   * @param mappings - Role mappings
   * @param primaryRole - Primary role ID
   * @returns Array of secondary role IDs
   */
  private determineSecondaryRoles(
    mappings: RoleMapping[],
    primaryRole: string
  ): string[] {
    // Get unique roles excluding primary
    const secondaryRoleSet = new Set<string>();
    for (const mapping of mappings) {
      if (mapping.roleId !== primaryRole) {
        secondaryRoleSet.add(mapping.roleId);
      }
    }

    return Array.from(secondaryRoleSet);
  }

  /**
   * Generate an execution plan for the roles
   * @param mappings - Role mappings
   * @param primaryRole - Primary role ID
   * @param secondaryRoles - Secondary role IDs
   * @returns Execution plan string
   */
  private generateExecutionPlan(
    mappings: RoleMapping[],
    primaryRole: string,
    secondaryRoles: string[]
  ): string {
    const primary = this.roles.get(primaryRole);
    if (!primary) {
      return "No execution plan available";
    }

    let plan = `Primary role: ${primary.name}\n`;
    plan += "Execution steps:\n";

    // Add execution steps from primary role
    for (const step of primary.executionSteps) {
      plan += `${step}\n`;
    }

    // Add role handoff steps if there are secondary roles
    if (secondaryRoles.length > 0) {
      plan += "\nRole handoffs:\n";

      for (const roleId of secondaryRoles) {
        const role = this.roles.get(roleId);
        if (role) {
          // Find tasks for this role
          const tasks = mappings
            .filter((m) => m.roleId === roleId)
            .map((m) => m.taskId);

          plan += `- Handoff to ${role.name} for tasks: ${tasks.join(", ")}\n`;
        }
      }
    }

    return plan;
  }

  /**
   * Execute a role for a specific task
   * @param roleId - Role ID
   * @param taskId - Task ID
   * @param context - Task context
   * @returns Role execution result
   */
  async executeRole(
    roleId: string,
    taskId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Record<string, any> = {}
  ): Promise<RoleExecutionResult> {
    // Get the role
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    // In a real implementation, this would execute the role's logic
    // For now, we'll return a simulated result
    return {
      roleId,
      taskId,
      result: `Simulated execution of role ${role.name} for task ${taskId}`,
      insights: [
        `${role.name} analyzed the task according to its capabilities`,
        `${role.name} applied relevant patterns from its knowledge base`,
      ],
      nextSteps: [
        "Continue with the next task",
        "Review the results of this task",
      ],
    };
  }

  /**
   * Generate a complete markdown template for a new role
   * @param roleId - Role ID
   * @param name - Role name
   * @param description - Role description
   * @returns Generated markdown content
   */
  generateRoleTemplate(
    roleId: string,
    name: string,
    description: string
  ): string {
    return `# ${name}

## Description

${description}

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Skills

- Skill 1
- Skill 2
- Skill 3

## Examples

Example 1: This is an example of how this role would approach a task.

Example 2: This is another example with different context.

## Patterns

- Pattern 1: Description of pattern 1
- Pattern 2: Description of pattern 2

## Execution Steps

1. First step in the execution process
2. Second step in the execution process
3. Third step in the execution process

## Compatible Roles

- Role 1
- Role 2

## Incompatible Roles

- Role 3
- Role 4
`;
  }

  /**
   * Create a new role
   * @param roleId - Role ID
   * @param name - Role name
   * @param description - Role description
   * @param capabilities - Role capabilities
   * @returns Created role
   */
  async createRole(
    roleId: string,
    name: string,
    description: string,
    capabilities: string[] = []
  ): Promise<Role> {
    // Check if role already exists
    if (this.roles.has(roleId)) {
      throw new Error(`Role ${roleId} already exists`);
    }

    // Create role object
    const role: Role = {
      id: roleId,
      name,
      description,
      capabilities,
      skills: [],
      examples: [],
      patterns: [],
      executionSteps: [],
      compatibleRoles: [],
      incompatibleRoles: [],
    };

    // Generate markdown content
    const markdown = this.generateRoleTemplate(roleId, name, description);

    // Save to file
    const filePath = path.join(this.rolesPath, `${roleId}.md`);
    await fs.writeFile(filePath, markdown);

    // Add to roles map
    this.roles.set(roleId, role);

    return role;
  }

  /**
   * Update an existing role
   * @param roleId - Role ID
   * @param updates - Role updates
   * @returns Updated role
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    // Check if role exists
    const existingRole = this.roles.get(roleId);
    if (!existingRole) {
      throw new Error(`Role ${roleId} not found`);
    }

    // Update role object
    const updatedRole: Role = {
      ...existingRole,
      ...updates,
    };

    // Read existing markdown
    const filePath = path.join(this.rolesPath, `${roleId}.md`);
    let markdown = await fs.readFile(filePath, "utf-8");

    // Update markdown sections
    if (updates.name) {
      markdown = markdown.replace(/^#\s+.+$/m, `# ${updates.name}`);
    }

    if (updates.description) {
      const descSection = markdown.match(/^##\s+Description\s*\n+([^#]+)/im);
      if (descSection) {
        markdown = markdown.replace(
          descSection[0],
          `## Description\n\n${updates.description}\n\n`
        );
      }
    }

    // Save updated markdown
    await fs.writeFile(filePath, markdown);

    // Update roles map
    this.roles.set(roleId, updatedRole);

    return updatedRole;
  }

  /**
   * Delete a role
   * @param roleId - Role ID
   * @returns True if role was deleted
   */
  async deleteRole(roleId: string): Promise<boolean> {
    // Check if role exists
    if (!this.roles.has(roleId)) {
      return false;
    }

    // Delete file
    const filePath = path.join(this.rolesPath, `${roleId}.md`);
    await fs.unlink(filePath);

    // Remove from roles map
    this.roles.delete(roleId);

    return true;
  }
}
