# 🚀 Quick Start Guide

Get Cortex AI up and running in your project in under 2 minutes!

## 🎯 **What is Cortex AI?**

**Cortex AI** transforms AI models into intelligent, learning partners by:

- **🧠 Brain** - Structured thinking through prompt injection
- **📚 Experience** - Real-time learning from user feedback
- **🔄 Evolution** - Continuous improvement without repeating mistakes

## 📋 Prerequisites

- Node.js 18+
- Git (for version control)

## ⚡ Super Quick Setup

### 1. Install Cortex

```bash
# Choose your preferred method:

# Option A: npm (recommended)
npm install -g @rikaidev/cortex

# Option B: using npx (no global installation needed)
npx @rikaidev/cortex

# Option C: direct download
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### 2. Setup in Your Project

```bash
# Navigate to your project
cd your-project

# Initialize Cortex workspace (use the new MCP approach)
cortex mcp init

# Generate IDE configurations
cortex generate-ide
```

That's it! 🎉 Cortex is now ready to use.

## 🎯 What Just Happened?

Cortex automatically:

1. **Created the brain structure** - Prompt injection for structured thinking
2. **Set up experience system** - Long-term memory and learning
3. **Generated IDE configurations** - For Cursor, Claude, and Gemini
4. **Prepared learning environment** - Ready to learn from your preferences

## 🚀 Start Using Cortex

### Option 1: IDE Integration (Recommended)

```bash
# Generate IDE configurations
cortex generate-ide

# Open your IDE and start coding!
# The AI will learn from your feedback automatically
```

### Option 2: Interactive Mode

```bash
cortex start
```

## 📁 What Was Created

Your project now has:

```
your-project/
├── .cortex/
│   ├── docs/                # Generated documentation
│   ├── experiences/         # Learning experiences
│   └── cortex.json         # Project configuration
├── .cursor/
│   └── rules/
│       └── cortex.mdc       # Cursor AI rules
├── CLAUDE                   # Claude system message
└── GEMINI                   # Gemini prompt template
```

## 🧠 How It Works

### **Learning from Conversation**

```
User: "Comments are in Chinese again?"
AI: [Learns] Write all comments in English

User: "we use uv run pytest"
AI: [Learns] Always use uv run for Python commands

User: "again"
AI: [Learns] Don't repeat the same mistake
```

### **Structured Thinking**

The AI follows a 6-step thinking process:

1. **Intent Exploration** - What does the user REALLY want to achieve?
2. **Problem Analysis** - Understanding the issue
3. **Knowledge Integration** - Applying learned preferences
4. **Solution Development** - Considering user patterns
5. **Implementation Planning** - Respecting user preferences
6. **Quality Validation** - Ensuring preference compliance

## 🎯 Next Steps

1. **Start coding** - The AI will learn from your feedback
2. **Provide feedback** - Use keywords like "wrong", "we use", "don't"
3. **Watch it learn** - The AI will remember and apply your preferences
4. **Enjoy consistency** - Same learning across all AI platforms

## 🔧 Available Commands

### Basic Commands

```bash
# Initialize Cortex workspace (recommended)
cortex mcp init

# Generate IDE configurations
cortex generate-ide

# Start AI collaboration
cortex start

# Show version
cortex version
```

### MCP Commands (Multi-Role Pattern)

```bash
# Initialize MCP workspace structure
cortex mcp init

# Start MCP server for workflow management
cortex mcp start

# List available MCP tools
cortex mcp tools

# Run workflow demo
node examples/integrated-multi-role-demo.js
```

## 🎯 **Why This Works**

**Traditional AI**: Forgets preferences, repeats mistakes, inconsistent behavior

**Cortex AI**:

- ✅ **Learns from feedback** - Remembers your preferences
- ✅ **Structured thinking** - Follows systematic approach
- ✅ **Cross-platform consistency** - Same behavior everywhere
- ✅ **Continuous evolution** - Gets better with every interaction

---

**Transform your AI interactions from frustrating repetitions to intelligent, learning partnerships!**
