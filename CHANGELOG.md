# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Update notification system in CLI
- Version checking functionality
- Comprehensive changelog documentation

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

## Version History

### v0.1.1 (Latest)

- **Release Date**: 2025-07-27
- **Focus**: Coordination and Learning
- **Key Features**: Task Coordinator, Experience Curator, Self-Evolution Protocol

### v0.1.0

- **Release Date**: 2025-07-27
- **Focus**: Core Foundation
- **Key Features**: Basic role system, CLI, Cursor integration

## Migration Guides

### Updating from v0.1.0 to v0.1.1

#### Automatic Update

```bash
bun update @cortex-ai/cli
```

#### Manual Steps

1. **Regenerate IDE Configurations**

   ```bash
   cortex generate-ide
   ```

2. **Set Up Experience Recording**

   ```bash
   mkdir -p docs/experiences/daily
   cp -r node_modules/@cortex-ai/cli/templates/experiences docs/experiences/daily/
   ```

3. **Review New Roles**

   ```bash
   cortex discover
   ```

#### Breaking Changes

- None in this release

#### New Commands

- `cortex check-updates` - Check for available updates
- `cortex version` - Show current version

## Future Releases

### Planned for v0.1.2

- VS Code extension
- Enhanced CLI commands
- Performance optimizations
- Additional role templates

### Planned for v0.2.0

- Community role marketplace
- Advanced coordination features
- Multi-IDE support
- Enterprise features

### Planned for v1.0.0

- AI collaboration platform
- Cross-project knowledge sharing
- Advanced analytics
- Enterprise-grade features

---

For detailed information about each release, see the [GitHub Releases](https://github.com/RikaiDev/cortex/releases) page.
