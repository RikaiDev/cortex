# 🧠 Cortex - AI Collaboration Brain

> **"Every project deserves its own AI brain"**

Cortex is an intelligent AI collaboration system that automatically discovers and adapts to your project's unique needs through dynamic role discovery and document-driven learning.

## 🚀 Core Features

- **🧭 Dynamic Role Discovery** - Automatically learns roles from your project documentation
- **📚 Document-Driven Learning** - All AI behavior derived from project docs, no hardcoding
- **🔄 Self-Evolving Intelligence** - Adapts automatically as your project grows
- **🎯 Project-Native Intelligence** - Understands your specific architecture and patterns
- **⚡ Zero Maintenance** - Just update docs, AI behavior updates automatically
- **🛠️ IDE Integration** - Generates IDE-specific configurations and rules

## 🏗️ Architecture

```
Cortex/
├── core/                    # Core engine components
│   ├── role-discovery.ts    # Dynamic role discovery engine
│   ├── role-selector.ts     # Intelligent role selection
│   ├── ide-adapter.ts       # IDE configuration generation
│   └── types.ts            # Type definitions
├── cli/                     # Command line interface
├── docs/ai-collaboration/   # Project documentation
│   ├── roles/              # Role definitions
│   ├── templates/          # Role templates
│   └── examples/           # Example implementations
└── .cortex/                # Generated IDE configurations
```

## 🎯 How It Works

### 1. **Document-Driven Role Discovery**
Cortex scans your `docs/ai-collaboration/roles/` directory and automatically learns:
- Role definitions and capabilities
- Project-specific patterns and conventions
- Technical requirements and constraints

### 2. **IDE Configuration Generation**
Based on discovered roles and patterns, Cortex generates:
- **VSCode** configurations with custom rules and tasks
- **Cursor** AI settings with role-aware assistance
- **JetBrains** inspection profiles and settings
- Project-specific coding rules and patterns

### 3. **Intelligent Role Selection**
When you ask questions, Cortex automatically:
- Analyzes your query for keywords and context
- Selects the most appropriate AI role
- Provides specialized, project-aware responses

## 🛠️ Quick Start

### 1. Initialize Cortex in your project

```bash
bun run cortex init
```

### 2. Create your first role

```markdown
# docs/ai-collaboration/roles/security-specialist.md

---
name: "Security Specialist"
description: "Expert in application security and vulnerability assessment"
keywords: ["security", "vulnerability", "authentication"]
capabilities:
  - "Code security analysis"
  - "Vulnerability assessment"
  - "Security best practices guidance"
version: "1.0.0"
tags: ["security", "safety"]
priority: 2
---

# Role: Security Specialist

## Description
A specialized AI assistant focused on application security...

## Capabilities
- Code security analysis and review
- Vulnerability assessment and identification
- Security best practices guidance

## Keywords
security, vulnerability, authentication, authorization, encryption

## Examples

### Security Code Review
**Input:** "Review this authentication function for security issues"
**Output:** "I'll analyze this authentication function for common security vulnerabilities..."
```

### 3. Discover roles and generate IDE configurations

```bash
# Discover roles and patterns
bun run cortex discover

# Generate IDE configurations
bun run cortex generate-ide
```

### 4. Start collaborating with AI

```bash
# Interactive session
bun run cortex start

# Or use in your IDE with generated configurations
```

## 🎭 Supported IDEs

### **VSCode Integration**
- Custom tasks for Cortex commands
- Role-aware code suggestions
- Project-specific linting rules
- Auto-generated launch configurations

### **Cursor Integration**
- AI role definitions for Cursor AI
- Project pattern recognition
- Context-aware assistance
- Custom AI prompts based on roles

### **JetBrains Integration**
- Custom inspection profiles
- Project-specific code analysis
- Role-based code suggestions
- Integrated Cortex commands

## 📚 CLI Commands

```bash
# Initialize Cortex in your project
cortex init

# Discover roles and patterns
cortex discover

# Generate IDE configurations
cortex generate-ide

# Create a new role template
cortex generate-role --name "Data Scientist" --template "basic"

# Analyze project patterns
cortex analyze-patterns

# Start interactive collaboration
cortex start
```

## 🧩 Role Templates

Cortex provides several role templates to get you started:

- **Basic Assistant** - General-purpose development help
- **Security Specialist** - Security and vulnerability assessment
- **Architecture Designer** - System design and patterns
- **Code Reviewer** - Code quality and best practices
- **Performance Optimizer** - Performance analysis and optimization

## 📁 Generated Files

After running `cortex generate-ide`, you'll get:

```
.cortex/
├── vscode-config.json      # VSCode settings and tasks
├── cursor-config.json      # Cursor AI configuration
└── jetbrains-config.json   # JetBrains inspection profiles

docs/ai-collaboration/
└── project-knowledge.json  # Structured project knowledge
```

## 🚀 Advanced Usage

### Custom Role Creation
```bash
# Generate a custom role
cortex generate-role --name "DevOps Engineer" --template "basic"

# Edit the generated role file
# docs/ai-collaboration/roles/devops-engineer.md
```

### Pattern Analysis
```bash
# Analyze coding patterns
cortex analyze-patterns --output patterns.json

# View discovered patterns
cat patterns.json
```

### IDE-Specific Configuration
```bash
# Generate configurations for specific IDE
cortex generate-ide

# Copy generated configs to your IDE
cp .cortex/vscode-config.json .vscode/settings.json
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Role Authoring Guide](docs/role-authoring.md)
- [Best Practices](docs/best-practices.md)
- [API Reference](docs/api-reference.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🚀 Roadmap

- [ ] **Phase 1: MVP** - Core role discovery and IDE integration
- [ ] **Phase 2: Ecosystem** - Multi-IDE support, role marketplace
- [ ] **Phase 3: Platform** - Cross-project knowledge sharing

---

**Made with ❤️ by RikaiDev** 