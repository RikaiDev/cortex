# Cortex AI

[![Version](https://img.shields.io/badge/version-v0.8.0-blue.svg)](https://github.com/RikaiDev/cortex/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/runtime-Node.js-green.svg)](https://nodejs.org/)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/) | [Updates](docs/updates/) | [Changelog](CHANGELOG.md)

## 🧠 AI Collaboration Brain

**Cortex AI** is an intelligent AI collaboration system that transforms AI models into reliable, learning partners.
It solves the fundamental problems of AI inconsistency and lack of memory through **prompt injection** and **real-time preference learning**.

### 🎯 **Core Mission**

To create consistent, personalized, and continuously improving AI collaboration experiences that adapt to individual developers and project needs,
eliminating the frustration of repetitive explanations and inconsistent AI behavior.

### 🎯 **Why Cortex?**

**The Problem:**

- AI models behave inconsistently across different platforms
- AI forgets user preferences and coding patterns
- Repetitive explanations of the same project conventions
- Lack of personalization in AI collaboration
- No memory of successful interaction patterns

**The Solution:**

- **🧠 Consistent AI Behavior** - Standardized thinking processes across all AI platforms
- **📚 Learning Memory** - Remembers user preferences and project patterns
- **🔄 Continuous Adaptation** - Evolves based on successful interactions
- **🎯 Context Awareness** - Understands project-specific conventions and workflows

### 🏗️ **Architecture**

```text
🧠 Brain Layer (AI Platform Integration)
├── MDC (Cursor) - Integrated editor rules
├── CLAUDE - Anthropic Claude system prompts
├── GEMINI - Google Gemini system prompts
├── Structured thinking processes
└── Cross-platform consistency

📚 Experience Layer (.cortex directory)
├── Invisible project configuration
├── User preference learning
├── Project pattern recognition
├── Convention adaptation
└── Continuous improvement

🛠️ Essential Tools
├── Prompt injection for AI enhancement
├── User preference detection and application
├── Cross-platform adapter system
└── Simplified CLI for core operations
```

### 🧠 **Core Principles**

**Cortex AI** implements proven principles for reliable AI collaboration:

1. **Few-Shot to Fine-Tune Transformation** - We transform simple few-shot examples into comprehensive fine-tune prompts automatically, eliminating the need for manual prompt engineering.

2. **Hook-Based Interception System** - Our architecture intercepts all user inputs and processes them through a structured pipeline that guarantees consistent quality and behavior.

3. **Deterministic Expansion Over Randomness** - Rather than relying on emergent behaviors, we systematically expand minimal user inputs into complete, well-structured instructions.

4. **Guaranteed Processing Pipeline** - Every user input is processed through our complete pipeline with 100% execution rate, ensuring no step is ever skipped.

5. **Explicit Reasoning and Documentation** - All transformations from few-shot to fine-tune are explicit, documented, and traceable through our workflow.

This philosophy drives our implementation of an intelligent system that transforms simple user inputs (few-shot examples) into comprehensive,
production-ready fine-tune prompts through mandatory processing steps.

#### MCP Workflow Architecture

```mermaid
graph TD
    A[User Input] --> B[Cursor Processing]
    B --> C{MCP Interceptor}
    C -->|Enforced Execution| D[MCP Workflow]
    D --> E[Intent Analysis]
    E --> F[Task Decomposition]
    F --> G[Role Selection]
    G --> H[Best Practice Search]
    H --> I[Instruction Generation]
    I --> J[User Response]

    subgraph "MCP Enforcement Mechanism"
    C
    K[.cursor/rules/cortex.mdc]
    L[prompt-injection.ts]
    M[thought-interceptor.ts]
    end

    K --> C
    L --> C
    M --> C
```

#### MCP Processing Sequence

```mermaid
sequenceDiagram
    participant User as User
    participant Cursor as Cursor AI
    participant Rules as .cursor/rules/cortex.mdc
    participant Interceptor as Thought Interceptor
    participant MCP as MCP Workflow
    participant Tools as MCP Tools

    User->>Cursor: Input Message
    Cursor->>Rules: Load Rules
    Rules->>Cursor: Enforce MCP Rules
    Cursor->>Interceptor: Intercept User Input
    Interceptor->>MCP: Force MCP Workflow Execution
    MCP->>Tools: Execute Intent Analysis
    Tools->>MCP: Return Intent Results
    MCP->>Tools: Execute Task Decomposition
    Tools->>MCP: Return Task Structure
    MCP->>Tools: Execute Role Selection
    Tools->>MCP: Return Role Assignments
    MCP->>Interceptor: Return Complete MCP Results
    Interceptor->>Cursor: Inject Structured Thinking
    Cursor->>User: Return MCP-Based Response
```

## ✨ **Core Features**

### **🧠 Structured Thinking**

- **6-Step Thinking Process**: Intent Exploration → Problem Analysis → Knowledge Integration → Solution Development → Implementation Planning → Quality Validation
- **Mandatory Protocol**: Forces AI to think systematically, regardless of model capabilities
- **Quality Validation**: Ensures complete and logical thinking

### **📚 Real-Time Learning**

- **User Preference Detection**: Learns from keywords like "wrong", "we use", "don't"
- **Immediate Application**: Applies learned preferences to current response
- **No Repetition**: Never repeats corrected mistakes
- **Frustration Detection**: Recognizes and learns from user frustration

### **🔄 Cross-Platform Consistency**

- **Cursor Integration**: Enhanced MDC with preference learning
- **Claude Support**: Context-aware system messages
- **Gemini Support**: Platform-specific prompt engineering
- **Unified Behavior**: Same learning and thinking across all platforms

## 🚀 **Quick Start**

### **Simple Task Execution (Recommended)**

Execute a complete development task with AI collaboration in one command:

```bash
# Execute a development task with full AI workflow
npx @rikaidev/cortex@latest task "Implement user authentication system with registration, login, and password reset"

# With PR options
npx @rikaidev/cortex@latest task "Add dark mode toggle to settings page" --draft-pr --base-branch develop
```

**What happens automatically:**

1. 🧠 **Context Enhancement**: Uses `enhance-context` MCP tool to find relevant past experiences
2. 📝 **Workflow Creation**: Uses `create-workflow` MCP tool to create structured multi-role workflow
3. 🎭 **Role Execution**: Uses `execute-workflow-role` MCP tool to execute each role in sequence
4. 📚 **Experience Recording**: Uses `record-experience` MCP tool to record learning for future tasks
5. 🚀 **PR Creation**: Uses `create-pull-request` MCP tool to generate complete PR documentation and create GitHub PR

### **Installation**

```bash
# Direct execution via npx (recommended)
npx @rikaidev/cortex@latest

# Or global installation
npm install -g @rikaidev/cortex
```

> **Note**: Using `@rikaidev/cortex@latest` ensures you always get the latest version without manual updates.

### **MCP Client Configuration**

Add the following config to your MCP client:

```json
{
  "mcpServers": {
    "cortex-ai": {
      "command": "npx",
      "args": ["-y", "@rikaidev/cortex@latest", "start"]
    }
  }
}
```

#### **Supported MCP Clients**

#### Claude Code

```bash
claude mcp add cortex-ai npx -y @rikaidev/cortex@latest start
```

#### Cursor

- Go to `Cursor Settings` → `MCP` → `New MCP Server`
- Use the config provided above

#### VS Code

```bash
code --add-mcp '{"name":"cortex-ai","command":"npx","args":["-y","@rikaidev/cortex@latest","start"]}'
```

#### Copilot CLI

```bash
copilot
/mcp add
# Server name: cortex-ai
# Command: npx
# Arguments: -y, @rikaidev/cortex@latest, start
```

### **Initialize Project**

```bash
# Initialize Cortex workspace structure and IDE integration
npx @rikaidev/cortex@latest init

# Or skip IDE integration if you only want workspace setup
npx @rikaidev/cortex@latest init --skip-ide

# Regenerate IDE configurations later (if needed)
npx @rikaidev/cortex@latest generate-rules
```

### **Initialize MCP Workspace** (Recommended)

For the latest Multi-Role Pattern workflow features:

```bash
# Initialize Cortex workspace structure
npx @rikaidev/cortex@latest init

# Start MCP server for workflow management
npx @rikaidev/cortex@latest start

# Run workflow demo to see Multi-Role Pattern in action
node examples/integrated-multi-role-demo.js
```

The new MCP approach creates isolated workspaces for each workflow:

```text
.cortex/
├── .cortexrc              # Configuration file
├── workflows/             # Workflow state files
├── workspaces/            # Individual workspace folders (hash-based)
│   └── abc12345/          # Unique workspace for each workflow
│       ├── handoff.md     # Role handoff documentation
│       └── pr.md          # Pull request description
└── roles/                 # Role definitions
```

### **MCP Tools Usage**

Once MCP server is running, you can use the following tools:

#### **Available Cortex MCP Tools**

| Tool                    | Description                                                   | Purpose                                        |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `enhance-context`       | Enhance current context with relevant past experiences        | Get better responses with historical context   |
| `record-experience`     | Record new experiences for future reference (auto-summarized) | Build knowledge base                           |
| `create-workflow`       | Create Multi-Role Pattern workflow for complex tasks          | Start collaborative development workflow       |
| `execute-workflow-role` | Execute next role in existing workflow                        | Continue workflow execution                    |
| `create-pull-request`   | Create GitHub PR using generated pr.md file                   | Automate PR creation after workflow completion |

#### **Experience Recording Optimization**

The `record-experience` tool automatically summarizes and optimizes content to keep the knowledge base concise:

- **Input summarization**: Questions/queries are condensed to 200 characters max
- **Output summarization**: Solutions are summarized to 500 characters max, keeping only key information
- **Automatic cleanup**: Removes excessive whitespace, redundant content, and verbose explanations
- **Smart extraction**: Preserves the first and last sentences, plus key middle content when space allows

**Example of automatic summarization:**

```text
Original: "I need to implement user authentication with registration, login, password reset, email verification, and proper security measures including
bcrypt hashing, JWT tokens, rate limiting, and input validation..."

Summarized: "Implement user authentication with registration, login, password reset, and proper security measures including bcrypt hashing, JWT tokens, rate limiting, and input validation."
```

#### **Workflow Management**

**1. Create a workflow for complex development tasks:**

```javascript
// Use MCP tool: create-workflow
{
  "title": "Implement user authentication system",
  "description": "Create complete user auth with registration, login, password reset",
  "issueId": "AUTH-001" // optional
}
```

**2. Execute workflow roles:**

```javascript
// Use MCP tool: execute-workflow-role
{
  "workflowId": "workflow-uuid-here"
}
```

**3. Generated files:**

- `handoff.md`: Role communication and handoff documentation
- `pr.md`: Complete PR documentation ready for submission

#### **Using Generated PR Documentation**

The `pr.md` file contains complete PR documentation ready for submission:

**Typical workflow:**

1. Complete the Multi-Role workflow (generates `pr.md`)
2. Copy content from `pr.md` to create GitHub/GitLab PR
3. The PR description will include all implementation details, testing notes, and review guidelines

**Example PR creation process:**

```bash
# After workflow completion, the pr.md file will be generated in:
# .cortex/workspaces/{workspace-id}/pr.md

# Copy the content and create PR manually on GitHub/GitLab
# Or use git commands to create PR if you have GitHub CLI:
gh pr create --title "Implement user authentication system" --body-file pr.md
```

**Future Enhancement:** Direct PR creation tools may be added in future versions to enable automated PR creation without external dependencies.

### **Publishing Workflow**

Follow this step-by-step process for stable releases:

#### **Pre-Publish Checklist**

**1. Update CHANGELOG.md with new version:**

```bash
# Add new version entry to CHANGELOG.md
# Example:
## [0.9.8] - 2025-10-02
### Added
- Add cortex task command with full MCP tools integration
- Implement intelligent experience summarization

### Changed
- Update MCP tools documentation
- Improve CLI user experience

### Fixed
- Fix various minor issues
```

**2. Set version and create git tag:**

```bash
# Check latest published version first
npm view @rikaidev/cortex version

# Set specific version (this also creates git tag)
npm version 0.9.8    # replace with your chosen version

# This command will:
# 1. Update package.json version
# 2. Update package-lock.json
# 3. Create git commit with message "0.9.8"
# 4. Create git tag "v0.9.8"
```

**3. Push commits and tags:**

```bash
# Push the version commit and tag
git push origin main
git push origin v0.9.8
```

**4. Run unified publish workflow:**

```bash
# Option A: Check only (recommended before manual publish)
npm run publish check

# Option B: Full workflow (check + publish)
npm run publish publish
```

### Alternative: Manual Steps

```bash
# Run quality checks only
npm run publish check

# Publish to npm manually
npm publish
```

#### **Release Quality Checks**

Run comprehensive quality checks before publishing:

```bash
# Run all release quality checks
npm run release:check
```

#### **Unpublish (if needed)**

To unpublish a version (use with caution):

```bash
# Unpublish a specific version
npm run release:unpublish 0.9.7
```

### **Start Learning**

```bash
# Start AI collaboration
npx @rikaidev/cortex@latest start

# Show version
npx @rikaidev/cortex@latest version
```

## 🎯 **How It Works**

### **1. Learning from Conversation**

```text
User: "Comments are in Chinese again?"
AI: [Learns] Write all comments in English
User: "we use uv run pytest"
AI: [Learns] Always use uv run for Python commands
User: "again"
AI: [Learns] Don't repeat the same mistake
```

### **2. Structured Thinking**

```text
🔍 ANALYSIS PHASE: [Problem understanding]
📚 KNOWLEDGE INTEGRATION: [Apply learned preferences]
💡 SOLUTION DEVELOPMENT: [Consider user preferences]
⚡ IMPLEMENTATION PLAN: [Respect user patterns]
✅ QUALITY VALIDATION: [Ensure preference compliance]
```

### **3. Cross-Platform Consistency**

- **Same learning** across Cursor, Claude, and Gemini
- **Same thinking** process on all platforms
- **Same preferences** applied everywhere
- **Same evolution** through conversation

## 📚 **Documentation**

- **[Getting Started](docs/getting-started.md)** - Quick setup guide
- **[AI Collaboration](docs/ai-collaboration/)** - System architecture and roles
- **[Experience Learning](docs/experiences/)** - Learning and improvement system
- **[Updates & Notifications](docs/updates/)** - Stay informed about changes
- **[Roadmap](ROADMAP.md)** - Future development plans

## 🛠️ **Development**

### **Prerequisites**

- Node.js 18+
- TypeScript knowledge

### **Setup**

```bash
# Clone repository
git clone https://github.com/RikaiDev/cortex.git
cd cortex

# Install dependencies
npm install

# Build project
npm run build

# Run code quality and security checks
npm run quality

# Run security checks only
npm run security

# Run tests
npm run test

# Start development
npm run dev
```

### **Contributing**

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Development Setup](docs/development/)

## 🎯 **Why "Cortex"?**

**Cortex (大腦皮質)** represents the brain's advanced cognitive functions:

- **🧠 Thinking** - Structured reasoning and problem-solving
- **📚 Memory** - Learning and storing experiences
- **🔄 Evolution** - Continuous improvement through experience
- **🎯 Decision** - Making informed choices based on learning

Just like the human cerebral cortex, **Cortex AI** is the "brain" for AI systems - responsible for thinking, memory, learning, and decision-making.

---

**Transform your AI interactions from frustrating repetitions to intelligent, learning partnerships with Cortex AI.**
