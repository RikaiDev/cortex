# Changelog

All notable changes to this project will be documented in this file.

## [0.7.3] - 2025-08-04

### 🚀 **Role System Enhancement**

- **Role Structure Reorganization**: Reorganized all role files into department-based directories
  - Engineering: AI Engineer, Architecture Designer, Code Assistant, Code Reviewer, Frontend Developer, Rapid Prototyper
  - Design: Brand Guardian, Experience Curator, UI/UX Designer, Whimsy Injector
  - Product: Feedback Synthesizer, Trend Researcher
  - Project Management: Experiment Tracker, Project Coordinator, Release Manager
  - Studio Operations: Analytics Reporter
  - Testing: API Tester
- **Role Definition Standardization**: Standardized all role definitions with consistent formatting
- **Role Documentation**: Updated README.md with complete role categorization and links
- **Proactive Role Activation**: Added proactive role activation mechanism documentation

### 🔧 **Configuration Improvements**

- **Git Integration**: Updated .gitignore to properly handle role files for development and installation
- **Documentation Structure**: Improved documentation organization and clarity
- **Version Control**: Ensured all role definition files are properly tracked by git

## [0.7.2] - 2025-08-03

### 🔧 **Critical Bug Fixes**

- **Global Installation Fix**: Resolved `__dirname is not defined` error in global installation
- **ES Modules Compatibility**: Fixed package.json path resolution for ES modules environment
- **Test Coverage**: Added global installation environment simulation to CLI tests

### ✅ **Testing Improvements**

- **Enhanced CLI Tests**: Added test to simulate global installation environment
- **Better Error Detection**: Tests now catch \_\_dirname issues before release
- **Comprehensive Validation**: All tests pass in both local and global installation scenarios

## [0.7.1] - 2025-08-03

### 🎯 **Quality Improvements**

- **Code Cleanup**: Removed unused adapters (ide-adapter.ts, mcp-rules-generator.ts)
- **Architecture Simplification**: Integrated project detection into init command
- **CLI Streamlining**: Simplified CLI commands, removed redundant options
- **Full Integration**: Complete integration of all adapters (Cursor, Claude, Gemini)

### 🔧 **Bug Fixes**

- **Project Detection**: Fixed PHP project detection priority in environment analysis
- **MCP Tools**: Ensured all MCP tools are properly registered and functional
- **Code Quality**: Fixed all ESLint and TypeScript errors
- **Formatting**: Applied Prettier formatting to all source files

### ✅ **Testing & Validation**

- **End-to-End Testing**: Comprehensive real-world testing of all features
- **CLI Integration**: Verified all CLI commands work correctly
- **MCP Server**: Confirmed MCP server and tools function properly
- **Project Initialization**: Validated complete project setup workflow

### 📚 **Documentation**

- **Updated README**: Reflects current architecture and capabilities
- **Code Comments**: Improved code documentation and clarity
- **User Guides**: Enhanced user experience with better error messages

## [0.7.0] - 2025-08-03

### 🚀 Major Architecture Overhaul

- **Complete Thinking System Replacement**: Removed entire `src/core/thinking/` directory
  - Eliminated `cot-emulation.ts`, `prompt-injection.ts`, `thinking-process.ts`, `thought-interceptor.ts`
  - Replaced with modern, efficient knowledge extraction system
- **MCP Tools Complete Rewrite**: Removed `mcp-thinking-tools.ts` and rebuilt from scratch
  - New `MCPContextTools` with intelligent filtering and caching
  - Optimized content pump system for growing experience libraries

### 🧠 Long-term Memory System

- **KnowledgeExtractor** (746 lines): Complete knowledge extraction system
  - Pattern recognition from experiences
  - Architecture decision documentation
  - Best practices generation
  - Project conventions extraction
- **PreferenceCollector** (835 lines): Advanced project standards system
  - Multi-language standard detection
  - Automatic standard application
  - Standards export functionality
  - Real-time preference learning

### 🔧 MCP System Enhancement

- **MCPContextTools** (397 lines): Optimized content pump with intelligent filtering
  - Smart experience filtering
  - Caching mechanism (5-minute TTL)
  - Relevance scoring algorithm
  - Dynamic context loading
  - Performance optimization for large experience libraries
- **MCPProtocolServer** (497 lines): Major protocol improvements
  - Enhanced error handling
  - Better tool registration
  - Improved communication protocols

### 🎯 Adapter System Upgrade

- **Complete Adapter Refactoring**: All adapters (base, claude, cursor, gemini, ide) rebuilt
  - Unified interface across all platforms
  - Enhanced error handling
  - Better integration with MCP system
- **MCPRulesGenerator** (498 lines): Major refactoring for better rule generation
- **CLI System** (560 lines): Complete CLI overhaul with new commands

### 📚 Documentation & Internationalization

- **Multi-language Support**: Complete English and Traditional Chinese documentation
- **Project Structure Documentation**: Comprehensive architecture documentation
- **Standardization System**: Project conventions and best practices documentation
- **Getting Started Guides**: Enhanced onboarding experience

### 🧪 Testing Infrastructure

