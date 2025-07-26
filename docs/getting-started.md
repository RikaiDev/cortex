# Getting Started with Cortex

> **Quick start guide for Cortex AI Collaboration Brain**

## 🚀 Installation

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Install Cortex

```bash
# Clone the repository
git clone https://github.com/RikaiDev/cortex.git
cd cortex

# Install dependencies
bun install

# Build the project
bun run build
```

## 🎯 Quick Start

### 1. Initialize Cortex in Your Project

```bash
# Navigate to your project directory
cd your-project

# Initialize Cortex
bun run cli init
```

This will create:

- `docs/ai-collaboration/` directory structure
- Sample role definitions
- Initial configuration files

### 2. Discover Roles and Patterns

```bash
# Discover existing roles and patterns
bun run cli discover
```

This will:

- Scan your project for existing roles
- Analyze coding patterns
- Provide recommendations

### 3. Generate IDE Configurations

```bash
# Generate IDE-specific configurations
bun run cli generate-ide
```

This creates:

- VSCode configuration with custom tasks
- Cursor AI settings with role definitions
- JetBrains inspection profiles
- Project knowledge documentation

### 4. Start AI Collaboration

```bash
# Start interactive session
bun run cli start
```

## 🎭 Using Roles

### Available Roles

Cortex comes with several pre-built roles:

- **Security Specialist** - Security analysis and vulnerability assessment
- **Architecture Designer** - System design and architectural patterns
- **Code Reviewer** - Code quality and best practices
- **Performance Optimizer** - Performance analysis and optimization
- **QA Tester** - Testing strategies and quality assurance
- **Product Manager** - Product strategy and requirements analysis

### Creating Custom Roles

```bash
# Generate a new role template
bun run cli generate-role --name "DevOps Engineer" --template "basic"
```

Edit the generated file in `docs/ai-collaboration/roles/devops-engineer.md`:

```markdown
---
name: "DevOps Engineer"
description: "DevOps and infrastructure specialist"
keywords: ["devops", "infrastructure", "deployment", "ci-cd"]
capabilities:
  - "CI/CD pipeline design"
  - "Infrastructure automation"
  - "Monitoring and logging"
version: "1.0.0"
tags: ["devops", "infrastructure"]
priority: 2
---

# Role: DevOps Engineer

## Description

Specialized in DevOps practices, infrastructure automation, and deployment strategies.

## Capabilities

- CI/CD pipeline design and implementation
- Infrastructure as Code (IaC)
- Container orchestration
- Monitoring and observability
- Security and compliance

## Keywords

devops, infrastructure, deployment, ci-cd, automation, monitoring, security

## Examples

### Pipeline Design

**Input:** "Design a CI/CD pipeline for this application"
**Output:** "I'll help you design a comprehensive CI/CD pipeline with proper testing, security scanning, and deployment strategies."
```

## 🛠️ IDE Integration

### VSCode Integration

1. Copy the generated VSCode configuration:

```bash
cp .cortex/vscode-config.json .vscode/settings.json
```

2. Install recommended extensions:

- Prettier
- ESLint
- TypeScript

3. Use Cortex commands in VSCode:

- `Ctrl+Shift+P` → "Cortex: Discover Roles"
- `Ctrl+Shift+P` → "Cortex: Start Collaboration"

### Cursor Integration

1. Copy the Cursor configuration:

```bash
cp .cortex/cursor-config.json .cursor/settings.json
```

2. Cursor will automatically use the role definitions for AI assistance

### JetBrains Integration

1. Import the inspection profile from `.cortex/jetbrains-config.json`
2. Apply the custom code analysis rules

## 📚 CLI Commands

### Core Commands

```bash
# Initialize Cortex in a project
bun run cli init

# Discover roles and patterns
bun run cli discover

# Generate IDE configurations
bun run cli generate-ide

# Create a new role
bun run cli generate-role --name "Role Name" --template "basic"

# Analyze project patterns
bun run cli analyze-patterns

# Start interactive session
bun run cli start
```

### Advanced Commands

```bash
# Discover with verbose output
bun run cli discover --verbose

# Generate role with specific template
bun run cli generate-role --name "Data Scientist" --template "security"

# Analyze patterns and save to file
bun run cli analyze-patterns --output patterns.json
```

## 🔧 Configuration

### Project Structure

```
your-project/
├── docs/ai-collaboration/
│   ├── roles/                 # Role definitions
│   ├── templates/             # Role templates
│   └── examples/              # Example implementations
├── .cortex/                   # Generated configurations
│   ├── vscode-config.json
│   ├── cursor-config.json
│   └── jetbrains-config.json
└── package.json
```

### Role Definition Format

Each role is defined in a markdown file with frontmatter:

```markdown
---
name: "Role Name"
description: "Role description"
keywords: ["keyword1", "keyword2"]
capabilities:
  - "Capability 1"
  - "Capability 2"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---

# Role: Role Name

## Description

Detailed role description...

## Capabilities

- Specific capabilities...

## Keywords

keyword1, keyword2, keyword3

## Examples

### Example 1

**Input:** "Example input"
**Output:** "Example output"
```

## 🚀 Advanced Usage

### Custom Role Templates

Create custom role templates in `docs/ai-collaboration/templates/`:

```markdown
# Custom Template

## Template Structure

- Frontmatter with role metadata
- Detailed description and capabilities
- Implementation guidelines
- Usage examples

## Best Practices

- Use clear, descriptive names
- Include relevant keywords
- Provide specific examples
- Consider project context
```

### IDE-Specific Rules

Cortex generates IDE-specific rules based on your roles:

- **VSCode**: Custom tasks and code analysis rules
- **Cursor**: AI role definitions and context
- **JetBrains**: Inspection profiles and code quality rules

### Pattern Analysis

Cortex automatically analyzes your project patterns:

```bash
# View discovered patterns
bun run cli analyze-patterns --output patterns.json

# Patterns include:
# - Naming conventions
# - Architectural patterns
# - Code organization
# - Technology stack usage
```

## 🐛 Troubleshooting

### Common Issues

1. **No roles discovered**
   - Ensure role files are in `docs/ai-collaboration/roles/`
   - Check markdown format and frontmatter
   - Run `bun run cli discover --verbose`

2. **IDE configuration not working**
   - Copy configuration files to correct locations
   - Restart your IDE
   - Check file permissions

3. **Build errors**
   - Run `bun install` to install dependencies
   - Check TypeScript compilation with `bun run build`
   - Verify Node.js version (18+)

### Getting Help

- Check the [README](../README.md) for overview
- Review [Contributing Guide](../CONTRIBUTING.md) for development
- Open an issue on GitHub for bugs
- Join our community for support

## 📈 Next Steps

1. **Explore Roles**: Try different roles for various tasks
2. **Customize**: Create project-specific roles
3. **Integrate**: Set up IDE configurations
4. **Collaborate**: Use Cortex in team workflows
5. **Contribute**: Help improve Cortex

---

**Ready to start? Run `bun run cli init` to begin your Cortex journey!**
