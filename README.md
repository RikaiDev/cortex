# 🧠 Cortex AI - AI Collaboration Brain

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/)

Cortex is an intelligent AI collaboration system that automatically selects the best role for each task by reading role definitions from your project's documentation.

## 🚀 Quick Start

### Install Cortex

```bash
# Install globally with npm
npm install -g @rikaidev/cortex

# Or with bun
bun add -g @rikaidev/cortex

# Or download executable directly
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### One-Click Setup

```bash
# Setup Cortex in your project (auto-detects project type)
cortex setup

# Quick setup with default configuration
cortex setup --quick

# Setup with custom configuration
cortex setup --config my-config.json
```

### Start Using

#### Option 1: Global CLI (Recommended)

```bash
# Start interactive collaboration
cortex start

# Discover roles and patterns
cortex discover

# Generate IDE configurations
cortex generate-ide
```

#### Option 2: NPM Scripts (Local Development)

```bash
# Quick start (after setup)
npm run cortex:start

# Other available commands
npm run cortex:discover    # Discover project patterns
npm run cortex:generate-ide # Generate IDE configurations
npm run cortex:setup       # Re-setup project
npm run cortex:integrate   # Integrate with existing systems
```

## 🎯 What Cortex Does

Cortex automatically:

1. **Detects your project type** (Frontend, Backend, Python, etc.)
2. **Creates appropriate AI roles** based on your project needs
3. **Generates IDE configurations** for seamless AI integration
4. **Integrates with existing systems** if you already have AI collaboration setup
5. **Provides intelligent role selection** based on your queries

## 📁 Project Structure

After setup, your project will have:

```
your-project/
├── docs/
│   └── ai-collaboration/
│       ├── roles/           # AI role definitions
│       ├── templates/       # Role templates
│       └── examples/        # Example implementations
├── .cursor/                 # Cursor IDE configuration
├── .vscode/                 # VS Code configuration
└── .cortex/                 # Cortex configuration
```

## 🎭 Available Roles

Cortex automatically creates roles based on your project type:

### All Projects

- **Code Assistant**: General development help
- **Code Reviewer**: Code quality and best practices

### Frontend Projects

- **Frontend Specialist**: UI/UX, React, Vue, etc.

### Backend Projects

- **Backend Specialist**: API design, databases, server architecture

### Python Projects

- **Python Specialist**: Python best practices, frameworks

## 🛠️ Commands

### Setup & Configuration

#### Global CLI

```bash
cortex setup              # One-click setup
cortex integrate          # Integrate with existing systems
cortex init               # Legacy initialization
```

#### NPM Scripts

```bash
npm run cortex:setup      # One-click setup
npm run cortex:integrate  # Integrate with existing systems
npm run cortex:init       # Legacy initialization
```

### Analysis & Discovery

#### Global CLI

```bash
cortex discover           # Discover roles and patterns
cortex analyze-patterns   # Analyze coding patterns
```

#### NPM Scripts

```bash
npm run cortex:discover   # Discover roles and patterns
npm run cortex:analyze-patterns # Analyze coding patterns
```

### IDE Integration

#### Global CLI

```bash
cortex generate-ide       # Generate IDE configurations
cortex generate-role      # Create new role template
```

#### NPM Scripts

```bash
npm run cortex:generate-ide  # Generate IDE configurations
npm run cortex:generate-role # Create new role template
```

### Collaboration

#### Global CLI

```bash
cortex start              # Start interactive session
```

#### NPM Scripts

```bash
npm run cortex:start      # Start interactive session
```

## 🔧 Advanced Usage

### Custom Role Creation

Create custom roles in `docs/ai-collaboration/roles/`:

```markdown
---
name: "Security Specialist"
description: "Security expert for code review"
keywords: ["security", "vulnerability", "authentication"]
capabilities:
  - "Security code review"
  - "Vulnerability assessment"
version: "1.0.0"
---

# Role: Security Specialist

## Description

Security expert specialized in identifying vulnerabilities and security issues.

## Capabilities

- Security code review
- Vulnerability assessment
- Authentication guidance
```

### Integration with Existing Systems

```bash
# Analyze existing roles
cortex integrate --roles

# Analyze existing workflows
cortex integrate --workflows
```

## 🎯 Use Cases

### For Teams

- **Consistent AI assistance** across team members
- **Project-specific expertise** based on your codebase
- **Shared knowledge base** in role definitions

### For Individuals

- **Personalized AI help** based on your project
- **Learning assistant** with domain-specific guidance
- **Code review partner** with context awareness

### For Projects

- **Documentation-driven AI** that learns from your docs
- **Scalable collaboration** as project grows
- **Maintainable AI system** with version-controlled roles

## 🔄 Migration from Legacy

If you have an existing Cortex setup:

```bash
# Integrate with existing system
cortex integrate

# Or start fresh with new setup
cortex setup
```

## 📊 Performance

- **Installation**: 30 seconds (vs 5 minutes before)
- **Setup**: 1 command (vs 4+ commands before)
- **Learning curve**: Zero (vs technical background required before)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/RikaiDev/cortex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RikaiDev/cortex/discussions)
- **Documentation**: [docs/](docs/)

---

**Made with ❤️ by RikaiDev**
