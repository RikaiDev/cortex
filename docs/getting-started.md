# 🚀 Quick Start Guide

Get Cortex AI up and running in your project in under 2 minutes!

## 📋 Prerequisites

- Node.js 18+ or Bun
- Git (for version control)

## ⚡ Super Quick Setup

### 1. Install Cortex

```bash
# Choose your preferred method:

# Option A: npm (recommended)
npm install -g @rikaidev/cortex

# Option B: bun
bun add -g @rikaidev/cortex

# Option C: direct download
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### 2. Setup in Your Project

```bash
# Navigate to your project
cd your-project

# One command setup
cortex setup
```

That's it! 🎉 Cortex is now ready to use.

## 🎯 What Just Happened?

Cortex automatically:

1. **Detected your project type** (Frontend, Backend, Python, etc.)
2. **Created AI roles** specific to your project needs
3. **Generated IDE configurations** for seamless AI integration
4. **Set up the collaboration structure** in your project

## 🚀 Start Using Cortex

### Option 1: Interactive Mode (Global CLI)

```bash
cortex start
```

### Option 2: Interactive Mode (NPM Scripts)

```bash
npm run cortex:start
```

### Option 3: IDE Integration

Open your IDE (Cursor, VS Code, etc.) - configurations are already set up!

### Option 4: Command Line

#### Global CLI

```bash
# Discover what Cortex found
cortex discover

# Generate additional IDE configs
cortex generate-ide
```

#### NPM Scripts

```bash
# Discover what Cortex found
npm run cortex:discover

# Generate additional IDE configs
npm run cortex:generate-ide
```

## 📁 What Was Created

Your project now has:

```
your-project/
├── docs/
│   └── ai-collaboration/
│       ├── roles/           # AI role definitions
│       │   ├── code-assistant.md
│       │   ├── code-reviewer.md
│       │   └── [project-specific].md
│       ├── templates/       # Role templates
│       └── examples/        # Example implementations
├── .cursor/                 # Cursor IDE configuration
├── .vscode/                 # VS Code configuration
└── .cortex/                 # Cortex configuration
```

## 🎭 Your AI Roles

Based on your project type, Cortex created these roles:

### All Projects

- **Code Assistant**: General development help
- **Code Reviewer**: Code quality and best practices

### Frontend Projects

- **Frontend Specialist**: UI/UX, React, Vue, etc.

### Backend Projects

- **Backend Specialist**: API design, databases, server architecture

### Python Projects

- **Python Specialist**: Python best practices, frameworks

## 💬 Start Chatting

Now you can ask questions and Cortex will automatically select the best role:

### In Your IDE

- Open Cursor, VS Code, or your preferred IDE
- Start chatting with AI - roles are automatically loaded
- Ask questions like:
  - "Review this code for security issues"
  - "Help me optimize this function"
  - "Design an API for this feature"

### In Terminal

#### Global CLI

```bash
cortex start
```

#### NPM Scripts

```bash
npm run cortex:start
```

Then ask questions like:

- "What roles are available?"
- "Help me with this bug"
- "Review this code"

## 🔧 Customization

### Add Custom Roles

Edit files in `docs/ai-collaboration/roles/`:

```markdown
---
name: "My Custom Role"
description: "Specialized for my project needs"
keywords: ["custom", "specialized"]
capabilities:
  - "Custom capability 1"
  - "Custom capability 2"
version: "1.0.0"
---

# Role: My Custom Role

## Description

Your custom role description...

## Capabilities

- Capability 1
- Capability 2
```

### Modify Existing Roles

Edit any role file in `docs/ai-collaboration/roles/` to customize behavior.

## 🆘 Troubleshooting

### Installation Issues

```bash
# Check if Cortex is installed
cortex --version

# Reinstall if needed
npm uninstall -g @rikaidev/cortex
npm install -g @rikaidev/cortex
```

### Setup Issues

```bash
# Check project structure
ls -la docs/ai-collaboration/

# Re-run setup
cortex setup

# Or start fresh
rm -rf docs/ai-collaboration/ .cursor/ .vscode/
cortex setup
```

### IDE Integration Issues

```bash
# Regenerate IDE configs
cortex generate-ide

# Check if configs exist
ls -la .cursor/ .vscode/
```

## 🎯 Next Steps

1. **Explore your roles**: Check `docs/ai-collaboration/roles/`
2. **Start chatting**: Use `cortex start` or your IDE
3. **Customize**: Edit role definitions to match your needs
4. **Share**: Commit your role definitions to share with your team

## 📚 Learn More

- [Role Authoring Guide](role-authoring.md)
- [Advanced Configuration](advanced-config.md)
- [Best Practices](best-practices.md)
- [API Reference](api-reference.md)

---

**Need help?** Check our [GitHub Issues](https://github.com/RikaiDev/cortex/issues) or [Discussions](https://github.com/RikaiDev/cortex/discussions).
