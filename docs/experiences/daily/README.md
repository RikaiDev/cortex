# Experience Records

This directory contains daily experience records that capture learnings from development interactions and tasks.

## Purpose

The Experience Curator role systematically records every interaction to:
- **Capture Learnings**: Document what worked and what didn't
- **Identify Patterns**: Find recurring issues and successful solutions
- **Improve Processes**: Optimize workflows based on real experience
- **Share Knowledge**: Make learnings available to the entire team

## Structure

```
docs/experiences/daily/
├── README.md                    # This file
├── templates/                   # Experience recording templates
│   └── experience-record.md     # Standard experience record template
├── 2025-07-27.md               # Daily experience records
├── 2025-07-28.md
└── ...
```

## Recording Process

### **After Every Interaction**

1. **Use Template**: Start with `templates/experience-record.md`
2. **Call Date Command**: Always run `date` before recording
3. **Be Specific**: Include concrete details and metrics
4. **Action Items**: List specific next steps
5. **Role Performance**: Evaluate how roles performed

### **Example Record**

```markdown
# Experience Record - 2025-07-27

## Context
- **Date**: 2025年 7月27日 週日 05時57分49秒 CST
- **Task Type**: Code Review
- **Project Area**: Backend API
- **User Request**: "幫我檢查這個新 API 的程式碼品質"

## Experience Details
- **Problem Encountered**: Security vulnerabilities in input validation
- **Solution Applied**: Added comprehensive input sanitization and validation
- **Time Spent**: 45 minutes for thorough review
- **Success Metrics**: Found 3 critical security issues, 5 code quality issues

## Learning Outcomes
- **New Pattern**: Always check input validation for security
- **Documentation Gap**: Need security checklist for API reviews
- **Tool Improvement**: Linting rules could catch some security issues
- **Process Enhancement**: Security review should be mandatory for APIs

## Action Items
- [x] Create API security review checklist
- [ ] Update code review guidelines
- [ ] Configure security linting rules
- [ ] Share security findings with team

## Role Performance
- **Roles Used**: Code Reviewer, Security Specialist
- **Role Effectiveness**: Both roles performed well, good coordination
- **Coordination Success**: Smooth transition between roles
- **Improvement Opportunities**: Could add automated security scanning

## Next Steps
- **Immediate Actions**: Update code review guidelines
- **Short-term Improvements**: Configure security linting
- **Long-term Investments**: Implement automated security scanning
```

## Analysis and Synthesis

### **Weekly Analysis**
- Review patterns from the week
- Identify recurring issues
- Plan process improvements

### **Monthly Synthesis**
- Major learnings and breakthroughs
- Impact assessment
- Strategic improvements

### **Continuous Integration**
- Update role definitions based on performance
- Improve coordination mechanisms
- Enhance documentation based on gaps

## Integration with Role System

### **Task Coordinator**
- Use historical data for role selection
- Optimize coordination based on experience
- Improve task breakdown strategies

### **Experience Curator**
- Analyze patterns across multiple records
- Synthesize insights for documentation updates
- Identify systemic improvements

### **All Specialized Roles**
- Learn from role-specific experiences
- Adapt role definitions based on performance
- Share insights across role domains

---

**Every interaction is a learning opportunity. Every challenge is a stepping stone to improvement.** 