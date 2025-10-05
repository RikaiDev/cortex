# Changelog

All notable changes to this project will be documented in this file.

## [0.11.3] - 2025-10-05

### 🚀 **Release Workflow Enhancement & MCP Architecture Refactoring**

#### ✨ **New Features**

**🛡️ Enhanced Release Protection:**
- **Pre-publish Hook**: Added `prepublishOnly` script to prevent direct `npm publish` commands
- **Workflow Enforcement**: Forces use of proper release commands (`npm run release:patch/minor/major`)
- **Quality Assurance**: Ensures all releases go through comprehensive quality checks

**🧠 AI-Powered Release Workflow:**
- **Cortex AI Integration**: Release process now includes AI interruption points for complex tasks
- **Automated Quality Checks**: AI-assisted code quality, linting, and documentation validation
- **Intelligent Changelog Generation**: AI-powered changelog creation with professional formatting
- **Smart Commit Messages**: Automated generation of detailed, conventional commit messages

**🔧 MCP Architecture Refactoring:**
- **Modular Handler System**: Separated concerns with dedicated `ResourceHandler` and `ToolHandler` classes
- **Enhanced Service Layer**: New `HandoffService` and `SnapshotService` for better workflow management
- **Improved Type Safety**: Comprehensive TypeScript types for all MCP operations
- **Better Error Handling**: Robust error recovery and user guidance throughout the system

#### 🛠️ **Improvements**

**📋 Release Process:**
- **Version Consistency Validation**: Automatic checking of version consistency across all files
- **Markdown Linting Integration**: Automated markdown quality checks with AI assistance
- **Comprehensive Testing**: Enhanced CLI and integration test coverage
- **Atomic Release Execution**: All-or-nothing release process for reliability

**🔧 Code Quality:**
- **Enhanced Linting**: Improved ESLint, TypeScript, and Prettier configurations
- **Security Checks**: Added npm audit and secret pattern detection
- **Dependency Management**: Optimized package dependencies and removed unused packages
- **Documentation Updates**: Comprehensive updates to release protection documentation

**📚 Developer Experience:**
- **Clear Error Messages**: User-friendly error messages with actionable guidance
- **Workflow Documentation**: Updated `RELEASE-PROTECTION.md` with current protection mechanisms
- **MCP Tool Descriptions**: Enhanced tool descriptions and usage guidelines
- **Better CLI Feedback**: Improved command-line interface with clearer status messages

#### 🔧 **Bug Fixes**

- **Fix: Markdown linting errors**: Resolved MD013 line length and MD047 missing newline issues
- **Fix: MCP configuration**: Corrected MCP client configuration examples with proper `start` parameter
- **Fix: Version consistency**: Ensured version badges and documentation stay synchronized

#### 📝 **Documentation**

- **Release Protection Guide**: Comprehensive documentation of the new release protection system
- **MCP Architecture**: Updated documentation reflecting the new modular architecture
- **Quality Standards**: Enhanced code quality guidelines and best practices
- **Workflow Examples**: Clear examples of proper release workflow usage

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
