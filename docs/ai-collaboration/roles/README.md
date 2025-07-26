[English](README.md) | [繁體中文](../i18n/zh-TW/README.md)

# AI Collaboration Roles

## Overview

This directory contains role definitions for the AI Collaboration Central Brain. Each role is defined in a markdown file with YAML frontmatter and follows a consistent template structure.

## Role Categories

### **Core Coordination Roles**
- **[Task Coordinator](task-coordinator.md)** - Orchestrates complex tasks by intelligently selecting and coordinating multiple AI roles
- **[Experience Curator](experience-curator.md)** - Systematically collects, analyzes, and transforms development experiences into actionable knowledge

### **Development Roles**
- **[Code Reviewer](code-reviewer.md)** - Comprehensive code quality analysis and improvement recommendations
- **[QA Tester](qa-tester.md)** - End-to-end testing, edge case analysis, and test strategy
- **[Architecture Designer](architecture-designer.md)** - System design, API design, and component structure
- **[Security Specialist](security-specialist.md)** - Security analysis, vulnerability assessment, and security best practices
- **[Performance Optimizer](performance-optimizer.md)** - Performance analysis, optimization recommendations, and monitoring

### **Project Management Roles**
- **[Product Manager](product-manager.md)** - Product strategy, feature planning, and user experience design
- **[Release Quality Gatekeeper](release-quality-gatekeeper.md)** - Release readiness assessment and quality assurance
- **[Git Analyzer](git-analyzer.md)** - Git workflow analysis, commit history review, and version management

### **Specialized Analysis Roles**
- **[TODO Analyzer](todo-analyzer.md)** - Task analysis, prioritization, and project management
- **[Legacy Code Analyzer](legacy-code-analyzer.md)** - Legacy system analysis, modernization strategies, and technical debt assessment
- **[Date Verification Specialist](date-verification-specialist.md)** - Time accuracy verification, tool version checking, and documentation freshness validation

## Role Definition Format

Each role follows this structure:

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
examples:
  - input: "Example user request"
    output: "Expected role response"
metadata:
  category: "Development|Project Management|Specialized Analysis"
  complexity: "Simple|Medium|Complex"
  priority: "High|Medium|Low"
---
```

## Task Coordination Mechanism

### **When Task Coordinator Activates**

The Task Coordinator role automatically activates for:
- **Complex Multi-Domain Tasks**: Tasks requiring expertise from multiple areas
- **Unclear Role Requirements**: When the optimal role is not immediately obvious
- **Sequential Task Execution**: Tasks with multiple dependent steps
- **Quality Assurance**: When comprehensive analysis is required

### **Coordination Process**

1. **Task Analysis**: Break down complex tasks into manageable components
2. **Role Selection**: Choose appropriate roles for each component
3. **Execution Planning**: Create step-by-step execution plan
4. **Role Orchestration**: Coordinate role transitions and synthesize outputs
5. **Quality Integration**: Combine multiple role outputs into coherent solutions

### **Example Coordination**

```markdown
🎭 **TASK COORDINATION**: Complex feature development detected

## Task Analysis
**Task Type**: Feature Development
**Complexity**: Complex (Multi-domain)
**Domains**: Frontend, Backend, Database, Security

## Role Selection
1. **Architecture Designer** - System design and API planning
2. **Security Specialist** - Authentication security review
3. **Code Reviewer** - Code quality assurance
4. **QA Tester** - End-to-end testing

## Execution Plan
**Phase 1**: Architecture Design (Architecture Designer)
**Phase 2**: Implementation (Code Reviewer + Security Specialist)
**Phase 3**: Testing (QA Tester)
```

## Experience Learning System

### **Experience Curator Integration**

Every interaction is recorded and analyzed by the Experience Curator:

1. **Immediate Recording**: Capture learnings after each interaction
2. **Pattern Recognition**: Identify recurring issues and successful solutions
3. **Knowledge Integration**: Update documentation with new insights
4. **Process Optimization**: Improve workflows based on experience

### **Learning Templates**

```markdown
# Experience Record Template

## Context
- **Date**: [Call 'date' command]
- **Task Type**: [Code review, bug fix, feature development, etc.]
- **Project Area**: [Frontend, Backend, Documentation, etc.]
- **User Request**: [Original user query]

## Experience Details
- **Problem Encountered**: [What went wrong or could be improved]
- **Solution Applied**: [How the problem was solved]
- **Time Spent**: [How long it took to resolve]
- **Success Metrics**: [How well the solution worked]

## Learning Outcomes
- **New Pattern Discovered**: [Any new patterns or approaches]
- **Documentation Gap**: [What was missing from docs]
- **Tool Improvement**: [How tools could be better]
- **Process Enhancement**: [How workflow could be improved]

## Action Items
- [ ] Update specific documentation
- [ ] Create new guide or tutorial
- [ ] Improve tool configuration
- [ ] Share with team
```

## Language Agnostic Design

### **Current Focus**
All roles are designed to be **language-agnostic**, providing general development guidance that applies across programming languages and frameworks.

### **Future Extensions**
The role system is designed to support future language-specific contributions:

#### **Language-Specific Roles**
- **Python Specialist** - Python-specific best practices and patterns
- **JavaScript/TypeScript Specialist** - Frontend and Node.js expertise
- **Go Specialist** - Go language patterns and performance optimization
- **Rust Specialist** - Systems programming and memory safety

#### **Domain-Specific Roles**
- **Web Development Specialist** - Frontend frameworks and web technologies
- **Mobile Development Specialist** - iOS/Android development patterns
- **DevOps Specialist** - Infrastructure, deployment, and CI/CD
- **Data Science Specialist** - Machine learning and data analysis

#### **Industry-Specific Roles**
- **Healthcare Specialist** - HIPAA compliance and medical software patterns
- **Financial Specialist** - Security, compliance, and financial software patterns
- **E-commerce Specialist** - Payment processing and e-commerce patterns

## Community Contribution

### **Role Submission Process**
1. **Create Role Definition**: Follow the established template format
2. **Add Examples**: Include practical input/output examples
3. **Test Integration**: Ensure role works with existing coordination system
4. **Submit for Review**: Community review and validation process

### **Quality Standards**
- **Clear Purpose**: Role must have a well-defined, specific purpose
- **Practical Examples**: Include real-world usage examples
- **Integration Ready**: Must work with Task Coordinator and Experience Curator
- **Documentation**: Comprehensive guidelines and best practices

### **Validation System**
- **Community Review**: Peer review by experienced developers
- **Testing**: Integration testing with existing role system
- **Performance Metrics**: Effectiveness measurement and optimization
- **Continuous Improvement**: Regular updates based on usage feedback

## Integration with Development Workflow

### **IDE Integration**
- **Cursor**: Primary integration with `.cursor/rules/cortex.mdc`
- **VS Code**: Extension for role activation and coordination
- **Other IDEs**: Planned integrations for Windsurf, Cline, Roo Code

### **CLI Integration**
- **Role Discovery**: `cortex discover` - Scan and register available roles
- **Task Coordination**: `cortex coordinate` - Activate Task Coordinator for complex tasks
- **Experience Recording**: `cortex record` - Record development experiences
- **Knowledge Synthesis**: `cortex learn` - Analyze patterns and update documentation

### **Continuous Learning**
- **Automatic Recording**: Every interaction contributes to knowledge base
- **Pattern Recognition**: Identify recurring issues and successful solutions
- **Documentation Updates**: Real-time updates based on new learnings
- **Process Optimization**: Continuous improvement of development workflows

---

**This role system provides a comprehensive, self-evolving AI collaboration framework that adapts to project needs and continuously improves through experience learning.**
