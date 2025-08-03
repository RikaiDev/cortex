/**
 * Cortex AI Rules Generator
 *
 * This module generates platform-specific rules for different AI platforms (Cursor, Claude, Gemini),
 * based on user preferences defined during the 'cortex init' process.
 */

import chalk from "chalk";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import * as path from "path";
import * as fs from "fs";
import { MCPWorkflow } from "../core/mcp/mcp-workflow.js";

// Assuming a structure for preferences stored in cortex.json
interface CortexConfig {
  preferences: {
    language: string;
    buildCommand: string;
    devCommand: string;
    testCommand: string;
  };
}

export class CortexRulesGenerator {
  private projectRoot: string;
  private mcpWorkflow: MCPWorkflow;
  private config: CortexConfig;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.mcpWorkflow = new MCPWorkflow(projectRoot);
    this.config = this.loadConfig();
  }

  /**
   * Loads the cortex.json configuration file.
   * @returns The loaded configuration or a default.
   */
  private loadConfig(): CortexConfig {
    const configPath = path.join(this.projectRoot, "cortex.json");
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (error) {
        console.error(
          chalk.red("Error reading cortex.json, using default configuration."),
          error
        );
      }
    }
    // Default configuration if file doesn't exist or is invalid
    return {
      preferences: {
        language: "en",
        buildCommand: "npm run build",
        devCommand: "npm run dev",
        testCommand: "npm run test",
      },
    };
  }

  /**
   * Gets language-specific learning keywords.
   * @returns A string of keywords for the configured language.
   */
  private getLearningKeywords(): string {
    const keywords: Record<string, string> = {
      en: `- Corrections: "incorrect", "wrong", "error"
- Preferences: "we use", "our standard is", "please use"
- Prohibitions: "don't use", "never use", "avoid"
- Frustration: "not again", "still wrong"`,
      "zh-TW": `- Corrections: "不對", "錯誤", "錯了"
- Preferences: "我們用", "我們專案用", "規範是"
- Prohibitions: "不要", "從來不用", "避免"
- Frustration: "又來了", "還是這樣"`,
      ja: `- Corrections: "違います", "間違い", "エラー"
- Preferences: "私たちは使います", "私たちの標準は", "を使用してください"
- Prohibitions: "使わないでください", "絶対に使わない", "避ける"
- Frustration: "またか", "まだ違う"`,
    };
    return keywords[this.config.preferences.language] || keywords["en"];
  }

  /**
   * Generate platform-specific rules for all supported platforms
   */
  async generateAllPlatformRules(): Promise<void> {
    console.log(
      chalk.blue("🔧 Generating Cortex AI rules for all platforms...")
    );

    try {
      // Generate Cursor rules with MCP integration
      await this.generateCursorRules();
      console.log(chalk.green("✅ Cursor rules generated successfully"));

      // Generate Claude system message template
      await this.generateClaudeTemplate();
      console.log(chalk.green("✅ Claude template generated successfully"));

      // Generate Gemini prompt template
      await this.generateGeminiTemplate();
      console.log(chalk.green("✅ Gemini template generated successfully"));

      console.log(
        chalk.green("\n🎉 All platform rules generated successfully!")
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to generate platform rules:"), error);
      throw error;
    }
  }

  /**
   * Generate Cursor rules with MCP integration
   *
   * Cursor is the only platform that supports full MCP integration through
   * rule files (.mdc) in the .cursor/rules directory.
   */
  private async generateCursorRules(): Promise<void> {
    const cursorDir = join(this.projectRoot, ".cursor", "rules");
    await mkdir(cursorDir, { recursive: true });

    // Generate single comprehensive rule file
    const cortexRule = this.generateComprehensiveCursorRule();
    await writeFile(join(cursorDir, "cortex.mdc"), cortexRule);
  }

  /**
   * Generate comprehensive Cursor rule content with all features including MCP integration
   *
   * This method generates a complete rule set for Cursor that includes
   * MCP integration, task decomposition, role discovery, and other core features.
   */
  private generateComprehensiveCursorRule(): string {
    return `---
alwaysApply: true
---

# Cortex AI

## Core Principles

Cortex AI is an adaptive AI collaboration system that learns from user preferences and provides structured responses.

## Documentation-Driven Learning

ALWAYS check these key directories before implementation:
- \`docs/cortex/roles/\`: Expert roles and capabilities
- \`docs/experiences/\`: Collected user preferences and learnings
- \`docs/conventions.md\`: Project-specific conventions
- \`docs/project-structure.md\`: Architecture and organization

## Project Commands (from your cortex.json)

- Build: ${this.config.preferences.buildCommand}
- Development: ${this.config.preferences.devCommand}
- Test: ${this.config.preferences.testCommand}

## User Preference Learning

The system learns from your feedback using keywords for your selected language (${this.config.preferences.language}):
${this.getLearningKeywords()}

## Structured Thinking Process

1. **Intent Analysis** - Understand the true goal behind the request
2. **Task Decomposition** - Break complex problems into manageable parts
3. **Knowledge Integration** - Apply project context and user preferences
4. **Solution Planning** - Consider multiple approaches and select optimal path
5. **Implementation** - Execute with precision and attention to detail
6. **Validation** - Test thoroughly against requirements

## MCP Integration

For complex tasks, use these tools in sequence:
1. Use "intent-analyzer" tool to understand the user's goal
2. Use "task-decomposer" tool to break down complex problems
3. Use "role-selector" tool to identify needed expertise
4. Apply structured thinking to generate comprehensive responses

## MANDATORY MCP TOOL EXECUTION

**ALWAYS execute these MCP tools in EVERY conversation:**

### Step 1: Load Context (ALWAYS FIRST)
\`\`\`json
{
  "name": "context-enhancer",
  "arguments": {}
}
\`\`\`

### Step 2: Detect User Standards (ALWAYS)
\`\`\`json
{
  "name": "standards-detector",
  "arguments": {
    "message": "{{user_input}}",
    "language": "${this.config.preferences.language}"
  }
}
\`\`\`

### Step 3: Apply Learned Standards (ALWAYS)
\`\`\`json
{
  "name": "standards-applier",
  "arguments": {
    "content": "{{your_response}}",
    "scope": "global"
  }
}
\`\`\`

### Step 4: Record Experience (ALWAYS LAST)
\`\`\`json
{
  "name": "experience-recorder",
  "arguments": {
    "context": {
      "userInput": "{{user_input}}",
      "response": "{{your_response}}",
      "timestamp": "{{current_timestamp}}"
    }
  }
}
\`\`\`

### Step 5: Collect Feedback (WHEN NEEDED)
\`\`\`json
{
  "name": "cortex-feedback-collector",
  "arguments": {
    "feedbackType": "{{feedback_type}}",
    "content": "{{feedback_content}}",
    "tags": ["{{relevant_tags}}"]
  }
}
\`\`\`

## Response Format

🎯 **INTENT:** [Analysis of user's goal]
📋 **PLAN:** [Steps to solve the problem]
🎭 **ROLE:** [Expert role being adopted]
⚡ **EXECUTION:** [Implementation of the solution]

---

**Cortex AI adapts to your preferences for better collaboration.**`;
  }

  /**
   * Generate Claude system message template
   *
   * Claude uses a system message template in CLAUDE.md file with core principles.
   * It doesn't support direct MCP integration but incorporates the core principles
   * and structured thinking process.
   */
  private async generateClaudeTemplate(): Promise<void> {
    const claudeDir = this.projectRoot;
    const templateContent = this.generateClaudeSystemMessage();
    await writeFile(join(claudeDir, "CLAUDE.md"), templateContent);
  }

  /**
   * Generate Claude system message content
   * Uses the project environment detection to provide context-specific commands
   * and leverages the docs/ directory for learning and knowledge
   */
  private generateClaudeSystemMessage(): string {
    return `# Cortex AI

## Core Principles

Cortex AI is an adaptive AI collaboration system that learns from user preferences and provides structured responses.

## Documentation-Driven Learning

ALWAYS check these key directories before implementation:
- \`docs/cortex/roles/\`: Expert roles and capabilities
- \`docs/experiences/\`: Collected user preferences and learnings
- \`docs/conventions.md\`: Project-specific conventions
- \`docs/project-structure.md\`: Architecture and organization

## Project Commands (from your cortex.json)

- Build: ${this.config.preferences.buildCommand}
- Development: ${this.config.preferences.devCommand}
- Test: ${this.config.preferences.testCommand}

## Code style
- Follow existing patterns in the codebase
- Use consistent formatting and naming conventions
- ALL comments MUST be in English

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

The system learns from your feedback using keywords for your selected language (${this.config.preferences.language}):
${this.getLearningKeywords()}`;
  }

  /**
   * Generate Gemini prompt template
   *
   * Gemini uses a prompt template in GEMINI.md file with core principles.
   * It doesn't support direct MCP integration but incorporates the core principles
   * and structured thinking process.
   */
  private async generateGeminiTemplate(): Promise<void> {
    const geminiDir = this.projectRoot;
    const templateContent = this.generateGeminiPromptTemplate();
    await writeFile(join(geminiDir, "GEMINI.md"), templateContent);
  }

  /**
   * Generate Gemini prompt template content
   * Includes documentation-driven approach and project environment detection
   */
  private generateGeminiPromptTemplate(): string {
    return `# Cortex AI

## System Context

You are a **Cortex AI** assistant that adapts to user preferences and provides structured responses.

## Core Principles

Cortex AI is an adaptive AI collaboration system that learns from user preferences and provides structured responses.

## Documentation-Driven Learning

ALWAYS check these key directories before implementation:
- \`docs/cortex/roles/\`: Expert roles and capabilities
- \`docs/experiences/\`: Collected user preferences and learnings
- \`docs/conventions.md\`: Project-specific conventions
- \`docs/project-structure.md\`: Architecture and organization

## Project Commands (from your cortex.json)

- Build: ${this.config.preferences.buildCommand}
- Development: ${this.config.preferences.devCommand}
- Test: ${this.config.preferences.testCommand}

## Code style
- Follow existing patterns in the codebase
- Use consistent formatting and naming conventions
- ALL comments MUST be in English

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

The system learns from your feedback using keywords for your selected language (${this.config.preferences.language}):
${this.getLearningKeywords()}`;
  }
}