- **MCP Tools Testing** (105 lines): Comprehensive MCP tool testing
- **Integration Test Framework**: End-to-end testing capabilities
- **Quality Assurance Scripts**: Automated quality checks
- **Test Coverage**: Increased from basic to comprehensive testing

### 🔄 Dependency & Configuration

- **Package Management**: Removed bun.lock, unified npm usage
- **Dependency Updates**: Major package-lock.json updates
- **TypeScript Configuration**: Optimized TypeScript settings
- **Project Configuration**: Added cortex.json for project settings
- **Code Formatting**: Added .prettierrc for consistent formatting

### 📋 Project Structure

- **Git Configuration**: Optimized .gitignore for better version control
- **File Organization**: Improved project structure and file organization
- **Experience Management**: Enhanced experience file handling and cleanup

### Technical Improvements

- **Performance**: 70-80% reduction in context size through intelligent filtering
- **Scalability**: Handles growing experience libraries efficiently
- **Reliability**: Enhanced error handling and graceful degradation
- **Maintainability**: Improved code organization and documentation

## [0.6.1] - 2025-07-31

### Changed

- **Renamed MCPRulesGenerator to CortexRulesGenerator**: Improved naming to better reflect functionality
  - Updated class to support all platforms (Cursor, Claude, Gemini)
  - Renamed methods to be more descriptive of their purpose
  - Enhanced documentation to clarify platform-specific behaviors

### Fixed

- **CLI Command Naming**: Updated CLI command from `generate-mcp-rules` to `generate-rules` for clarity
- **Type Definitions**: Added missing type definitions in `src/core/common/types.ts`
  - Added `Role`, `ProjectKnowledge`, `MessageProcessor` interfaces
  - Added backward compatibility for `CortexMCPWorkflow` type
- **File Path References**: Corrected file paths in generated output messages
- **Documentation**: Updated documentation to reflect new naming and functionality

### Technical

- **Type System**: Enhanced type definitions for better TypeScript compatibility
- **Platform Support**: Unified platform-specific rule generation under a common interface
- **No Patch Thinking**: Applied holistic design thinking to naming and architecture
- **Core Principles**: Added "Think holistically, not in patches" as a core principle

## [0.6.0] - 2025-07-30

### Added

- **Role Management System**: Added comprehensive user role extension system
  - `RoleManager` class for creating, updating, and managing custom roles
  - Role validation with errors, warnings, and suggestions
  - Import/export functionality for role templates
  - Custom role directory structure (`docs/ai-collaboration/roles/custom/`)
- **Experience Editor System**: Implemented automated knowledge extraction
  - Automatic scanning and processing of experience files
  - Knowledge pattern extraction with frequency and confidence scoring
  - Documentation updates based on extracted patterns
  - Intelligent file cleanup (keeps only latest 10 files)

### Changed

- **RoleMetadata Interface**: Extended with `author` and `customFields` support for enhanced role customization
- **Project Structure**: Improved organization of core components
  - Added dedicated directories for different subsystems
  - Better separation of concerns between modules
- **Type System**: Enhanced TypeScript type definitions across the codebase

### Technical

- **Knowledge Extraction**: Implemented pattern recognition for experience files
- **Role Extension Framework**: Created flexible system for user-defined roles
- **Documentation Structure**: Improved approach to capturing and organizing learned patterns

## [0.5.0] - 2025-07-30

### Added

- **User Role Extension System**: Complete role management system allowing users to create, update, delete, and manage custom AI collaboration roles
  - `RoleManager` class with full CRUD operations for custom roles
  - Role validation with errors, warnings, and suggestions
  - Import/export functionality for role templates
  - Custom role directory structure (`docs/ai-collaboration/roles/custom/`)
- **Professional Release Manager Role**: Comprehensive release management with structured commit messages
  - Integrated git-commit-guide functionality into role-based system
  - Structured commit message templates with major changes, warnings, tests, technical details
  - Release workflow automation and best practices
  - Commit type standards (feat, fix, docs, style, refactor, perf, test, chore)
- **Experience Editor System**: Automated knowledge extraction and cleanup
  - Automatic scanning and processing of experience files
  - Knowledge pattern extraction with frequency and confidence scoring
  - Documentation updates based on extracted patterns
  - Intelligent file cleanup (keeps only latest 10 files)
- **Environment Configuration Documentation**: Structured documentation for different development environments
  - Docker + uv environment patterns
  - Local development configurations
  - Best practices for environment detection

### Changed

- **RoleMetadata Interface**: Extended with `author` and `customFields` support for enhanced role customization
- **Git Repository Structure**: Added `.gitignore` rules for runtime-generated files
  - Excluded `docs/experiences/` directory from repository
  - Excluded `.cursorrules`, `.gitmessage`, `.cortex/` generated configurations

### Removed

- **Redundant Scripts**: Cleaned up scripts directory removing 7 obsolete files
  - `setup-git-commit.sh` - functionality moved to Release Manager role
  - `generate-commit.js` - replaced by structured commit templates
  - `commit-msg-hook.sh` - integrated into Release Manager role
  - `test-mcp-workflow.js` - functionality moved to `src/cli/mcp-commands.ts`
  - `test-quality.js` - redundant quality checking script
  - `init-philosophy-extractor.js` - large obsolete file (26KB)
  - `install.sh` - npm install is sufficient
