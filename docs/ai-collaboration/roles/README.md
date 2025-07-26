# AI Collaboration Roles

## Overview

This directory contains role definitions for the Cortex AI Brain system. Each role is defined in a Markdown file with YAML frontmatter that specifies the role's capabilities and discovery keywords.

## Role System Design

### **Core Philosophy**

- **Language Agnostic**: Roles are designed to work across all programming languages
- **Project Specific**: Roles adapt to project context and patterns
- **Dynamic Discovery**: AI automatically discovers and selects appropriate roles
- **Single Source of Truth**: All role definitions live in `docs/ai-collaboration/roles/`

### **Current Roles**

#### **General Development Roles**

- **Code Assistant**: General-purpose code assistance
- **Code Reviewer**: Code analysis and improvement suggestions
- **Architecture Designer**: System design and architecture patterns
- **QA Tester**: Testing and quality assurance
- **Security Specialist**: Security analysis and vulnerability assessment
- **Performance Optimizer**: Performance optimization and profiling

#### **Project Management Roles**

- **Product Manager**: Product strategy and requirements
- **Release Quality Gatekeeper**: Release management and quality assurance
- **TODO Analyzer**: Task analysis and implementation planning

#### **Process & Knowledge Roles**

- **Experience Curator**: Documentation and knowledge management
- **Git Analyzer**: Version control and workflow analysis
- **Legacy Code Analyzer**: Legacy code analysis and migration planning
- **Date Verification Specialist**: Time-based information accuracy

## Role Definition Format

Each role file follows this structure:

```yaml
---
name: "Role Name"
description: "Brief description of the role's purpose"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities: ["capability1", "capability2", "capability3"]
---
```

### **Required Fields**

- `name`: Human-readable role name
- `description`: Clear, concise description of what the role does
- `keywords`: Array of keywords for role discovery (used by AI to match user queries)
- `capabilities`: Array of specific capabilities the role provides

### **Content Structure**

After the YAML frontmatter, include:

1. **Role Purpose**: Clear explanation of what the role does
2. **Responsibilities**: Specific tasks and areas of focus
3. **Workflow Process**: How the role approaches problems
4. **Implementation Guidelines**: Specific instructions and examples
5. **Success Metrics**: How to measure the role's effectiveness
6. **Integration**: How the role works with other roles

## Future: Community Role Contributions

### **Planned Contribution System**

#### **Phase 1: Language-Specific Roles**

- **Python Specialist**: Python-specific development patterns
- **JavaScript/TypeScript Specialist**: Frontend and Node.js expertise
- **Go Specialist**: Go development and microservices
- **Rust Specialist**: Systems programming and performance
- **Java Specialist**: Enterprise and Android development

#### **Phase 2: Domain-Specific Roles**

- **Frontend Specialist**: UI/UX and frontend frameworks
- **Backend Specialist**: API design and server-side development
- **DevOps Specialist**: Infrastructure and deployment
- **Data Scientist**: Data analysis and machine learning
- **Mobile Developer**: iOS and Android development

#### **Phase 3: Industry-Specific Roles**

- **Healthcare Specialist**: HIPAA compliance and medical software
- **Finance Specialist**: Financial regulations and fintech
- **E-commerce Specialist**: Online retail and payment systems
- **Gaming Specialist**: Game development and real-time systems

### **Contribution Guidelines (Future)**

#### **Role Submission Process**

1. **Create Role File**: Add new role definition to `docs/ai-collaboration/roles/`
2. **Follow Format**: Use standard YAML frontmatter and content structure
3. **Test Integration**: Ensure role works with existing role discovery system
4. **Documentation**: Provide clear examples and usage guidelines
5. **Review Process**: Community review and approval

#### **Quality Standards**

- **Clear Purpose**: Role must have distinct, valuable function
- **Language Agnostic**: Should work across programming languages
- **Project Adaptable**: Must adapt to different project contexts
- **Well Documented**: Comprehensive examples and guidelines
- **Tested**: Verified to work with role discovery system

#### **Community Benefits**

- **Shared Knowledge**: Best practices across projects
- **Specialized Expertise**: Domain-specific AI assistance
- **Continuous Improvement**: Evolving role definitions
- **Cross-Project Learning**: Knowledge transfer between teams

## Current Implementation

### **Role Discovery**

The AI automatically scans this directory and:

1. **Parses YAML frontmatter** to understand role capabilities
2. **Matches keywords** to user query intent
3. **Selects optimal role** based on context and requirements
4. **Applies role-specific knowledge** to provide assistance

### **Dynamic Loading**

- **No hardcoded roles**: All roles loaded from `docs/ai-collaboration/roles/`
- **Real-time updates**: Changes to role files immediately available
- **Project specific**: Roles adapt to project context and patterns
- **Single source of truth**: All role definitions in one location

## Getting Started

### **Using Existing Roles**

1. **Ask questions naturally**: AI will automatically select appropriate roles
2. **Use role-specific keywords**: Mention relevant concepts to trigger specific roles
3. **Provide context**: Share project details for better role selection

### **Customizing Roles**

1. **Edit existing roles**: Modify `docs/ai-collaboration/roles/*.md` files
2. **Add project context**: Include project-specific examples and patterns
3. **Test changes**: Verify role selection works as expected

### **Creating New Roles**

1. **Follow the format**: Use standard YAML frontmatter structure
2. **Be specific**: Define clear responsibilities and capabilities
3. **Include examples**: Provide practical usage examples
4. **Test integration**: Ensure role discovery works correctly

## Best Practices

### **Role Design**

- **Single Responsibility**: Each role should have one clear purpose
- **Keyword Precision**: Use specific, relevant keywords for discovery
- **Comprehensive Coverage**: Include all important responsibilities
- **Practical Examples**: Provide real-world usage scenarios

### **Content Quality**

- **Clear Structure**: Use consistent formatting and organization
- **Actionable Guidance**: Provide specific, implementable advice
- **Context Awareness**: Consider different project types and sizes
- **Continuous Updates**: Keep roles current with best practices

---

**The role system is designed to be flexible, extensible, and community-driven, enabling teams to create their own AI collaboration brain that grows with their needs.**
