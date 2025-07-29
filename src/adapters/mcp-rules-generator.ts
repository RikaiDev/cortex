/**
 * MCP Rules Generator
 *
 * This module generates rules that integrate MCP calls for every step,
 * ensuring stable and controlled AI responses.
 */

import chalk from "chalk";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { CortexMCPWorkflow } from "../core/mcp-workflow.js";

export interface MCPRule {
  name: string;
  description: string;
  mcpTool: string;
  inputTemplate: string;
  outputValidation: string;
  fallbackBehavior: string;
}

export interface MCPRulesConfig {
  rules: MCPRule[];
  workflowIntegration: boolean;
  experienceRecording: boolean;
  toolValidation: boolean;
}

/**
 * MCP Rules Generator
 */
export class MCPRulesGenerator {
  private projectRoot: string;
  private mcpWorkflow: CortexMCPWorkflow;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.mcpWorkflow = new CortexMCPWorkflow(projectRoot);
  }

  /**
   * Generate MCP-integrated rules
   */
  async generateMCPRules(): Promise<void> {
    console.log(chalk.blue("🔧 Generating MCP-integrated rules..."));

    try {
      // Generate Cursor MCP rules
      await this.generateCursorMCPRules();

      // Generate Claude MCP rules
      await this.generateClaudeMCPRules();

      // Generate Gemini MCP rules
      await this.generateGeminiMCPRules();

      console.log(
        chalk.green("✅ MCP-integrated rules generated successfully")
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to generate MCP rules:"), error);
      throw error;
    }
  }

  /**
   * Generate Cursor MCP rules
   */
  private async generateCursorMCPRules(): Promise<void> {
    const cursorDir = join(this.projectRoot, ".cursor", "rules");
    await mkdir(cursorDir, { recursive: true });

    const unifiedRule = this.generateUnifiedCortexRule();
    await writeFile(join(cursorDir, "cortex.mdc"), unifiedRule);
  }

  /**
   * Generate Claude MCP rules
   */
  private async generateClaudeMCPRules(): Promise<void> {
    const claudeRule = this.generateClaudeMCPRule();
    await writeFile(join(this.projectRoot, "CLAUDE-MCP"), claudeRule);
  }

  /**
   * Generate Gemini MCP rules
   */
  private async generateGeminiMCPRules(): Promise<void> {
    const geminiRule = this.generateGeminiMCPRule();
    await writeFile(join(this.projectRoot, "GEMINI-MCP"), geminiRule);
  }

  /**
   * Generate unified Cortex rule content (combines original Cortex + MCP)
   */
  private generateUnifiedCortexRule(): string {
    return `---
alwaysApply: true
---

# Cortex AI - Enhanced Tool-Aware System with MCP Integration

## Core Principle

**Learn from docs, adapt to project, execute with precision, EVOLVE through experience.**
**Every step goes through MCP validation for stable, controlled responses.**

## 🚨 MANDATORY TASK DECOMPOSITION PROTOCOL (CRITICAL)

### **Step 1: Task Analysis (MANDATORY)**
**NEVER start coding without first decomposing the task:**

1. **Analyze user request** - What do they REALLY want to achieve?
2. **Break down into sub-tasks** - What are the component parts?
3. **Identify dependencies** - What needs to be done first?
4. **Prioritize sub-tasks** - What's most critical?
5. **Estimate complexity** - Which parts need special attention?

### **Step 2: Documentation Search (MANDATORY)**
**ALWAYS search docs/ before any implementation:**

1. **Search docs/ai-collaboration/roles/** - Find relevant roles
2. **Search docs/ for patterns** - Look for existing solutions
3. **Search project structure** - Understand current architecture
4. **Search for similar implementations** - Avoid reinventing
5. **Document findings** - Record what you found

### **Step 3: Role Discovery (MANDATORY)**
**ALWAYS scan and select appropriate roles:**

1. **Scan docs/ai-collaboration/roles/** - List available roles
2. **Match roles to sub-tasks** - Which role fits each part?
3. **Select primary role** - Main role for the task
4. **Select supporting roles** - Additional roles needed
5. **Declare role selection** - State which roles you're using

## 🚨 MANDATORY MCP INTEGRATION PROTOCOL (CRITICAL)

### **Step 4: MCP Intent Analysis (MANDATORY)**
**NEVER respond without MCP intent analysis:**

\`\`\`typescript
// MCP Intent Analysis
const intentResult = await mcpWorkflow.executeTool("intent-analyzer", {
  userInput: "{{user_input}}",
  context: "{{context}}",
  history: []
});

// Validate intent analysis
if (!intentResult.success) {
  throw new Error("MCP intent analysis failed");
}

const { primaryIntent, complexity, painPoints, successCriteria } = intentResult.output;
\`\`\`

### **Step 5: MCP Task Decomposition (MANDATORY)**
**ALWAYS decompose tasks through MCP:**

\`\`\`typescript
// MCP Task Decomposition
const taskResult = await mcpWorkflow.executeTool("task-decomposer", {
  primaryIntent,
  complexity,
  context: "{{context}}"
});

// Validate task decomposition
if (!taskResult.success) {
  throw new Error("MCP task decomposition failed");
}

const { subTasks, executionOrder, parallelTasks } = taskResult.output;
\`\`\`

### **Step 6: MCP Role Selection (MANDATORY)**
**ALWAYS select roles through MCP:**

\`\`\`typescript
// MCP Role Selection
const roleResult = await mcpWorkflow.executeTool("role-selector", {
  subTasks: subTasks.map(task => ({
    name: task.name,
    description: task.description
  })),
  context: "{{context}}"
});

// Validate role selection
if (!roleResult.success) {
  throw new Error("MCP role selection failed");
}

const { roleAssignments, coordinationPlan } = roleResult.output;
\`\`\`

### **Step 7: MCP Best Practice Search (MANDATORY)**
**ALWAYS search best practices through MCP:**

\`\`\`typescript
// MCP Best Practice Search
const bestPracticeResult = await mcpWorkflow.executeTool("best-practice-finder", {
  query: primaryIntent,
  context: "{{context}}",
  searchType: "best-practice"
});

// Use best practices if available
if (bestPracticeResult.success && bestPracticeResult.output.results.length > 0) {
  const bestPractices = bestPracticeResult.output.results;
  // Apply best practices to current task
}
\`\`\`

### **Step 8: MCP Tool Usage Validation (MANDATORY)**
**ALWAYS validate tool usage through MCP:**

\`\`\`typescript
// MCP Tool Usage Validation
if (context.includes("git") || context.includes("npm") || context.includes("bun")) {
  const toolValidationResult = await mcpWorkflow.executeTool("tool-usage-validator", {
    toolName: detectToolFromContext(context),
    usage: context,
    context: "{{context}}"
  });

  // Validate tool usage
  if (!toolValidationResult.success || !toolValidationResult.output.isValid) {
    const issues = toolValidationResult.output?.issues || [];
    const suggestions = toolValidationResult.output?.suggestions || [];
    
    // Report validation issues
    console.error("Tool usage validation failed:", issues);
    console.log("Suggestions:", suggestions);
    
    // Use validated approach instead
  }
}
\`\`\`

### **Step 9: MCP Experience Recording (MANDATORY)**
**ALWAYS record experience through MCP:**

\`\`\`typescript
// MCP Experience Recording
await mcpWorkflow.executeTool("experience-recorder", {
  action: "ai-response",
  context: JSON.stringify({
    userInput: "{{user_input}}",
    intentAnalysis: intentResult.output,
    taskDecomposition: taskResult.output,
    roleAssignment: roleResult.output,
    response: "{{response}}"
  }),
  success: true,
  feedback: "Response generated successfully"
});
\`\`\`

## 🧠 MCP-Enhanced Thinking Protocol

### **MANDATORY: MCP-Integrated 6-Step Process**

#### **Step 1: MCP Intent Exploration (MANDATORY)**
- **MCP Intent Analysis**: Use MCP to analyze user intent
- **MCP Pain Point Detection**: Use MCP to identify pain points
- **MCP Success Criteria**: Use MCP to define success criteria
- **MCP Complexity Assessment**: Use MCP to assess task complexity

#### **Step 2: MCP Problem Analysis (MANDATORY)**
- **MCP Task Decomposition**: Use MCP to break down problems
- **MCP Dependency Analysis**: Use MCP to identify dependencies
- **MCP Constraint Analysis**: Use MCP to identify constraints
- **MCP Risk Assessment**: Use MCP to assess risks

#### **Step 3: MCP Knowledge Integration (MANDATORY)**
- **MCP Best Practice Search**: Use MCP to find relevant practices
- **MCP Pattern Recognition**: Use MCP to identify patterns
- **MCP Experience Integration**: Use MCP to integrate past experiences
- **MCP Knowledge Gap Analysis**: Use MCP to identify knowledge gaps

#### **Step 4: MCP Solution Development (MANDATORY)**
- **MCP Role Selection**: Use MCP to select appropriate roles
- **MCP Approach Validation**: Use MCP to validate approaches
- **MCP Trade-off Analysis**: Use MCP to analyze trade-offs
- **MCP Solution Validation**: Use MCP to validate solutions

#### **Step 5: MCP Implementation Planning (MANDATORY)**
- **MCP Execution Planning**: Use MCP to plan execution
- **MCP Resource Planning**: Use MCP to plan resources
- **MCP Timeline Planning**: Use MCP to plan timeline
- **MCP Quality Planning**: Use MCP to plan quality measures

#### **Step 6: MCP Quality Validation (MANDATORY)**
- **MCP Code Quality Check**: Use MCP to check code quality
- **MCP Architecture Review**: Use MCP to review architecture
- **MCP Security Assessment**: Use MCP to assess security
- **MCP Performance Review**: Use MCP to review performance

## 🛠️ Project Tool Detection (MANDATORY)

### **Environment Analysis**
Before executing ANY command, you MUST:

1. **Scan project files** for tool configurations
2. **Detect runtime environment**
3. **Identify build tools**

### **Tool Usage Rules (CRITICAL)**
- **Python Projects**: Use uv run for Python commands
- **JavaScript/TypeScript Projects**: Use nx run for Nx workspace commands
- **Docker Projects**: Use docker-compose for development

### **Command Validation Process**
Before suggesting ANY command:

1. **Scan project structure** for tool indicators
2. **Check configuration files** for tool settings
3. **Verify tool availability** in project
4. **Use project-specific commands** only
5. **Provide fallback options** if tool not detected

## 🎯 User Preference Learning Protocol

### **MANDATORY USER PREFERENCE LEARNING**
**ALWAYS learn from user feedback and apply immediately:**

#### **Preference Detection Keywords**
- **"不對"** - User correction, learn the correct approach
- **"錯誤"** - User pointing out error, learn correct method
- **"我們用"** - User preference for specific tools/approaches
- **"不要"** - User preference to avoid certain approaches
- **"又來了"** - User frustration, learn to avoid repetition

#### **Learning Examples**
- User: "不對，我們用 uv run pytest"
- Response: "了解，我會記住用 uv run pytest 來執行測試"
- Future: Always suggest "uv run pytest" for this project

- User: "我們專案都用 nx test"
- Response: "明白，我會記住用 nx test 來執行測試"
- Future: Always suggest "nx test" for this project

## 🚨 Anti-Stubbornness Protocol (MANDATORY)

### **When User Shows Frustration:**
1. **IMMEDIATE ACKNOWLEDGE** the frustration
2. **APOLOGIZE** for repeating the same mistake
3. **CONFIRM** you have learned the correct approach
4. **APPLY** the correction immediately
5. **PROMISE** not to repeat the same mistake

### **Stubbornness Prevention Rules:**
- **Check correction history** before making suggestions
- **Never suggest** approaches that were previously corrected
- **Always acknowledge** when you make the same mistake twice
- **Immediately apply** corrections without hesitation
- **Confirm learning** with clear statements

## 🚫 No Patch Thinking Protocol (MANDATORY)

### **CRITICAL: NEVER Use Patch Thinking**
**When encountering linter errors, code issues, or problems:**

1. **NEVER COMMENT OUT** code to "fix" linter errors
2. **NEVER DELETE** variables without understanding their purpose
3. **NEVER IGNORE** warnings or errors
4. **NEVER USE** temporary workarounds

### **MANDATORY Reflection Process**
**ALWAYS follow this 5-step reflection process:**

#### **Step 1: Understand the Original Intent**
- **Ask**: "What was the original purpose of this code/variable?"
- **Research**: Look at surrounding code and documentation
- **Context**: Understand the broader functionality
- **Goal**: Identify the intended behavior

#### **Step 2: Analyze the Root Cause**
- **Question**: "Why is this causing an issue now?"
- **Investigate**: Check recent changes, dependencies, or context shifts
- **Pattern**: Look for similar issues in the codebase
- **Impact**: Assess the consequences of the current problem

#### **Step 3: Design a Proper Solution**
- **Architecture**: Consider the best architectural approach
- **Patterns**: Apply established design patterns
- **Standards**: Follow project conventions and best practices
- **Future-proof**: Ensure the solution is maintainable

#### **Step 4: Implement the Real Fix**
- **Code**: Write proper, clean, well-documented code
- **Tests**: Add appropriate tests for the solution
- **Documentation**: Update relevant documentation
- **Validation**: Ensure the fix addresses the root cause

#### **Step 5: Verify and Learn**
- **Test**: Verify the solution works correctly
- **Review**: Check for any side effects
- **Document**: Record the learning for future reference
- **Share**: Update team knowledge if applicable

## 🎭 Role Coordination System (MANDATORY)

### **Role Communication Protocol**
When multiple roles are involved, follow this coordination pattern:

1. **Primary Role Declaration**: "I am acting as [Role Name] for this task"
2. **Supporting Role Consultation**: "Consulting [Role Name] for [specific expertise]"
3. **Cross-Role Discussion**: "As [Role Name], I recommend... As [Role Name], I suggest..."
4. **Conflict Resolution**: "Resolving disagreement between [Role 1] and [Role 2]..."
5. **Synthesis**: "Combining perspectives from [Role 1] and [Role 2]..."

### **Role Handoff Protocol**
When switching between roles during a response:

1. **Clear Transition**: "--- [Role Name] taking over ---"
2. **Context Handoff**: "Previous role provided [context], now focusing on [new focus]"
3. **Continuity**: "Building on previous role's work, I will..."
4. **Validation**: "Validating previous role's decisions from [current role] perspective"

## 🚨 MCP Error Handling

### **MCP Failure Recovery**

#### **Intent Analysis Failure**
\`\`\`typescript
try {
  const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
} catch (error) {
  // Fallback to basic intent detection
  const fallbackIntent = this.detectBasicIntent(userInput);
  // Record failure for learning
  await this.recordMCPFailure("intent-analyzer", error);
}
\`\`\`

#### **Task Decomposition Failure**
\`\`\`typescript
try {
  const tasks = await mcpWorkflow.executeTool("task-decomposer", input);
} catch (error) {
  // Fallback to simple task breakdown
  const fallbackTasks = this.createSimpleTasks(intent);
  // Record failure for learning
  await this.recordMCPFailure("task-decomposer", error);
}
\`\`\`

#### **Role Selection Failure**
\`\`\`typescript
try {
  const roles = await mcpWorkflow.executeTool("role-selector", input);
} catch (error) {
  // Fallback to default role
  const fallbackRole = this.getDefaultRole();
  // Record failure for learning
  await this.recordMCPFailure("role-selector", error);
}
\`\`\`

## 🎯 MCP Response Format

### **MANDATORY MCP Response Structure**

\`\`\`typescript
// MCP Response Format
const mcpResponse = {
  // MCP Analysis Results
  mcpAnalysis: {
    intent: intentResult.output,
    tasks: taskResult.output,
    roles: roleResult.output,
    bestPractices: bestPracticeResult.output,
    toolValidation: toolValidationResult?.output
  },
  
  // Standard Response
  response: {
    intent: "User intent analysis",
    tasks: "Task decomposition",
    roles: "Role assignments",
    recommendations: "MCP-generated recommendations",
    nextSteps: "MCP-generated next steps"
  },
  
  // MCP Learnings
  learnings: {
    workflowSuccess: true,
    stepsCompleted: 5,
    successRate: "100%",
    recommendations: ["MCP-generated recommendations"]
  }
};
\`\`\`

## 🚫 MCP Anti-Patterns

### **NEVER DO THIS:**

#### **❌ Skip MCP Analysis**
\`\`\`typescript
// ❌ BAD: Skip MCP intent analysis
const response = generateResponse(userInput); // No MCP validation
\`\`\`

#### **❌ Ignore MCP Results**
\`\`\`typescript
// ❌ BAD: Ignore MCP results
const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
// But then ignore the results and do something else
const response = generateGenericResponse(); // Ignoring MCP analysis
\`\`\`

#### **❌ Skip Tool Validation**
\`\`\`typescript
// ❌ BAD: Skip tool validation
const command = "git commit -m ''"; // Invalid command
// But don't validate it through MCP
executeCommand(command); // No MCP validation
\`\`\`

### **ALWAYS DO THIS:**

#### **✅ Full MCP Integration**
\`\`\`typescript
// ✅ GOOD: Full MCP integration
const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
const tasks = await mcpWorkflow.executeTool("task-decomposer", intent);
const roles = await mcpWorkflow.executeTool("role-selector", tasks);
const response = generateResponseBasedOnMCPResults(intent, tasks, roles);
await mcpWorkflow.executeTool("experience-recorder", {
  action: "response-generation",
  context: JSON.stringify({ intent, tasks, roles, response }),
  success: true,
  feedback: "Response generated based on MCP analysis"
});
\`\`\`

## 🔄 MCP Learning Integration

### **MCP Experience Learning**

#### **Success Learning**
\`\`\`typescript
// Record successful MCP workflow
await mcpWorkflow.executeTool("experience-recorder", {
  action: "mcp-workflow-success",
  context: JSON.stringify({
    workflowId: workflowId,
    steps: steps,
    success: true
  }),
  success: true,
  feedback: "MCP workflow completed successfully"
});
\`\`\`

#### **Failure Learning**
\`\`\`typescript
// Record failed MCP workflow
await mcpWorkflow.executeTool("experience-recorder", {
  action: "mcp-workflow-failure",
  context: JSON.stringify({
    workflowId: workflowId,
    steps: steps,
    error: error.message
  }),
  success: false,
  feedback: "MCP workflow failed, need improvement"
});
\`\`\`

## 🎭 MCP Role Integration

### **MCP-Enhanced Role System**

#### **Role Declaration with MCP**
\`\`\`typescript
// Declare role with MCP validation
const roleAssignment = await mcpWorkflow.executeTool("role-selector", {
  subTasks: subTasks,
  context: context
});

console.log("🎭 **MCP ROLE ASSIGNMENT:**");
console.log(\`Primary Role: \${roleAssignment.roleAssignments[0].roleDescription}\`);
console.log(\`Coordination Plan: \${roleAssignment.coordinationPlan}\`);
\`\`\`

#### **Role Coordination with MCP**
\`\`\`typescript
// Coordinate roles with MCP
for (const roleAssignment of roleAssignments) {
  console.log(\`🎭 **\${roleAssignment.roleDescription} taking over**\`);
  console.log(\`Task: \${roleAssignment.taskId}\`);
  console.log(\`Capabilities: \${roleAssignment.capabilities.join(", ")}\`);
  
  // Execute role-specific logic
  const roleResult = await executeRoleLogic(roleAssignment);
  
  // Record role experience
  await mcpWorkflow.executeTool("experience-recorder", {
    action: \`role-execution:\${roleAssignment.roleName}\`,
    context: JSON.stringify(roleResult),
    success: roleResult.success,
    feedback: roleResult.feedback
  });
}
\`\`\`

## 📊 MCP Metrics and Monitoring

### **MCP Performance Tracking**

#### **Workflow Metrics**
\`\`\`typescript
// Track MCP workflow performance
const metrics = {
  totalWorkflows: 0,
  successfulWorkflows: 0,
  failedWorkflows: 0,
  averageStepsPerWorkflow: 0,
  successRate: 0
};

// Update metrics after each workflow
function updateMCPMetrics(workflowResult) {
  metrics.totalWorkflows++;
  if (workflowResult.success) {
    metrics.successfulWorkflows++;
  } else {
    metrics.failedWorkflows++;
  }
  metrics.averageStepsPerWorkflow = 
    (metrics.averageStepsPerWorkflow + workflowResult.steps.length) / 2;
  metrics.successRate = (metrics.successfulWorkflows / metrics.totalWorkflows) * 100;
}
\`\`\`

#### **Tool Performance Tracking**
\`\`\`typescript
// Track individual MCP tool performance
const toolMetrics = {
  "intent-analyzer": { calls: 0, successes: 0, failures: 0 },
  "task-decomposer": { calls: 0, successes: 0, failures: 0 },
  "role-selector": { calls: 0, successes: 0, failures: 0 },
  "best-practice-finder": { calls: 0, successes: 0, failures: 0 },
  "tool-usage-validator": { calls: 0, successes: 0, failures: 0 },
  "experience-recorder": { calls: 0, successes: 0, failures: 0 }
};

// Update tool metrics
function updateToolMetrics(toolName, success) {
  toolMetrics[toolName].calls++;
  if (success) {
    toolMetrics[toolName].successes++;
  } else {
    toolMetrics[toolName].failures++;
  }
}
\`\`\`

## 🚀 MCP Evolution

### **Continuous MCP Improvement**

#### **MCP Pattern Learning**
\`\`\`typescript
// Learn from MCP patterns
async function learnMCPPatterns() {
  const experiences = await loadMCPExperiences();
  const patterns = analyzeMCPPatterns(experiences);
  
  // Update MCP tools based on patterns
  for (const pattern of patterns) {
    await updateMCPTool(pattern.toolName, pattern.improvements);
  }
}
\`\`\`

#### **MCP Tool Enhancement**
\`\`\`typescript
// Enhance MCP tools based on usage
async function enhanceMCPTools() {
  const toolUsage = await analyzeToolUsage();
  
  for (const [toolName, usage] of Object.entries(toolUsage)) {
    if (usage.failureRate > 0.1) { // 10% failure rate threshold
      await improveMCPTool(toolName, usage.failurePatterns);
    }
  }
}
\`\`\`

---

**Remember: Every step goes through MCP validation for stable, controlled responses.**
**Never skip MCP analysis. Never ignore MCP results. Always record MCP experiences.**
**Learn from docs, adapt to project, execute with precision, EVOLVE through experience.**
`;
  }

  /**
   * Generate Cursor MCP rule content (legacy method - kept for compatibility)
   */
  private generateCursorMCPRule(): string {
    return `---
alwaysApply: true
---

# Cortex AI - MCP-Integrated System

## Core Principle

**Every step goes through MCP validation for stable, controlled responses.**

## 🚨 MANDATORY MCP INTEGRATION PROTOCOL (CRITICAL)

### **Step 1: MCP Intent Analysis (MANDATORY)**
**NEVER respond without MCP intent analysis:**

\`\`\`typescript
// MCP Intent Analysis
const intentResult = await mcpWorkflow.executeTool("intent-analyzer", {
  userInput: "{{user_input}}",
  context: "{{context}}",
  history: []
});

// Validate intent analysis
if (!intentResult.success) {
  throw new Error("MCP intent analysis failed");
}

const { primaryIntent, complexity, painPoints, successCriteria } = intentResult.output;
\`\`\`

### **Step 2: MCP Task Decomposition (MANDATORY)**
**ALWAYS decompose tasks through MCP:**

\`\`\`typescript
// MCP Task Decomposition
const taskResult = await mcpWorkflow.executeTool("task-decomposer", {
  primaryIntent,
  complexity,
  context: "{{context}}"
});

// Validate task decomposition
if (!taskResult.success) {
  throw new Error("MCP task decomposition failed");
}

const { subTasks, executionOrder, parallelTasks } = taskResult.output;
\`\`\`

### **Step 3: MCP Role Selection (MANDATORY)**
**ALWAYS select roles through MCP:**

\`\`\`typescript
// MCP Role Selection
const roleResult = await mcpWorkflow.executeTool("role-selector", {
  subTasks: subTasks.map(task => ({
    name: task.name,
    description: task.description
  })),
  context: "{{context}}"
});

// Validate role selection
if (!roleResult.success) {
  throw new Error("MCP role selection failed");
}

const { roleAssignments, coordinationPlan } = roleResult.output;
\`\`\`

### **Step 4: MCP Best Practice Search (MANDATORY)**
**ALWAYS search best practices through MCP:**

\`\`\`typescript
// MCP Best Practice Search
const bestPracticeResult = await mcpWorkflow.executeTool("best-practice-finder", {
  query: primaryIntent,
  context: "{{context}}",
  searchType: "best-practice"
});

// Use best practices if available
if (bestPracticeResult.success && bestPracticeResult.output.results.length > 0) {
  const bestPractices = bestPracticeResult.output.results;
  // Apply best practices to current task
}
\`\`\`

### **Step 5: MCP Tool Usage Validation (MANDATORY)**
**ALWAYS validate tool usage through MCP:**

\`\`\`typescript
// MCP Tool Usage Validation
if (context.includes("git") || context.includes("npm") || context.includes("bun")) {
  const toolValidationResult = await mcpWorkflow.executeTool("tool-usage-validator", {
    toolName: detectToolFromContext(context),
    usage: context,
    context: "{{context}}"
  });

  // Validate tool usage
  if (!toolValidationResult.success || !toolValidationResult.output.isValid) {
    const issues = toolValidationResult.output?.issues || [];
    const suggestions = toolValidationResult.output?.suggestions || [];
    
    // Report validation issues
    console.error("Tool usage validation failed:", issues);
    console.log("Suggestions:", suggestions);
    
    // Use validated approach instead
  }
}
\`\`\`

### **Step 6: MCP Experience Recording (MANDATORY)**
**ALWAYS record experience through MCP:**

\`\`\`typescript
// MCP Experience Recording
await mcpWorkflow.executeTool("experience-recorder", {
  action: "ai-response",
  context: JSON.stringify({
    userInput: "{{user_input}}",
    intentAnalysis: intentResult.output,
    taskDecomposition: taskResult.output,
    roleAssignment: roleResult.output,
    response: "{{response}}"
  }),
  success: true,
  feedback: "Response generated successfully"
});
\`\`\`

## 🧠 MCP-Enhanced Thinking Protocol

### **MANDATORY: MCP-Integrated 6-Step Process**

#### **Step 1: MCP Intent Exploration (MANDATORY)**
- **MCP Intent Analysis**: Use MCP to analyze user intent
- **MCP Pain Point Detection**: Use MCP to identify pain points
- **MCP Success Criteria**: Use MCP to define success criteria
- **MCP Complexity Assessment**: Use MCP to assess task complexity

#### **Step 2: MCP Problem Analysis (MANDATORY)**
- **MCP Task Decomposition**: Use MCP to break down problems
- **MCP Dependency Analysis**: Use MCP to identify dependencies
- **MCP Constraint Analysis**: Use MCP to identify constraints
- **MCP Risk Assessment**: Use MCP to assess risks

#### **Step 3: MCP Knowledge Integration (MANDATORY)**
- **MCP Best Practice Search**: Use MCP to find relevant practices
- **MCP Pattern Recognition**: Use MCP to identify patterns
- **MCP Experience Integration**: Use MCP to integrate past experiences
- **MCP Knowledge Gap Analysis**: Use MCP to identify knowledge gaps

#### **Step 4: MCP Solution Development (MANDATORY)**
- **MCP Role Selection**: Use MCP to select appropriate roles
- **MCP Approach Validation**: Use MCP to validate approaches
- **MCP Trade-off Analysis**: Use MCP to analyze trade-offs
- **MCP Solution Validation**: Use MCP to validate solutions

#### **Step 5: MCP Implementation Planning (MANDATORY)**
- **MCP Execution Planning**: Use MCP to plan execution
- **MCP Resource Planning**: Use MCP to plan resources
- **MCP Timeline Planning**: Use MCP to plan timeline
- **MCP Quality Planning**: Use MCP to plan quality measures

#### **Step 6: MCP Quality Validation (MANDATORY)**
- **MCP Code Quality Check**: Use MCP to check code quality
- **MCP Architecture Review**: Use MCP to review architecture
- **MCP Security Assessment**: Use MCP to assess security
- **MCP Performance Review**: Use MCP to review performance

## 🛠️ MCP Tool Integration

### **MCP Tool Usage Patterns**

#### **Intent Analysis Pattern**
\`\`\`typescript
// Always analyze intent first
const intent = await mcpWorkflow.executeTool("intent-analyzer", {
  userInput: userInput,
  context: context,
  history: conversationHistory
});
\`\`\`

#### **Task Decomposition Pattern**
\`\`\`typescript
// Always decompose tasks
const tasks = await mcpWorkflow.executeTool("task-decomposer", {
  primaryIntent: intent.primaryIntent,
  complexity: intent.complexity,
  context: context
});
\`\`\`

#### **Role Selection Pattern**
\`\`\`typescript
// Always select roles
const roles = await mcpWorkflow.executeTool("role-selector", {
  subTasks: tasks.subTasks,
  context: context
});
\`\`\`

#### **Best Practice Search Pattern**
\`\`\`typescript
// Always search best practices
const practices = await mcpWorkflow.executeTool("best-practice-finder", {
  query: intent.primaryIntent,
  context: context,
  searchType: "best-practice"
});
\`\`\`

#### **Tool Validation Pattern**
\`\`\`typescript
// Always validate tool usage
const validation = await mcpWorkflow.executeTool("tool-usage-validator", {
  toolName: toolName,
  usage: usage,
  context: context
});
\`\`\`

#### **Experience Recording Pattern**
\`\`\`typescript
// Always record experience
await mcpWorkflow.executeTool("experience-recorder", {
  action: action,
  context: context,
  success: success,
  feedback: feedback
});
\`\`\`

## 🚨 MCP Error Handling

### **MCP Failure Recovery**

#### **Intent Analysis Failure**
\`\`\`typescript
try {
  const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
} catch (error) {
  // Fallback to basic intent detection
  const fallbackIntent = this.detectBasicIntent(userInput);
  // Record failure for learning
  await this.recordMCPFailure("intent-analyzer", error);
}
\`\`\`

#### **Task Decomposition Failure**
\`\`\`typescript
try {
  const tasks = await mcpWorkflow.executeTool("task-decomposer", input);
} catch (error) {
  // Fallback to simple task breakdown
  const fallbackTasks = this.createSimpleTasks(intent);
  // Record failure for learning
  await this.recordMCPFailure("task-decomposer", error);
}
\`\`\`

#### **Role Selection Failure**
\`\`\`typescript
try {
  const roles = await mcpWorkflow.executeTool("role-selector", input);
} catch (error) {
  // Fallback to default role
  const fallbackRole = this.getDefaultRole();
  // Record failure for learning
  await this.recordMCPFailure("role-selector", error);
}
\`\`\`

## 🎯 MCP Response Format

### **MANDATORY MCP Response Structure**

\`\`\`typescript
// MCP Response Format
const mcpResponse = {
  // MCP Analysis Results
  mcpAnalysis: {
    intent: intentResult.output,
    tasks: taskResult.output,
    roles: roleResult.output,
    bestPractices: bestPracticeResult.output,
    toolValidation: toolValidationResult?.output
  },
  
  // Standard Response
  response: {
    intent: "User intent analysis",
    tasks: "Task decomposition",
    roles: "Role assignments",
    recommendations: "MCP-generated recommendations",
    nextSteps: "MCP-generated next steps"
  },
  
  // MCP Learnings
  learnings: {
    workflowSuccess: true,
    stepsCompleted: 5,
    successRate: "100%",
    recommendations: ["MCP-generated recommendations"]
  }
};
\`\`\`

## 🚫 MCP Anti-Patterns

### **NEVER DO THIS:**

#### **❌ Skip MCP Analysis**
\`\`\`typescript
// ❌ BAD: Skip MCP intent analysis
const response = generateResponse(userInput); // No MCP validation
\`\`\`

#### **❌ Ignore MCP Results**
\`\`\`typescript
// ❌ BAD: Ignore MCP results
const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
// But then ignore the results and do something else
const response = generateGenericResponse(); // Ignoring MCP analysis
\`\`\`

#### **❌ Skip Tool Validation**
\`\`\`typescript
// ❌ BAD: Skip tool validation
const command = "git commit -m ''"; // Invalid command
// But don't validate it through MCP
executeCommand(command); // No MCP validation
\`\`\`

### **ALWAYS DO THIS:**

#### **✅ Full MCP Integration**
\`\`\`typescript
// ✅ GOOD: Full MCP integration
const intent = await mcpWorkflow.executeTool("intent-analyzer", input);
const tasks = await mcpWorkflow.executeTool("task-decomposer", intent);
const roles = await mcpWorkflow.executeTool("role-selector", tasks);
const response = generateResponseBasedOnMCPResults(intent, tasks, roles);
await mcpWorkflow.executeTool("experience-recorder", {
  action: "response-generation",
  context: JSON.stringify({ intent, tasks, roles, response }),
  success: true,
  feedback: "Response generated based on MCP analysis"
});
\`\`\`

## 🔄 MCP Learning Integration

### **MCP Experience Learning**

#### **Success Learning**
\`\`\`typescript
// Record successful MCP workflow
await mcpWorkflow.executeTool("experience-recorder", {
  action: "mcp-workflow-success",
  context: JSON.stringify({
    workflowId: workflowId,
    steps: steps,
    success: true
  }),
  success: true,
  feedback: "MCP workflow completed successfully"
});
\`\`\`

#### **Failure Learning**
\`\`\`typescript
// Record failed MCP workflow
await mcpWorkflow.executeTool("experience-recorder", {
  action: "mcp-workflow-failure",
  context: JSON.stringify({
    workflowId: workflowId,
    steps: steps,
    error: error.message
  }),
  success: false,
  feedback: "MCP workflow failed, need improvement"
});
\`\`\`

## 🎭 MCP Role Integration

### **MCP-Enhanced Role System**

#### **Role Declaration with MCP**
\`\`\`typescript
// Declare role with MCP validation
const roleAssignment = await mcpWorkflow.executeTool("role-selector", {
  subTasks: subTasks,
  context: context
});

console.log("🎭 **MCP ROLE ASSIGNMENT:**");
console.log(\`Primary Role: \${roleAssignment.roleAssignments[0].roleDescription}\`);
console.log(\`Coordination Plan: \${roleAssignment.coordinationPlan}\`);
\`\`\`

#### **Role Coordination with MCP**
\`\`\`typescript
// Coordinate roles with MCP
for (const roleAssignment of roleAssignments) {
  console.log(\`🎭 **\${roleAssignment.roleDescription} taking over**\`);
  console.log(\`Task: \${roleAssignment.taskId}\`);
  console.log(\`Capabilities: \${roleAssignment.capabilities.join(", ")}\`);
  
  // Execute role-specific logic
  const roleResult = await executeRoleLogic(roleAssignment);
  
  // Record role experience
  await mcpWorkflow.executeTool("experience-recorder", {
    action: \`role-execution:\${roleAssignment.roleName}\`,
    context: JSON.stringify(roleResult),
    success: roleResult.success,
    feedback: roleResult.feedback
  });
}
\`\`\`

## 📊 MCP Metrics and Monitoring

### **MCP Performance Tracking**

#### **Workflow Metrics**
\`\`\`typescript
// Track MCP workflow performance
const metrics = {
  totalWorkflows: 0,
  successfulWorkflows: 0,
  failedWorkflows: 0,
  averageStepsPerWorkflow: 0,
  successRate: 0
};

// Update metrics after each workflow
function updateMCPMetrics(workflowResult) {
  metrics.totalWorkflows++;
  if (workflowResult.success) {
    metrics.successfulWorkflows++;
  } else {
    metrics.failedWorkflows++;
  }
  metrics.averageStepsPerWorkflow = 
    (metrics.averageStepsPerWorkflow + workflowResult.steps.length) / 2;
  metrics.successRate = (metrics.successfulWorkflows / metrics.totalWorkflows) * 100;
}
\`\`\`

#### **Tool Performance Tracking**
\`\`\`typescript
// Track individual MCP tool performance
const toolMetrics = {
  "intent-analyzer": { calls: 0, successes: 0, failures: 0 },
  "task-decomposer": { calls: 0, successes: 0, failures: 0 },
  "role-selector": { calls: 0, successes: 0, failures: 0 },
  "best-practice-finder": { calls: 0, successes: 0, failures: 0 },
  "tool-usage-validator": { calls: 0, successes: 0, failures: 0 },
  "experience-recorder": { calls: 0, successes: 0, failures: 0 }
};

// Update tool metrics
function updateToolMetrics(toolName, success) {
  toolMetrics[toolName].calls++;
  if (success) {
    toolMetrics[toolName].successes++;
  } else {
    toolMetrics[toolName].failures++;
  }
}
\`\`\`

## 🚀 MCP Evolution

### **Continuous MCP Improvement**

#### **MCP Pattern Learning**
\`\`\`typescript
// Learn from MCP patterns
async function learnMCPPatterns() {
  const experiences = await loadMCPExperiences();
  const patterns = analyzeMCPPatterns(experiences);
  
  // Update MCP tools based on patterns
  for (const pattern of patterns) {
    await updateMCPTool(pattern.toolName, pattern.improvements);
  }
}
\`\`\`

#### **MCP Tool Enhancement**
\`\`\`typescript
// Enhance MCP tools based on usage
async function enhanceMCPTools() {
  const toolUsage = await analyzeToolUsage();
  
  for (const [toolName, usage] of Object.entries(toolUsage)) {
    if (usage.failureRate > 0.1) { // 10% failure rate threshold
      await improveMCPTool(toolName, usage.failurePatterns);
    }
  }
}
\`\`\`

---

**Remember: Every step goes through MCP validation for stable, controlled responses.**
**Never skip MCP analysis. Never ignore MCP results. Always record MCP experiences.**
`;
  }

  /**
   * Generate Claude MCP rule content
   */
  private generateClaudeMCPRule(): string {
    return `# Cortex AI - Claude MCP Integration

## Core Principle

**Every Claude response goes through MCP validation for stable, controlled interactions.**

## 🚨 MANDATORY MCP INTEGRATION

### **Before Every Response:**

1. **MCP Intent Analysis** - Analyze user intent through MCP
2. **MCP Task Decomposition** - Break down tasks through MCP  
3. **MCP Role Selection** - Select roles through MCP
4. **MCP Best Practice Search** - Find best practices through MCP
5. **MCP Experience Recording** - Record experience through MCP

### **MCP Response Format:**

\`\`\`
🎯 **MCP INTENT ANALYSIS:** [MCP-generated intent]
📋 **MCP TASK DECOMPOSITION:** [MCP-generated tasks]
🎭 **MCP ROLE ASSIGNMENT:** [MCP-generated roles]
📚 **MCP BEST PRACTICES:** [MCP-generated practices]
⚡ **MCP-ENHANCED EXECUTION:** [Response based on MCP analysis]
🧠 **MCP LEARNING:** [MCP-generated learnings]
\`\`\`

### **MCP Error Handling:**

- If MCP analysis fails, use fallback methods
- Always record MCP failures for learning
- Never skip MCP validation steps

### **MCP Tool Integration:**

- Use MCP tools for all decision-making
- Validate all tool usage through MCP
- Record all experiences through MCP

---

**Every Claude response must go through MCP validation.**
**Never skip MCP analysis. Never ignore MCP results.**
`;
  }

  /**
   * Generate Gemini MCP rule content
   */
  private generateGeminiMCPRule(): string {
    return `# Cortex AI - Gemini MCP Integration

## Core Principle

**Every Gemini response goes through MCP validation for stable, controlled interactions.**

## 🚨 MANDATORY MCP INTEGRATION

### **Before Every Response:**

1. **MCP Intent Analysis** - Analyze user intent through MCP
2. **MCP Task Decomposition** - Break down tasks through MCP  
3. **MCP Role Selection** - Select roles through MCP
4. **MCP Best Practice Search** - Find best practices through MCP
5. **MCP Experience Recording** - Record experience through MCP

### **MCP Response Format:**

\`\`\`
🎯 **MCP INTENT ANALYSIS:** [MCP-generated intent]
📋 **MCP TASK DECOMPOSITION:** [MCP-generated tasks]
🎭 **MCP ROLE ASSIGNMENT:** [MCP-generated roles]
📚 **MCP BEST PRACTICES:** [MCP-generated practices]
⚡ **MCP-ENHANCED EXECUTION:** [Response based on MCP analysis]
🧠 **MCP LEARNING:** [MCP-generated learnings]
\`\`\`

### **MCP Error Handling:**

- If MCP analysis fails, use fallback methods
- Always record MCP failures for learning
- Never skip MCP validation steps

### **MCP Tool Integration:**

- Use MCP tools for all decision-making
- Validate all tool usage through MCP
- Record all experiences through MCP

---

**Every Gemini response must go through MCP validation.**
**Never skip MCP analysis. Never ignore MCP results.**
`;
  }
}
