# Changelog

All notable changes to this project will be documented in this file.

## [0.11.0] - 2025-10-03

### 🚀 **Major Release - Cortex AI v0.11.0**

**Complete AI Collaboration Brain with Multi-Role Pattern Workflow System**

#### ✨ **New Features**

**🧠 Multi-Role Pattern Workflow:**
- **Intelligent Task Decomposition**: Automatically breaks down complex development tasks into manageable roles
- **Role-Based Execution**: Supports 8 specialized roles
  - Issue Analyst, Code Archaeologist, Solution Architect
  - Build Engineer, Implementation Specialist, Test Engineer
  - Quality Assurance Specialist, Documentation Specialist
- **Workflow State Management**: Persistent workflow state with handoff mechanisms between roles
- **Automated PR Creation**: Generates complete PR documentation and creates GitHub PRs automatically

**🔧 Enhanced MCP Tools:**
- **task**: Execute complete development tasks with full AI collaboration workflow
- **enhance-context**: Enhance responses with relevant past experiences and project knowledge
- **record-experience**: Record successful solutions for future learning and improvement
- **create-workflow**: Initialize structured multi-role workflows for complex tasks
- **execute-workflow-role**: Continue workflow execution through role handoffs
- **create-pull-request**: Generate and submit complete PR documentation

**📚 Context Engineering:**
- **Intelligent Experience Summarization**: Automatically summarizes recorded experiences to optimize context usage
- **Dynamic Context Loading**: Loads relevant historical context based on current task requirements
- **Memory Optimization**: Reduces context size while maintaining quality through smart filtering

#### 🔧 **Bug Fixes**

- **Fix: resolve markdownlint MD013 line length errors in README.md**
  Enables users to use system features more conveniently through command line interface.

#### 📝 **Documentation**

- **Complete MCP Configuration Guide**: Updated all MCP client examples with correct `start` parameter
- **Installation Instructions**: Comprehensive setup guide for Cursor, Claude Code, VS Code, and Copilot CLI
- **API Documentation**: Detailed tool descriptions and usage examples
- **Version Consistency**: Ensured consistency between npm and GitHub version tags

#### 🛠️ **Technical Improvements**

- **Simplified Architecture**: Reduced codebase complexity while maintaining full functionality
- **Enhanced Error Handling**: Improved error recovery and user guidance
- **Performance Optimization**: Faster context processing and reduced memory usage
- **Build Process**: Streamlined build pipeline with integrated quality checks

---

**Installation:**
```bash
npx @rikaidev/cortex@latest init
npx @rikaidev/cortex@latest start
```

**Usage:**
```bash
npx @rikaidev/cortex@latest task "Implement user authentication with registration, login, and password reset"
```
