# Changelog

All notable changes to this project will be documented in this file.

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

- **🌐 Global MCP Configuration**: `cortex init` now automatically installs MCP server configuration to `~/.cursor/mcp.json`
- **🚀 MCP Start Command**: Added `cortex mcp start` command to launch MCP server directly
- **🔧 Enhanced Init Process**: Added Step 6 to setup global MCP configuration during initialization

### Fixed

- **CRITICAL**: Fixed MCP server package.json path issues when running from different directories
- **CRITICAL**: Fixed CLI package.json path issues in MCP server startup
- **CRITICAL**: Ensured .cursor directory creation before writing MCP configuration files

### Changed

- **Improved User Experience**: Global MCP configuration is now automatically set up during project initialization
- **Better Error Handling**: Enhanced error handling for MCP configuration creation
- **Seamless Integration**: MCP server can now be started from any directory without path issues

## [0.4.1] - 2025-07-29

### Fixed

- **CRITICAL**: Fixed CLI package.json path issue when running from different directories
- **CRITICAL**: Resolved ENOENT error when executing cortex commands from non-project directories
- **CRITICAL**: Removed problematic 0.4.0 version from npm registry to prevent user confusion

### Changed

- Updated CLI to use `__dirname` instead of `process.cwd()` for package.json path resolution
- Improved CLI reliability across different working directories

## [0.4.0] - 2025-07-29

**⚠️ DEPRECATED**: This version has been removed from npm registry due to critical CLI path issues.

### Added

- Enhanced MCP integration with mandatory experience reflection
- Improved MCP workflow with 7-step process including experience reflection
- Better code formatting and consistency in MCP rules
- Removed test files for cleaner release

### Changed

- Updated version to 0.4.0 for major release
- Enhanced MCP experience recording with reflection step
- Improved documentation synchronization

### Fixed

- MCP experience reflection completion issue
- Version consistency across all documentation

## [0.3.5] - 2025-07-29

### Fixed

- Fixed executable permissions for CLI binary
- Added chmod +x to dist/cli/index.js before publishing
- CLI command now works correctly after installation

## [0.3.4] - 2025-07-29

### Fixed

- Removed postinstall build script that caused installation failures
- Fixed npm install issues by using pre-built dist files
- Package now installs without requiring TypeScript compilation

## [0.3.3] - 2025-07-29

### Fixed

- Fixed missing Node.js types during npm install
- Added bun-types to TypeScript configuration
- Removed broken 0.3.1 version from npm registry

## [0.3.2] - 2025-07-29

### Fixed

- Fixed TypeScript compilation issues during npm install
- Added proper Node.js types configuration in tsconfig.json
- Added DOM library support for console and process globals

## [0.3.1] - 2025-07-29

### Added

- **🛡️ AI Error Prevention System**: Comprehensive protection against common AI mistakes across all roles
- **🚀 Proactive Behavior Principles**: 8 core principles for proactive AI collaboration
- **🎯 Enhanced Role System**: Deep domain expertise with practical frameworks and code examples
- **📚 Advanced Learning System**: Extended preference detection with proactive behavior keywords
- **🔄 Real-World Focus**: All roles prioritize practical solutions over theoretical perfection

### Enhanced

- **Code Assistant**: Production-ready coding with context awareness and maintainable patterns
- **Code Reviewer**: Priority-based review with actionable feedback and real-world impact analysis
- **Architecture Designer**: Requirements-first design with trade-off analysis and implementation reality checks
- **UI/UX Designer**: Action-oriented design with workflow integration and cognitive load management
- **Experience Curator**: Learning optimization with pattern recognition and knowledge evolution

### Improved

- **AI Error Prevention**: Built-in protection against context ignorance, over-engineering, and generic responses
- **Proactive Collaboration**: AI now provides solutions directly instead of saying "I can't"
- **Practical Examples**: Each role includes before/after code examples and real-world scenarios
- **Decision Standards**: Elevated solution quality with innovative approaches and boundary-breaking thinking
- **Trust-Based Collaboration**: Partnership mindset with positive intent assumption

