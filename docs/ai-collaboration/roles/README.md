[English](README.md) | [繁體中文](../i18n/zh-TW/README.md)

# AI Collaboration Roles

## Overview

This directory contains role definitions for the AI Collaboration Central Brain. Each role is defined in a markdown file with YAML frontmatter and follows a consistent template structure.

## 🎯 Role System Overview

### **Current Role Structure**

Our AI collaboration system now includes **8 focused roles** designed to handle all aspects of development:

- **Core Coordination**: Task coordination and experience management
- **Development**: Code assistance, review, and performance optimization
- **Project Management**: Planning, quality assurance, and testing
- **Knowledge Management**: Learning and documentation curation

### **Consolidated Role System**

We've successfully consolidated from 21 roles to 8 focused roles that provide better tool awareness and project-specific adaptation:

#### **Core Roles (5 Essential)**

1. **[Task Coordinator](task-coordinator.md)** - Orchestrates complex tasks and role coordination
2. **[Code Assistant](code-assistant.md)** - General development and coding tasks
3. **[Code Reviewer](code-reviewer.md)** - Code quality, security, and best practices
4. **[Architecture Designer](architecture-designer.md)** - System design and technical decisions
5. **[Experience Curator](experience-curator.md)** - Learning, documentation, and knowledge management

#### **Specialized Roles (3 Context-Specific)**

6. **[Project Manager](project-manager.md)** - Project planning, timelines, and coordination
7. **[QA Tester](qa-tester.md)** - Testing, validation, and quality assurance
8. **[Performance Optimizer](performance-optimizer.md)** - Performance analysis and optimization

### **Key Benefits**

- **Focused Expertise**: Each role has clear, specific responsibilities
- **Tool Awareness**: Automatic detection and use of project-specific tools
- **Context Adaptation**: Roles adapt to your project's environment and patterns
- **Organic Growth**: System learns and evolves based on your project's needs

## Enhanced MDC Design Principles

### **1. Project-Specific Tool Configuration**

```yaml
project_tools:
  package_manager: "uv" # or "npm", "yarn", "pnpm"
  build_tool: "nx" # or "vite", "webpack", "rollup"
  test_framework: "jest" # or "vitest", "mocha"
  lint_tool: "eslint" # or "prettier", "stylelint"
  container_tool: "docker" # or "podman", "kubernetes"
```

### **2. Environment Detection**

```yaml
environment:
  runtime: "node" # or "python", "go", "rust"
  framework: "react" # or "vue", "angular", "express"
  database: "postgresql" # or "mongodb", "redis"
  deployment: "docker" # or "kubernetes", "serverless"
```

### **3. Organic Growth Mechanism**

- **Documentation Scanning**: Automatically read project docs for context
- **Pattern Recognition**: Learn from existing code patterns
- **Tool Detection**: Auto-detect project tools and configurations
- **Role Adaptation**: Modify role behavior based on project context

### **4. Stable MDC Updates**

- **Version Control**: Track MDC changes with semantic versioning
- **Change Validation**: Require review for significant changes
- **Backward Compatibility**: Ensure changes don't break existing workflows
- **Gradual Evolution**: Implement changes incrementally

## Role Definition Format

Each role follows this enhanced structure:

```yaml
---
name: "Role Name"
description: "Brief description of the role's purpose"
capabilities:
  - "Capability 1"
  - "Capability 2"
keywords:
  - "keyword1"
  - "keyword2"
tools:
  - name: "tool_name"
    command: "actual_command"
    context: "when_to_use"
    project_specific: true
metadata:
  category: "Core|Specialized"
  complexity: "Simple|Medium|Complex"
  priority: "High|Medium|Low"
  version: "1.0.0"
  last_updated: "2025-01-XX"
---
```

## Tool-Aware Role Selection

### **Enhanced Role Discovery**

```yaml
tool_patterns:
  python:
    - package_manager: "uv"
    - test_command: "uv run pytest"
    - lint_command: "uv run ruff check"
  javascript:
    - package_manager: "npm"
    - build_command: "nx build"
    - test_command: "nx test"
  docker:
    - build_command: "docker build"
    - run_command: "docker run"
    - compose_command: "docker-compose"
```

### **Context-Aware Commands**

```yaml
context_commands:
  development:
    - context: "python_project"
      command: "uv run python -m module"
    - context: "nx_project"
      command: "nx run project:target"
    - context: "docker_project"
      command: "docker-compose up"
```

## How It Works

### **Automatic Role Selection**

The system automatically selects the best role for your task by:

1. **Analyzing your request** - Understanding what you need to accomplish
2. **Detecting project context** - Reading your project's tools and patterns
3. **Matching to roles** - Finding the role with the right expertise
4. **Providing specialized help** - Giving you role-specific guidance

### **Tool-Aware Commands**

The AI automatically detects and uses your project's specific tools:

- **Python projects**: Uses `uv run` instead of `python -m`
- **Nx workspaces**: Uses `nx run` instead of `npm run`
- **Docker projects**: Uses `docker-compose` for development
- **Custom scripts**: Detects and uses your project's scripts

## Quality Standards

### **Role Design Principles**

- **Clear Purpose**: Each role must have a well-defined, specific purpose
- **Tool Awareness**: Roles must be aware of project-specific tools
- **Context Adaptation**: Roles must adapt to project context
- **Consistent Format**: All roles must follow the same structure
- **Practical Examples**: Include real-world usage examples

### **MDC Design Principles**

- **Stability**: Minimize frequent changes to MDC
- **Organic Growth**: Allow natural evolution based on project needs
- **Tool Integration**: Seamlessly integrate with project tools
- **Context Awareness**: Adapt to project environment and patterns
- **Performance**: Optimize for fast role selection and execution

---

**This enhanced role system provides a more focused, tool-aware, and organically growing AI collaboration framework that adapts to project needs while maintaining stability and consistency.**
