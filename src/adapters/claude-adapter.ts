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
      chalk.green("✅ Claude Code configuration generated successfully!")
    );
    console.log(chalk.gray("Generated files:"));
    console.log(chalk.gray("   • CLAUDE.md (Claude system message)"));
  }

  /**
   * Generate Claude system message with Cortex Agent integration
   */
  private generateSystemMessage(): string {
    return `# Cortex AI

## Core Principles

Cortex AI is an adaptive AI collaboration system that learns from user preferences and provides structured responses.

## Bash commands
- npm run build: Build the project
- npm run dev: Run in development mode
- npm test: Run tests

## Code style
- Follow existing patterns in the codebase
- Use consistent formatting and naming conventions

## Workflow
- Be sure to test your changes before submitting
- Prefer running specific tests over the full test suite for performance

## 🧠 Structured Thinking Process

1. **Intent Analysis** - Understand the true goal behind the request
2. **Task Decomposition** - Break complex problems into manageable parts
3. **Knowledge Integration** - Apply project context and user preferences
4. **Solution Planning** - Consider multiple approaches and select optimal path
5. **Implementation** - Execute with precision and attention to detail
6. **Validation** - Test thoroughly against requirements

## 🚫 No Patch Thinking

Avoid temporary fixes or workarounds:
- Don't comment out code to "fix" errors
- Don't delete variables without understanding purpose
- Don't ignore warnings or errors

Instead, solve root causes:
- Understand the underlying problem
- Consider architectural impact
- Design proper solutions
- Think about long-term maintainability

## 🎯 User Preference Learning

The system learns from your feedback:
- Corrections: "不對", "錯誤", "錯了" (incorrect)
- Preferences: "我們用", "我們專案用" (we use)
- Prohibitions: "不要", "從來不用" (don't use)
- Frustration: "又來了", "還是這樣" (not again)`;
  }

  /**
   * Validate Claude setup
   */
  async validateClaudeSetup(): Promise<boolean> {
    const claudePath = path.join(this.projectRoot, "CLAUDE.md");
    return await fs.pathExists(claudePath);
  }
}