### Fixed

- **Role Documentation**: Complete overhaul of all role definitions with comprehensive frameworks
- **Learning Integration**: Enhanced preference detection with proactive behavior keywords
- **Cross-Role Consistency**: Unified approach to AI error prevention and practical focus

## [0.3.0] - 2025-07-28

### Added

- **🧠 Brain Architecture**: Simplified to "Brain + Experience + Tools" model
- **📚 Real-Time Preference Learning**: AI learns from user feedback keywords ("不對", "我們用", "不要")
- **⚡ Structured Thinking**: 6-step mandatory thinking process for all AI models
- **🎯 Intent Exploration**: Mandatory first step in AI thinking process
- **💡 User Intent Analysis**: AI explores what users REALLY want to achieve
- **🎭 Pain Point Identification**: Automatic detection of user problems and priorities
- **🔄 Cross-Platform Consistency**: Unified behavior across Cursor, Claude, and Gemini
- **🎯 Prompt Injection**: Core mechanism for AI enhancement without external scripts
- **💡 User Preference Memory**: AI remembers and applies user-specific preferences
- **🚫 Anti-Repetition**: Never repeats corrected mistakes or user preferences

### Changed

- **Thinking Process**: Updated from 5-step to 6-step mandatory thinking protocol
- **Response Format**: Added "Intent Exploration" as the first step in all AI responses
- **Cross-Platform Consistency**: All adapters (Cursor, Claude, Gemini) now include intent exploration
- **Architecture Simplification**: Removed complex role discovery and external learning scripts
- **Core Mechanism**: Switched from external scripts to pure prompt injection
- **Documentation**: Streamlined to focus on brain architecture and preference learning
- **File Structure**: Removed unnecessary complexity, kept only essential components

### Improved

- **User Experience**: AI now proactively explores user intent before providing solutions
- **Solution Quality**: Better alignment between AI solutions and user actual needs
- **Communication**: Reduced need for user corrections and clarifications
- **Intent Clarity**: AI automatically identifies user pain points and value priorities
- **System Reliability**: Eliminated external script dependencies
- **User Experience**: Immediate learning and application of preferences
- **Maintainability**: Simplified codebase with clear brain + experience separation
- **Performance**: Faster response through direct prompt injection

## [0.2.0] - 2025-07-28

### Added

- **Cross-Platform AI Configuration**: Support for Cursor, Claude Code, and Gemini Code
- **Cortex Agent System**: 5-core agent orchestration (Coordinator, Builder, Architect, Validator, Manager)
- **Code Style Enforcement**: Mandatory style consistency with TypeScript rules
- **Correction Learning System**: AI learns from user corrections and prevents repeated mistakes
- **Anti-Stubbornness Protocol**: Prevents AI from repeating corrected behaviors
- **Tool Detection System**: Automatic detection and usage of project-specific tools (uv, nx, etc.)
- **Unified Configuration**: Single source of truth for all AI platforms
- **Role Consolidation**: Streamlined from 21 roles to 8 focused roles
- **Enhanced MDC**: Organic growth and stable updates for Cursor
- **Project Cleanup**: Removed outdated files and improved structure

### Changed

- **File Structure**: Moved adapters to `src/adapters/` for better organization
- **Configuration Files**: Generate single files (CLAUDE, GEMINI) instead of folders
- **ROADMAP**: Updated to reflect Cortex Agent system and cross-platform support
- **Documentation**: Enhanced with code style guide and Cortex Agent documentation

### Improved

- **Cross-Platform Consistency**: All platforms use identical core protocols
- **Code Quality**: Enforced consistent TypeScript patterns and error handling
- **User Experience**: Simplified configuration and better error prevention
- **System Stability**: Reduced configuration complexity and improved maintainability

## [0.1.1] - 2025-07-27

### Added

- **Task Coordinator Role**: Intelligent orchestration of complex tasks by coordinating multiple AI roles
- **Experience Curator Role**: Systematic collection and analysis of development experiences
- **Self-Evolution Protocol**: Mandatory experience-driven learning and continuous improvement
- **Experience Recording System**: Daily experience records with templates and analysis
- **Enhanced Cursor Rules**: Updated with evolution protocols and coordination mechanisms
- **Comprehensive Documentation**: Detailed role definitions and usage examples

