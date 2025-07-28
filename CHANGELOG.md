# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

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
