# Changelog

All notable changes to this project will be documented in this file.

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