### Changed

- **Cursor Rules**: Simplified and enhanced with Self-Evolution Protocol
- **Role System**: Added coordination and learning capabilities
- **Documentation Structure**: Reorganized with better categorization and examples

### Improved

- **Role Coordination**: Better handling of complex multi-domain tasks
- **Learning Integration**: Systematic capture and application of development experiences
- **Documentation Quality**: More comprehensive and actionable guidance

## [0.1.0] - 2025-07-27

### Added

- **Core Role System**: Basic AI collaboration roles (Code Reviewer, QA Tester, etc.)
- **CLI Interface**: Command-line tools for role discovery and IDE configuration
- **Cursor Integration**: Cursor IDE rules and settings generation
- **Role Discovery**: Dynamic scanning and selection of appropriate roles
- **Documentation System**: Comprehensive documentation structure
- **IDE Adapters**: Framework for multiple IDE integrations

### Features

- Role discovery and selection
- IDE configuration generation
- Documentation-driven development
- Language-agnostic role design
- Single source of truth for role definitions

## Development Status

### Current Development Version: v0.1.2

- **Development Commit**: `1865e0c`
- **Focus**: Product Name Unification and Package Naming
- **Key Features**:
  - Unified product name to "Cortex AI" across all documentation
  - Updated package naming from `@cortex-ai/cli` to `@rikaidev/cortex`
  - Fixed all documentation references to use consistent package names
  - Improved package installation and update instructions
  - Experience system cleanup and documentation quality improvements
  - Enhanced template system with unified experience recording

### Development History

#### v0.1.1 Development

- **Commit**: `2cbda1a`
- **Focus**: Hygieia Integration and Experience Learning
- **Key Features**:
  - Integrated Hygieia's coordination and experience learning systems
  - Added comprehensive role system with specialized roles
  - Implemented experience recording system with CoT analysis
  - Enhanced cursor rules with evolution protocols

#### v0.1.0 Development

- **Commit**: `c4a2394`
- **Focus**: Core Foundation
- **Key Features**:
  - Initial development of Cortex AI Brain
  - Dynamic role discovery system
  - Document-driven learning system
  - Basic CLI functionality
  - Cursor IDE integration

### Recent Development Commits

- **4349f1d** - Simplified cursor rules to match Hygieia's efficient design
- **9d729c4** - Added i18n support and improved installation experience

## Development Notes

### Current Development Focus (v0.1.2)

#### Package Name Unification

- **Updated package name** from `@cortex-ai/cli` to `@rikaidev/cortex`
- **All documentation updated** to use consistent package naming
- **Installation commands standardized** across all platforms

#### Experience System Improvements

- **Experience records are internal use only** - not for public repository
- **Unified template system** with comprehensive CoT analysis
- **Enhanced documentation quality** and organization

### Development Migration Notes

#### From v0.1.1 to v0.1.2 Development

- Package naming consistency improvements
- Experience system cleanup and optimization
- Documentation structure enhancements

#### From v0.1.0 to v0.1.1 Development

- Hygieia system integration
- Experience recording system implementation
- Enhanced role coordination mechanisms
- Self-evolution protocols implementation

## Release Strategy

### First Official Release: v0.2.0

**Target**: First public release with comprehensive features
**Timeline**: TBD

#### Planned Features for v0.2.0

- VS Code extension development
- Enhanced CLI commands
- Performance optimizations
- Additional role templates
- Complete documentation and user guides
- Community-ready features

### Future Releases

#### v0.3.0

- Community role marketplace
- Advanced coordination features
- Multi-IDE support
- Enterprise features

#### v1.0.0

- AI collaboration platform
- Cross-project knowledge sharing
- Advanced analytics
- Enterprise-grade features

---

For detailed information about each release, see the [GitHub Releases](https://github.com/RikaiDev/cortex/releases) page.
