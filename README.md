# Cortex AI

[![Version](https://img.shields.io/badge/version-v0.8.0-blue.svg)](https://github.com/RikaiDev/cortex/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/runtime-Node.js-green.svg)](https://nodejs.org/)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/) | [Updates](docs/updates/) | [Changelog](CHANGELOG.md)

## 🧠 AI Collaboration Brain

**Cortex AI** is an intelligent AI collaboration system that transforms AI models into reliable, learning partners. It solves the fundamental problems of AI inconsistency and lack of memory through **prompt injection** and **real-time preference learning**.

### 🎯 **Core Mission**

To create consistent, personalized, and continuously improving AI collaboration experiences that adapt to individual developers and project needs, eliminating the frustration of repetitive explanations and inconsistent AI behavior.

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

```
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

This philosophy drives our implementation of an intelligent system that transforms simple user inputs (few-shot examples) into comprehensive, production-ready fine-tune prompts through mandatory processing steps.

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

### **Installation**

```bash
# Global installation
npm install -g @rikaidev/cortex

# Or using npx
npx @rikaidev/cortex
```

### **Initialize Project**

```bash
# Initialize Cortex AI in your project
cortex init

# Generate IDE configurations
cortex generate-ide
```

### **Start Learning**

```bash
# Start AI collaboration
cortex start

# Show version
cortex version
```

## 🎯 **How It Works**

### **1. Learning from Conversation**

```
User: "Comments are in Chinese again?"
AI: [Learns] Write all comments in English
User: "we use uv run pytest"
AI: [Learns] Always use uv run for Python commands
User: "again"
AI: [Learns] Don't repeat the same mistake
```

### **2. Structured Thinking**

```
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
