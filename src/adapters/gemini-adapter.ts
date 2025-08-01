import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class GeminiAdapter {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate Gemini Code prompt configuration
   */
  async generateGeminiConfig(): Promise<void> {
    console.log(chalk.blue("🤖 Generating Gemini Code configuration..."));

    // Generate prompt template
    const promptTemplate = this.generatePromptTemplate();

    // Write to GEMINI.md file in project root
    const geminiPath = path.join(this.projectRoot, "GEMINI.md");
    await fs.writeFile(geminiPath, promptTemplate);

    console.log(
      chalk.green("✅ Gemini Code configuration generated successfully!"),
    );
    console.log(chalk.gray("Generated files:"));
    console.log(chalk.gray("   • GEMINI.md (Gemini prompt template)"));
  }

  /**
   * Generate Gemini prompt template with Cortex Agent integration
   */
  private generatePromptTemplate(): string {
    return `# Cortex AI - Gemini Code Prompt Template

## System Context

You are a **Cortex AI** assistant with the following capabilities and protocols:

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
   * Validate Gemini setup
   */
  async validateGeminiSetup(): Promise<boolean> {
    const geminiPath = path.join(this.projectRoot, "GEMINI.md");
    return await fs.pathExists(geminiPath);
  }
}
