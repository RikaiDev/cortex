/**
 * Role Manager - User Role Extension System
 *
 * Allows users to create, manage, and extend custom roles for AI collaboration.
 */

import fs from "fs-extra";
import { join } from "path";
import { glob } from "glob";
import chalk from "chalk";
import { Role, Example } from "./types.js";

export interface RoleTemplate {
  name: string;
  description: string;
  capabilities: string[];
  keywords: string[];
  implementationGuidelines: string;
  examples: Example[];
  version: string;
  author?: string;
  customFields?: Record<string, any>;
}

export interface RoleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class RoleManager {
  private projectRoot: string;
  private rolesPath: string;
  private customRolesPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.rolesPath = join(projectRoot, "docs", "ai-collaboration", "roles");
    this.customRolesPath = join(this.rolesPath, "custom");
  }

  /**
   * Create a new custom role from template
   */
  async createCustomRole(template: RoleTemplate): Promise<void> {
    console.log(chalk.blue(`🎭 Creating custom role: ${template.name}`));

    // Validate template
    const validation = this.validateRoleTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Invalid role template: ${validation.errors.join(", ")}`);
    }

    // Ensure custom roles directory exists
    await fs.ensureDir(this.customRolesPath);

    // Generate role filename
    const fileName = template.name.toLowerCase().replace(/\s+/g, "-") + ".md";
    const filePath = join(this.customRolesPath, fileName);

    // Check if role already exists
    if (await fs.pathExists(filePath)) {
      throw new Error(`Role "${template.name}" already exists`);
    }

    // Generate role content
    const roleContent = this.generateRoleMarkdown(template);

    // Save role file
    await fs.writeFile(filePath, roleContent);

    console.log(chalk.green(`✅ Custom role created: ${fileName}`));

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.log(chalk.yellow("⚠️ Warnings:"));
      validation.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  - ${warning}`));
      });
    }
  }

  /**
   * List all available roles (core + custom)
   */
  async listRoles(): Promise<{ coreRoles: string[]; customRoles: string[] }> {
    const coreRoles = await glob("*.md", {
      cwd: this.rolesPath,
      ignore: ["README.md", "custom/**"],
    });

    let customRoles: string[] = [];
    if (await fs.pathExists(this.customRolesPath)) {
      customRoles = await glob("*.md", { cwd: this.customRolesPath });
    }

    return {
      coreRoles: coreRoles.map((f) => f.replace(".md", "")),
      customRoles: customRoles.map((f) => f.replace(".md", "")),
    };
  }

  /**
   * Load a role by name (searches core and custom)
   */
  async loadRole(roleName: string): Promise<Role | null> {
    const fileName = roleName.toLowerCase().replace(/\s+/g, "-") + ".md";

    // Check custom roles first
    const customPath = join(this.customRolesPath, fileName);
    if (await fs.pathExists(customPath)) {
      return this.parseRoleFile(customPath);
    }

    // Check core roles
    const corePath = join(this.rolesPath, fileName);
    if (await fs.pathExists(corePath)) {
      return this.parseRoleFile(corePath);
    }

    return null;
  }

  /**
   * Update an existing custom role
   */
  async updateCustomRole(
    roleName: string,
    updates: Partial<RoleTemplate>
  ): Promise<void> {
    const fileName = roleName.toLowerCase().replace(/\s+/g, "-") + ".md";
    const filePath = join(this.customRolesPath, fileName);

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Custom role "${roleName}" not found`);
    }

    // Load existing role
    const existingRole = await this.loadRole(roleName);
    if (!existingRole) {
      throw new Error(`Failed to load existing role: ${roleName}`);
    }

    // Merge updates
    const updatedTemplate: RoleTemplate = {
      name: updates.name || existingRole.name,
      description: updates.description || existingRole.description,
      capabilities: updates.capabilities || existingRole.capabilities,
      keywords: updates.keywords || existingRole.discoveryKeywords,
      implementationGuidelines:
        updates.implementationGuidelines ||
        existingRole.implementationGuidelines,
      examples: updates.examples || existingRole.examples,
      version: updates.version || existingRole.metadata.version,
      author: updates.author || existingRole.metadata.author,
      customFields: updates.customFields || existingRole.metadata.customFields,
    };

    // Validate updated template
    const validation = this.validateRoleTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Invalid role update: ${validation.errors.join(", ")}`);
    }

    // Generate updated content
    const roleContent = this.generateRoleMarkdown(updatedTemplate);

    // Save updated role
    await fs.writeFile(filePath, roleContent);

    console.log(chalk.green(`✅ Custom role updated: ${fileName}`));
  }

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleName: string): Promise<void> {
    const fileName = roleName.toLowerCase().replace(/\s+/g, "-") + ".md";
    const filePath = join(this.customRolesPath, fileName);

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Custom role "${roleName}" not found`);
    }

    await fs.remove(filePath);
    console.log(chalk.green(`✅ Custom role deleted: ${fileName}`));
  }

  /**
   * Export role as template JSON
   */
  async exportRoleTemplate(roleName: string): Promise<RoleTemplate> {
    const role = await this.loadRole(roleName);
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    return {
      name: role.name,
      description: role.description,
      capabilities: role.capabilities,
      keywords: role.discoveryKeywords,
      implementationGuidelines: role.implementationGuidelines,
      examples: role.examples,
      version: role.metadata.version,
      author: role.metadata.author,
      customFields: role.metadata.customFields,
    };
  }

  /**
   * Import role from template JSON
   */
  async importRoleTemplate(template: RoleTemplate): Promise<void> {
    await this.createCustomRole(template);
  }

  /**
   * Validate role template
   */
  private validateRoleTemplate(template: RoleTemplate): RoleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields validation
    if (!template.name || template.name.trim().length === 0) {
      errors.push("Role name is required");
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push("Role description is required");
    }

    if (!template.capabilities || template.capabilities.length === 0) {
      errors.push("At least one capability is required");
    }

    if (!template.keywords || template.keywords.length === 0) {
      warnings.push("Consider adding keywords for better role discovery");
    }

    // Content quality validation
    if (template.name && template.name.length > 50) {
      warnings.push("Role name is quite long, consider shortening");
    }

    if (template.description && template.description.length > 200) {
      warnings.push(
        "Role description is quite long, consider making it more concise"
      );
    }

    if (template.capabilities && template.capabilities.length > 10) {
      warnings.push("Too many capabilities might make the role unfocused");
    }

    if (template.keywords && template.keywords.length > 20) {
      warnings.push("Too many keywords might reduce discovery effectiveness");
    }

    // Suggestions
    if (!template.examples || template.examples.length === 0) {
      suggestions.push("Add examples to demonstrate role usage");
    }

    if (!template.implementationGuidelines) {
      suggestions.push("Add implementation guidelines for better AI behavior");
    }

    if (!template.version) {
      suggestions.push("Consider adding version information for role tracking");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Generate role markdown content from template
   */
  private generateRoleMarkdown(template: RoleTemplate): string {
    const frontmatter = {
      name: template.name,
      description: template.description,
      capabilities: template.capabilities,
      keywords: template.keywords,
      version: template.version || "1.0.0",
      ...(template.author && { author: template.author }),
      ...(template.customFields && { ...template.customFields }),
    };

    let content = `---\n`;
    content += `name: "${frontmatter.name}"\n`;
    content += `description: "${frontmatter.description}"\n`;
    content += `capabilities:\n`;
    frontmatter.capabilities.forEach((cap) => {
      content += `  - "${cap}"\n`;
    });
    content += `keywords:\n`;
    frontmatter.keywords.forEach((keyword) => {
      content += `  - "${keyword}"\n`;
    });
    content += `version: "${frontmatter.version}"\n`;

    if (frontmatter.author) {
      content += `author: "${frontmatter.author}"\n`;
    }

    // Add custom fields
    if (template.customFields) {
      Object.entries(template.customFields).forEach(([key, value]) => {
        content += `${key}: ${JSON.stringify(value)}\n`;
      });
    }

    content += `---\n\n`;

    // Main content
    content += `# ${template.name}\n\n`;
    content += `## Description\n\n${template.description}\n\n`;

    // Capabilities
    content += `## Capabilities\n\n`;
    template.capabilities.forEach((cap) => {
      content += `- **${cap}**\n`;
    });
    content += `\n`;

    // Implementation Guidelines
    if (template.implementationGuidelines) {
      content += `## Implementation Guidelines\n\n${template.implementationGuidelines}\n\n`;
    }

    // Examples
    if (template.examples && template.examples.length > 0) {
      content += `## Examples\n\n`;
      template.examples.forEach((example, index) => {
        content += `### Example ${index + 1}: ${example.title}\n\n`;
        content += `**Description:** ${example.description}\n\n`;
        content += `**Input:**\n\`\`\`\n${example.input}\n\`\`\`\n\n`;
        content += `**Output:**\n\`\`\`\n${example.output}\n\`\`\`\n\n`;
        if (example.context) {
          content += `**Context:** ${example.context}\n\n`;
        }
      });
    }

    // Discovery Keywords
    content += `## Discovery Keywords\n\n`;
    template.keywords.forEach((keyword) => {
      content += `- ${keyword}\n`;
    });

    return content;
  }

  /**
   * Parse role file and extract Role object
   */
  private async parseRoleFile(filePath: string): Promise<Role> {
    const content = await fs.readFile(filePath, "utf-8");

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error(`Invalid role file format: ${filePath}`);
    }

    const frontmatterText = frontmatterMatch[1];
    const bodyContent = content.substring(frontmatterMatch[0].length);

    // Parse frontmatter (simplified YAML parsing)
    const frontmatter: any = {};
    const lines = frontmatterText.split("\n");
    let currentKey = "";
    let currentArray: string[] = [];
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("- ")) {
        // Array item
        if (inArray) {
          currentArray.push(trimmed.substring(2).replace(/"/g, ""));
        }
      } else if (trimmed.includes(":")) {
        // Key-value pair
        if (inArray && currentKey) {
          frontmatter[currentKey] = currentArray;
          currentArray = [];
          inArray = false;
        }

        const [key, ...valueParts] = trimmed.split(":");
        const value = valueParts.join(":").trim();

        if (value === "") {
          // Start of array
          currentKey = key.trim();
          inArray = true;
          currentArray = [];
        } else {
          // Simple value
          frontmatter[key.trim()] = value.replace(/"/g, "");
        }
      }
    }

    // Handle last array
    if (inArray && currentKey) {
      frontmatter[currentKey] = currentArray;
    }

    // Extract examples from body (simplified)
    const examples: Example[] = [];
    // This is a simplified implementation - in reality, you'd want more robust parsing

    return {
      name: frontmatter.name || "Unknown Role",
      description: frontmatter.description || "",
      capabilities: frontmatter.capabilities || [],
      discoveryKeywords: frontmatter.keywords || [],
      implementationGuidelines: frontmatter.implementationGuidelines || "",
      examples,
      metadata: {
        sourceFile: filePath,
        lastModified: new Date(),
        version: frontmatter.version || "1.0.0",
        tags: [],
        priority: 1,
        author: frontmatter.author,
        customFields: frontmatter.customFields,
      },
    };
  }

  /**
   * Get role usage statistics
   */
  async getRoleStats(): Promise<{
    totalRoles: number;
    coreRoles: number;
    customRoles: number;
    recentlyCreated: string[];
  }> {
    const { coreRoles, customRoles } = await this.listRoles();

    // Get recently created custom roles
    const recentlyCreated: string[] = [];
    if (await fs.pathExists(this.customRolesPath)) {
      const files = await fs.readdir(this.customRolesPath);
      for (const file of files.slice(0, 3)) {
        // Last 3 created
        if (file.endsWith(".md")) {
          recentlyCreated.push(file.replace(".md", ""));
        }
      }
    }

    return {
      totalRoles: coreRoles.length + customRoles.length,
      coreRoles: coreRoles.length,
      customRoles: customRoles.length,
      recentlyCreated,
    };
  }
}

