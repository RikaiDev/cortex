# Getting Started with Cortex AI

Welcome to Cortex AI! This guide will help you get up and running quickly with our intelligent AI collaboration system.

## Quick Start

### 1. Installation

The fastest way to get started is using npx:

```bash
# Direct execution (recommended)
npx @rikaidev/cortex@latest

# Or install globally
npm install -g @rikaidev/cortex
```

### 2. Initialize Your Project

```bash
# Initialize Cortex workspace
npx @rikaidev/cortex@latest init

# Skip IDE integration if needed
npx @rikaidev/cortex@latest init --skip-ide
```

### 3. Start AI Collaboration

```bash
# Start MCP server for workflow management
npx @rikaidev/cortex@latest start

# Execute a development task
npx @rikaidev/cortex@latest task "Implement user authentication system"
```

## MCP Client Setup

### Claude Code

```bash
claude mcp add cortex-ai npx -y @rikaidev/cortex@latest start
```

### Cursor

1. Go to `Cursor Settings` → `MCP` → `New MCP Server`
2. Add the following configuration:

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

### VS Code

```bash
code --add-mcp '{"name":"cortex-ai","command":"npx","args":["-y","@rikaidev/cortex@latest","start"]}'
```

## Understanding Cortex AI

### Core Principles

1. **Consistent AI Behavior** - Standardized thinking across all platforms
2. **Learning Memory** - Remembers your preferences and patterns
3. **Continuous Adaptation** - Evolves based on successful interactions
4. **Context Awareness** - Understands project-specific conventions

### How It Works

1. **Input Interception** - Every user input is processed before reaching AI
2. **Preference Learning** - Learns from keywords like "wrong", "we use", "don't"
3. **Structured Thinking** - Applies systematic reasoning processes
4. **Cross-Platform Consistency** - Same behavior across Cursor, Claude, and Gemini

## Next Steps

- [Architecture Guide](architecture.md) - Learn about system design
- [Code Patterns](code-patterns.md) - Understand coding guidelines
- [Development Setup](development/) - Set up your development environment

## Need Help?

- Check the [main README](../README.md) for comprehensive documentation
- Review [Contributing Guidelines](../CONTRIBUTING.md) for development
- Open an issue on GitHub for support
