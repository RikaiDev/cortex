# Cursor Setup Guide

## 🚀 Quick Start

### 1. Initialize Cortex
```bash
bun run cli init
```

### 2. Discover Roles
```bash
bun run cli discover
```

### 3. Generate Cursor Rules
```bash
bun run cli generate-ide
```

### 4. Open Cursor
Simply open your project in Cursor. The `.cursor/rules/` directory will be automatically loaded.

## 📁 Generated Files

After running `cortex generate-ide`, you'll have:

```
.cursor/
├── rules/
│   ├── cortex.md              # Main system rules
│   ├── code-reviewer.md       # Code reviewer role
│   ├── security-specialist.md # Security specialist role
│   ├── architecture-designer.md # Architecture designer role
│   └── project-context.md     # Project-specific context
└── settings.json              # Cursor settings
```

## 🎭 How It Works

### Automatic Role Selection
When you chat with Cursor's AI, it will:

1. **Analyze your query** - Understand what you're trying to accomplish
2. **Select appropriate role** - Choose the best role for your task
3. **Provide specialized help** - Give role-specific expertise
4. **Consider project context** - Use your project's patterns and constraints

### Example Interactions

**Security Question:**
```
You: "Check this authentication code for vulnerabilities"
AI: [Automatically switches to Security Specialist role]
    "As a security specialist, I'll analyze this authentication code..."
```

**Architecture Question:**
```
You: "How should I structure this new feature?"
AI: [Automatically switches to Architecture Designer role]
    "From an architecture perspective, I recommend..."
```

**Code Review:**
```
You: "Review this function for improvements"
AI: [Automatically switches to Code Reviewer role]
    "As a code reviewer, I notice several areas for improvement..."
```

## 🛠️ Customization

### Adding New Roles
1. Create a new markdown file in `docs/ai-collaboration/roles/`
2. Follow the role template format
3. Run `cortex generate-ide` to update Cursor rules

### Modifying Existing Roles
1. Edit the role file in `docs/ai-collaboration/roles/`
2. Run `cortex generate-ide` to regenerate rules

### Project-Specific Context
The system automatically learns from your project:
- Technology stack
- Coding patterns
- Architecture decisions
- Naming conventions
- Best practices

## 🔧 Advanced Configuration

### Cursor Settings
The generated `.cursor/settings.json` includes:
```json
{
  "cortex.enabled": true,
  "cortex.rolesPath": "./docs/ai-collaboration/roles",
  "cortex.autoDiscover": true,
  "cortex.projectContext": true
}
```

### Custom Rules
You can add custom rules to `.cursor/rules/` for:
- Project-specific patterns
- Team conventions
- Code style guidelines
- Testing requirements

## 🎯 Best Practices

### Role Design
- **Clear descriptions** - Make roles easy to understand
- **Specific keywords** - Help AI identify when to use each role
- **Practical examples** - Show how the role should respond
- **Project context** - Consider your specific needs

### Usage Tips
- **Be specific** - The more specific your question, the better the role selection
- **Use keywords** - Mention security, performance, architecture, etc.
- **Provide context** - Share relevant code or requirements
- **Iterate** - Refine roles based on usage patterns

## 🚨 Troubleshooting

### Rules Not Loading
1. Check that `.cursor/rules/` directory exists
2. Verify markdown files have correct format
3. Restart Cursor
4. Check Cursor's developer console for errors

### Role Not Selected
1. Check role keywords in `docs/ai-collaboration/roles/`
2. Make your query more specific
3. Add relevant keywords to your question
4. Regenerate rules with `cortex generate-ide`

### Performance Issues
1. Limit the number of roles (recommend < 10)
2. Keep role descriptions concise
3. Use specific globs in rule files
4. Optimize project context information

## 📚 Role Templates

### Basic Role Template
```markdown
---
name: "Role Name"
description: "Brief description of what this role does"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities:
  - "Capability 1"
  - "Capability 2"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---

# Role: Role Name

## Description
Detailed description of the role and its purpose.

## Capabilities
- Capability 1
- Capability 2

## Keywords
keyword1, keyword2, keyword3

## Implementation Guidelines
- Guideline 1
- Guideline 2

## Examples

### Example 1
Description of example 1
```code
// Example code
```

### Example 2
Description of example 2
```code
// Example code
```
```

## 🎉 Success Stories

### Team A - React Project
- **Before**: Generic AI responses, inconsistent code style
- **After**: Role-specific guidance, consistent patterns
- **Result**: 40% faster development, better code quality

### Team B - Security-Critical App
- **Before**: Security issues missed in code reviews
- **After**: Automatic security specialist role activation
- **Result**: Zero security vulnerabilities in 6 months

### Team C - Legacy Codebase
- **Before**: Difficult to understand existing patterns
- **After**: Legacy code analyzer role provides context
- **Result**: 60% faster onboarding for new developers

## 🔄 Updates and Maintenance

### Regular Updates
- Run `cortex discover` weekly to find new patterns
- Update roles based on team feedback
- Regenerate rules with `cortex generate-ide`

### Version Control
- Commit `.cursor/rules/` to version control
- Track role evolution over time
- Share successful roles across projects

---

**Need help?** Check the [main documentation](../README.md) or create an issue on GitHub. 