// CLI integration
export async function createRoleInteractively(
  projectRoot: string
): Promise<void> {
  const roleManager = new RoleManager(projectRoot);

  console.log(chalk.blue("🎭 Interactive Role Creator"));
  console.log(chalk.gray("Create a new custom role for AI collaboration\n"));

  // This would integrate with a CLI prompting library
  // For now, showing the structure
  console.log("Use roleManager.createCustomRole(template) with:");
  console.log("- name: string");
  console.log("- description: string");
  console.log("- capabilities: string[]");
  console.log("- keywords: string[]");
  console.log("- implementationGuidelines: string");
  console.log("- examples: Example[]");
}

export async function listAllRoles(projectRoot: string): Promise<void> {
  const roleManager = new RoleManager(projectRoot);
  const { coreRoles, customRoles } = await roleManager.listRoles();
  const stats = await roleManager.getRoleStats();

  console.log(chalk.blue("🎭 Available Roles\n"));

  console.log(chalk.cyan("📚 Core Roles:"));
  coreRoles.forEach((role) => {
    console.log(chalk.gray(`  - ${role}`));
  });

  console.log(chalk.cyan("\n🎨 Custom Roles:"));
  if (customRoles.length > 0) {
    customRoles.forEach((role) => {
      console.log(chalk.gray(`  - ${role}`));
    });
  } else {
    console.log(chalk.gray("  No custom roles created yet"));
  }

  console.log(chalk.yellow(`\n📊 Statistics:`));
  console.log(chalk.gray(`  Total roles: ${stats.totalRoles}`));
  console.log(chalk.gray(`  Core roles: ${stats.coreRoles}`));
  console.log(chalk.gray(`  Custom roles: ${stats.customRoles}`));
}
