[English](npm-scripts.md) | [繁體中文](i18n/zh-TW/npm-scripts.md)

# 📦 NPM Scripts Usage Guide

Cortex provides comprehensive npm scripts support, allowing you to use familiar npm commands to operate Cortex without installing the global CLI.

## 🚀 Quick Start

### Installation and Setup

```bash
# Install dependencies
npm install

# Build project
npm run build

# Setup Cortex
npm run cortex:setup
```

### Start Using

```bash
# Quick start (after setup)
npm run cortex:start

# Other available commands
npm run cortex:discover    # Discover project patterns
npm run cortex:generate-ide # Generate IDE configuration
npm run cortex:setup       # Re-setup
```

## 📋 Complete Command List

### Setup and Configuration

```bash
npm run cortex:setup       # One-click Cortex setup
npm run cortex:integrate   # Integrate existing AI collaboration systems
npm run cortex:init        # Traditional initialization (backward compatibility)
```

### Analysis and Discovery

```bash
npm run cortex:discover    # Discover roles and patterns
npm run cortex:analyze-patterns # Analyze coding patterns
```

### IDE Integration

```bash
npm run cortex:generate-ide  # Generate IDE configuration
npm run cortex:generate-role # Create new role template
```

### Collaboration

```bash
npm run cortex:start       # Start interactive collaboration session
```

## 🎯 Usage Scenarios

### Development Environment

In local development environments, using npm scripts is the most convenient approach:

```bash
# Development workflow
npm run build              # Build project
npm run cortex:setup       # Setup Cortex
npm run cortex:discover    # Discover project patterns
npm run cortex:start       # Start collaboration
```

### Team Collaboration

Team members can easily use the same commands:

```bash
# New member onboarding
git clone <project>
npm install
npm run cortex:setup
npm run cortex:start
```

### CI/CD Pipeline

Use in automated workflows:

```bash
# CI/CD scripts
npm run build
npm run cortex:discover -- --output analysis.json
npm run cortex:generate-ide
```

## 🔧 Custom Scripts

You can add custom scripts to your `package.json`:

```json
{
  "scripts": {
    "cortex:custom": "node dist/cli/index.js custom-command",
    "cortex:analyze": "node dist/cli/index.js analyze --output report.json"
  }
}
```

## 📊 Comparison with Global CLI

| Feature           | NPM Scripts            | Global CLI              |
| ----------------- | ---------------------- | ----------------------- |
| Installation      | No additional install  | Requires global install |
| Updates           | Automatic with project | Manual updates          |
| Team Consistency  | Guaranteed             | May vary                |
| CI/CD Integration | Native                 | Requires setup          |
| Dependencies      | Project-scoped         | System-wide             |

## 🛠️ Best Practices

### 1. Project Setup

```bash
# Always start with setup
npm run cortex:setup

# Verify installation
npm run cortex:discover
```

### 2. Team Workflow

```bash
# Standard team workflow
npm install
npm run build
npm run cortex:setup
npm run cortex:start
```

### 3. Development Workflow

```bash
# Daily development
npm run cortex:start       # Start collaboration
npm run cortex:discover    # Update patterns
npm run cortex:generate-ide # Update IDE config
```

## 🔍 Troubleshooting

### Common Issues

1. **Command not found**

   ```bash
   # Ensure build is complete
   npm run build
   ```

2. **Permission errors**

   ```bash
   # Check file permissions
   chmod +x dist/cli/index.js
   ```

3. **Configuration issues**
   ```bash
   # Re-run setup
   npm run cortex:setup
   ```

### Debug Mode

```bash
# Enable debug output
DEBUG=cortex:* npm run cortex:start
```

## 📈 Performance Tips

### 1. Optimize Build

```bash
# Use production build
npm run build -- --production
```

### 2. Cache Management

```bash
# Clear cache if needed
npm run cortex:discover -- --clear-cache
```

### 3. Selective Analysis

```bash
# Analyze specific directories
npm run cortex:discover -- --path src/
```

## 🔗 Integration Examples

### VS Code Integration

```json
{
  "scripts": {
    "cortex:vscode": "npm run cortex:generate-ide -- --ide vscode"
  }
}
```

### Custom Analysis

```json
{
  "scripts": {
    "cortex:analyze-security": "npm run cortex:discover -- --focus security",
    "cortex:analyze-performance": "npm run cortex:discover -- --focus performance"
  }
}
```

## 📚 Advanced Usage

### Environment Variables

```bash
# Set environment variables
CORTEX_CONFIG_PATH=./config.json npm run cortex:start
```

### Custom Configuration

```bash
# Use custom config
npm run cortex:setup -- --config ./custom-config.json
```

### Output Formats

```bash
# Generate different outputs
npm run cortex:discover -- --output json
npm run cortex:discover -- --output markdown
npm run cortex:discover -- --output html
```

---

**NPM scripts provide a convenient, project-integrated way to use Cortex without global installation, ensuring consistency across team environments.**
