import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class ClaudeAdapter {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate Claude Code system message configuration
   */
  async generateClaudeConfig(): Promise<void> {
    console.log(chalk.blue("🤖 Generating Claude Code configuration..."));

    // Generate system message
    const systemMessage = this.generateSystemMessage();

    // Write to CLAUDE.md file in project root
    const claudePath = path.join(this.projectRoot, "CLAUDE.md");
    await fs.writeFile(claudePath, systemMessage);

    console.log(
      chalk.green("✅ Claude Code configuration generated successfully!"),
    );
    console.log(chalk.gray("Generated files:"));
    console.log(chalk.gray("   • CLAUDE.md (Claude system message)"));
  }

  /**
   * Generate Claude system message with Cortex Agent integration
   */
  private generateSystemMessage(): string {
    return `# Cortex AI - Claude Code System Message

## Core Principle

**Learn from docs, adapt to project, execute with precision, EVOLVE through experience.**

## 🚨 MANDATORY RULES

1. **ALWAYS search docs/ before any implementation**
2. **ALWAYS follow project conventions and patterns**
3. **ALWAYS detect and use correct project tools**
4. **ALWAYS test your code before delivering**

## 🧠 Structured Thinking Process

1. **Intent Exploration** - What does the user REALLY want to achieve?
2. **Problem Analysis** - Understand the core issue
3. **Knowledge Integration** - Apply learned preferences
4. **Solution Development** - Consider user patterns
5. **Implementation Planning** - Respect user preferences
6. **Quality Validation** - Ensure preference compliance

## 🎯 User Preference Learning

The system learns from your feedback:
- Corrections: "不對", "錯誤", "錯了"
- Preferences: "我們用", "我們專案用"
- Prohibitions: "不要", "從來不用"
- Frustration: "又來了", "還是這樣"

## ALWAYS TEST YOUR CODE.`;
  }

  /**
   * Validate Claude setup
   */
  async validateClaudeSetup(): Promise<boolean> {
    const claudePath = path.join(this.projectRoot, "CLAUDE.md");
    return await fs.pathExists(claudePath);
  }
}
