[English](role-authoring.md) | [繁體中文](i18n/zh-TW/role-authoring.md)

# Role Authoring Guide

This guide provides comprehensive instructions for creating and maintaining AI collaboration roles in Cortex.

## Overview

Roles in Cortex are defined as Markdown files with YAML frontmatter that specify the role's capabilities, keywords, and behavior patterns. Each role represents a specialized AI assistant that can be dynamically selected based on user queries and project context.

## Role File Structure

### Standard Template

```markdown
---
name: "Role Name"
description: "Brief description of the role's purpose and expertise"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities:
  - "Specific capability 1"
  - "Specific capability 2"
  - "Specific capability 3"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---

# Role: [Role Name]

## Description

Clear, comprehensive description of what this role does, its primary responsibilities, and when it should be used.

## Capabilities

- **Capability 1**: Detailed description of what this capability covers
- **Capability 2**: Specific areas of expertise and knowledge
- **Capability 3**: Tools and methods this role can use

## Keywords

Primary keywords that trigger this role selection:

- keyword1: Used for [specific context]
- keyword2: Triggers when [specific scenario]
- keyword3: Relevant for [specific domain]

## Implementation Guidelines

### Core Responsibilities

1. **Primary Task**: Detailed description of the main responsibility
2. **Secondary Task**: Additional responsibilities and areas of focus
3. **Collaboration**: How this role works with other roles

### Workflow Process

1. **Analysis Phase**: How the role analyzes the problem
2. **Solution Design**: Approach to creating solutions
3. **Implementation**: How to execute the solution
4. **Validation**: Methods for verifying results

### Best Practices

- **Practice 1**: Specific guidance for optimal results
- **Practice 2**: Common pitfalls to avoid
- **Practice 3**: Recommended tools and approaches

## Examples

### Example 1: [Specific Scenario]

**Context**: Brief description of the scenario
**Input**: Sample user query or problem
**Role Response**: Expected response pattern
**Output**: Typical solution or recommendation

### Example 2: [Another Scenario]

**Context**: Different scenario description
**Input**: Another sample input
**Role Response**: How the role would respond
**Output**: Expected outcome

## Integration

### Working with Other Roles

- **Collaboration Pattern 1**: How this role complements others
- **Collaboration Pattern 2**: When to hand off to other roles
- **Collaboration Pattern 3**: Joint problem-solving approaches

### Project Context Adaptation

- **Frontend Projects**: Specific considerations for frontend development
- **Backend Projects**: Backend-specific guidance
- **Full-Stack Projects**: Comprehensive approach considerations

## Success Metrics

### Quality Indicators

- **Metric 1**: How to measure effectiveness
- **Metric 2**: Success criteria for this role
- **Metric 3**: User satisfaction indicators

### Continuous Improvement

- **Feedback Collection**: How to gather role performance feedback
- **Iteration Process**: Methods for improving role effectiveness
- **Version Control**: Managing role updates and changes

## Troubleshooting

### Common Issues

- **Issue 1**: Description and resolution
- **Issue 2**: Common problem and solution
- **Issue 3**: Edge case handling

### Debugging Tips

- **Tip 1**: How to diagnose role selection issues
- **Tip 2**: Testing role effectiveness
- **Tip 3**: Performance optimization

---

**This role is designed to provide specialized expertise while maintaining consistency with the overall AI collaboration system.**
```

## YAML Frontmatter Standards

### Required Fields

```yaml
---
name: "Role Name" # Human-readable role name
description: "Brief description" # One-line purpose description
keywords: ["kw1", "kw2", "kw3"] # Discovery keywords array
capabilities: ["cap1", "cap2"] # Capabilities array
---
```

### Optional Fields

```yaml
---
version: "1.0.0" # Role version
tags: ["tag1", "tag2"] # Categorization tags
priority: 1 # Selection priority (1-10)
author: "Author Name" # Role creator
last_updated: "2024-01-01" # Last update date
---
```

## Content Guidelines

### Writing Style

- **Clear and Concise**: Use simple, direct language
- **Action-Oriented**: Focus on what the role can do
- **Specific Examples**: Provide concrete, actionable guidance
- **Consistent Format**: Follow established patterns

### Technical Accuracy

- **Up-to-Date Information**: Ensure all technical details are current
- **Verified Practices**: Include only proven, reliable methods
- **Security Considerations**: Address security implications where relevant
- **Performance Notes**: Include performance considerations

### Accessibility

- **Language Agnostic**: Avoid language-specific assumptions
- **Framework Flexible**: Don't tie to specific frameworks unless necessary
- **Skill Level Appropriate**: Consider different developer experience levels
- **Cultural Sensitivity**: Use inclusive, respectful language

## Role Categories

### Development Roles

- **Code Assistant**: General programming help
- **Code Reviewer**: Code analysis and improvement
- **Architecture Designer**: System design and patterns
- **Performance Optimizer**: Performance analysis and optimization

### Specialized Roles

- **Security Specialist**: Security analysis and best practices
- **QA Tester**: Testing strategies and quality assurance
- **DevOps Engineer**: Infrastructure and deployment
- **Data Scientist**: Data analysis and machine learning

### Management Roles

- **Product Manager**: Product strategy and requirements
- **Project Manager**: Project planning and coordination
- **Release Manager**: Release planning and execution
- **Technical Lead**: Technical decision making

## Quality Assurance

### Review Checklist

- [ ] **YAML Frontmatter**: All required fields present and properly formatted
- [ ] **Keywords**: Relevant, specific, and comprehensive
- [ ] **Capabilities**: Clear, actionable, and well-defined
- [ ] **Examples**: Practical, realistic, and helpful
- [ ] **Integration**: Clear collaboration patterns with other roles
- [ ] **Accuracy**: Technical information is current and correct
- [ ] **Completeness**: All sections are properly filled out
- [ ] **Consistency**: Follows established patterns and standards

### Testing Process

1. **Role Discovery Test**: Verify role is properly discovered
2. **Keyword Matching Test**: Test keyword-based selection
3. **Example Validation**: Verify examples are practical
4. **Integration Test**: Test collaboration with other roles
5. **User Feedback**: Gather feedback from actual usage

## Maintenance

### Version Control

- **Semantic Versioning**: Use semantic versioning for role updates
- **Change Log**: Document all changes and improvements
- **Backward Compatibility**: Maintain compatibility when possible
- **Deprecation Process**: Clear process for retiring roles

### Update Process

1. **Identify Need**: Determine what needs to be updated
2. **Plan Changes**: Design the improvements
3. **Implement Updates**: Make the changes
4. **Test Thoroughly**: Verify the updates work correctly
5. **Document Changes**: Update version and change log
6. **Deploy**: Make updates available

## Best Practices

### Role Design

- **Single Responsibility**: Each role should have one clear purpose
- **Comprehensive Coverage**: Cover all aspects of the role's domain
- **Practical Focus**: Emphasize real-world applicability
- **Continuous Improvement**: Regular updates and refinements

### Content Quality

- **Clear Structure**: Well-organized, easy to navigate
- **Actionable Guidance**: Provide specific, implementable advice
- **Context Awareness**: Consider different project types and sizes
- **User-Centric**: Focus on user needs and pain points

### Collaboration

- **Role Coordination**: Clear handoff and collaboration patterns
- **Knowledge Sharing**: Leverage insights from other roles
- **Consistent Standards**: Maintain consistency across all roles
- **Community Input**: Incorporate feedback and suggestions

---

**Creating effective roles requires understanding both the technical domain and user needs. Focus on providing practical, actionable guidance that helps users solve real problems.**