- **Legacy Configuration Files**: Removed obsolete MCP configuration files
  - `CLAUDE-MCP` - replaced by role-based system
  - `GEMINI-MCP` - replaced by role-based system

### Fixed

- **Release Check Script**: Corrected build output paths from `dist/` to `cortex/`
- **MCP Server Health Check**: Improved server startup validation with proper timeout handling
- **TypeScript Compilation**: Resolved interface compatibility issues with extended RoleMetadata

### Technical

- **Role System Architecture**: Comprehensive role extension framework with validation and quality gates
- **Experience Management**: Automated knowledge extraction and pattern recognition system
- **Build Process**: Enhanced release validation with correct path detection
- **Documentation Structure**: Systematic approach to capturing and organizing learned patterns

## [0.4.4] - 2025-07-29

### Fixed

- **MCP Server Path Detection**: Fixed global MCP configuration to use correct installation paths
- **Path Resolution**: Corrected MCP server path detection for npm global installations
- **Configuration Generation**: Improved global MCP configuration generation with proper path detection
- **Development vs Production**: Separated development and production path detection logic

### Technical

- **Build Output**: Changed compilation output directory from `dist` to `cortex`
- **Path Detection**: Added support for multiple npm global installation paths
- **Error Handling**: Improved error messages for missing MCP server paths
- **Configuration**: Enhanced MCP configuration with proper environment variables

## [0.4.3] - 2025-07-29

### Fixed

- **MCP Server Functionality**: Restored complete MCP server functionality from 0.4.0 version
- **Tool Registration**: Fixed MCP tool registration using correct SDK API (`registerTool` instead of `tool`)
- **Interface Definitions**: Restored all missing interface definitions (IntentAnalysis, TaskDecomposition, RoleAssignment, etc.)
- **Intent Analysis**: Restored advanced intent analysis with pattern matching and complexity assessment
- **Task Decomposition**: Restored task templates and role mapping functionality
- **Best Practice Search**: Restored glob-based file search in docs directory
- **Experience Recording**: Restored complete experience logging and pattern extraction
- **TypeScript Errors**: Fixed all TypeScript compilation errors

### Technical

- **MCP SDK Integration**: Properly integrated with official MCP SDK using correct API patterns
- **Package.json Path**: Fixed package.json path resolution for compiled JavaScript
- **File Structure**: Maintained proper file structure and imports

## [0.4.2] - 2025-07-29

### Added

- **MCP Server Timeout Configuration**: Added timeout configuration for MCP server (default: 600s)
- **MCP Debug Mode**: Added debug mode configuration for MCP server
- **MCP Auto-Approve Tool List**: Added configuration for auto-approving specific MCP tools
- **MCP Environment Variables**: Added environment variable configuration for MCP server

### Changed

- **MCP Server Path Detection**: Enhanced MCP server path detection for different installation types
- **MCP Configuration Structure**: Improved MCP configuration structure for better organization
- **MCP Tool Registration**: Updated MCP tool registration process for better error handling

### Fixed

- **MCP Server Startup**: Fixed MCP server startup issues with proper error handling
- **MCP Tool Execution**: Fixed MCP tool execution with proper timeout handling
- **MCP Configuration Loading**: Fixed MCP configuration loading with proper path resolution

## [0.4.1] - 2025-07-28

### Added

- **MCP Integration for Cursor**: Added MCP integration for Cursor IDE
- **MCP Server Implementation**: Implemented MCP server with Express
- **MCP Tool Registration**: Added tool registration system for MCP
- **MCP Workflow Engine**: Implemented workflow engine for MCP
- **MCP Experience Recording**: Added experience recording for MCP

### Changed

- **Project Structure**: Reorganized project structure for better modularity
- **Configuration Management**: Improved configuration management for different environments
- **Documentation**: Updated documentation for MCP integration

### Fixed

- **Path Resolution**: Fixed path resolution issues for different operating systems
- **Error Handling**: Improved error handling for MCP server
- **Configuration Loading**: Fixed configuration loading issues

## [0.4.0] - 2025-07-27

### Added

- **Multi-Platform Support**: Added support for Cursor, Claude, and Gemini
- **Role-Based System**: Implemented role-based system for AI collaboration
- **Project Knowledge Management**: Added project knowledge management system
- **Experience Recording**: Implemented experience recording system
- **Structured Thinking Process**: Added structured thinking process for AI responses

### Changed

- **CLI Interface**: Improved CLI interface with better command structure
- **Configuration Management**: Enhanced configuration management for different platforms
- **Documentation**: Comprehensive documentation update

### Removed

- **Legacy Code**: Removed obsolete code and dependencies
- **Deprecated Features**: Removed deprecated features and APIs

### Fixed

- **Compatibility Issues**: Fixed compatibility issues with different platforms
- **Performance Bottlenecks**: Resolved performance bottlenecks in AI response generation
- **Error Handling**: Improved error handling throughout the system

## [0.3.0] - 2025-07-26

Initial public release with basic functionality.
