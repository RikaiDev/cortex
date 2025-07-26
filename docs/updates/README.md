# Project Updates & Notifications

This directory contains information about project updates, new features, and important changes that users should be aware of.

## Purpose

Keep users informed about:

- **New Features**: Recently added capabilities and improvements
- **Breaking Changes**: Important changes that may affect existing usage
- **Bug Fixes**: Resolved issues and improvements
- **Performance Updates**: Optimizations and speed improvements
- **Documentation Updates**: New guides, tutorials, and examples

## Update Categories

### **🚀 New Features**

- New roles added to the system
- Enhanced coordination mechanisms
- Improved CLI commands
- New IDE integrations

### **⚠️ Breaking Changes**

- Changes to role definitions that may affect existing workflows
- Updates to CLI command syntax
- Changes to configuration file formats
- Deprecated features and migration guides

### **🐛 Bug Fixes**

- Resolved issues in role discovery
- Fixed coordination problems
- Corrected documentation errors
- Performance improvements

### **📚 Documentation**

- New guides and tutorials
- Updated role definitions
- Enhanced examples and use cases
- Best practices and tips

### **⚡ Performance**

- Speed improvements
- Memory optimizations
- Reduced response times
- Better resource usage

## Update Channels

### **1. GitHub Releases**

- **Location**: [GitHub Releases](https://github.com/RikaiDev/cortex/releases)
- **Frequency**: Every significant update
- **Content**: Detailed changelog, migration guides, download links

### **2. Documentation Updates**

- **Location**: `docs/updates/` directory
- **Frequency**: Real-time as changes are made
- **Content**: Detailed explanations, examples, migration steps

### **3. CLI Notifications**

- **Location**: Built into `cortex` CLI commands
- **Frequency**: On command execution
- **Content**: Update notifications, new feature announcements

### **4. IDE Integration**

- **Location**: Cursor rules and other IDE configurations
- **Frequency**: When IDE configurations are updated
- **Content**: New role announcements, feature highlights

## Update Notification System

### **Automatic Notifications**

#### **CLI Update Check**

```bash
# Check for updates when running any command
cortex check-updates

# Automatic update check (built into commands)
cortex discover --check-updates
```

#### **IDE Update Detection**

- Cursor rules automatically detect new roles
- VS Code extension shows update notifications
- Configuration files include version tracking

### **Manual Update Process**

#### **1. Check Current Version**

```bash
cortex --version
# Output: cortex v0.1.0
```

#### **2. Check for Updates**

```bash
cortex check-updates
# Output:
# Current version: v0.1.0
# Latest version: v0.1.1
# New features: Task Coordinator, Experience Curator
# Breaking changes: None
```

#### **3. Update Installation**

```bash
# Update via npm/bun
bun update @cortex-ai/cli

# Or reinstall
bun install @cortex-ai/cli@latest
```

## Update History

### **v0.1.1 (Latest)**

- **Date**: 2025-07-27
- **Features**:
  - Added Task Coordinator role for complex task orchestration
  - Added Experience Curator role for systematic learning
  - Implemented Self-Evolution Protocol
  - Created experience recording system
- **Improvements**:
  - Enhanced role coordination mechanisms
  - Improved Cursor rules with evolution protocols
  - Added comprehensive documentation templates

### **v0.1.0**

- **Date**: 2025-07-27
- **Features**:
  - Initial release with core role system
  - Basic CLI functionality
  - Cursor IDE integration
  - Role discovery and selection
- **Components**:
  - Core role definitions
  - CLI commands
  - IDE adapters
  - Documentation system

## Migration Guides

### **Updating from v0.1.0 to v0.1.1**

#### **1. Update Installation**

```bash
bun update @cortex-ai/cli
```

#### **2. Regenerate IDE Configurations**

```bash
cortex generate-ide
```

#### **3. Review New Roles**

```bash
cortex discover
# This will now show Task Coordinator and Experience Curator
```

#### **4. Set Up Experience Recording**

```bash
# Create experience recording directory
mkdir -p docs/experiences/daily

# Copy templates
cp -r node_modules/@cortex-ai/cli/templates/experiences docs/experiences/daily/
```

## User Communication Strategy

### **Proactive Notifications**

#### **1. Release Announcements**

- GitHub release notes with detailed changelog
- Social media announcements (Twitter, LinkedIn)
- Community forum posts (Discord, Reddit)

#### **2. Documentation Updates**

- Real-time documentation updates
- New guide announcements
- Example and tutorial additions

#### **3. Feature Highlights**

- Blog posts for major features
- Video tutorials for complex features
- Community showcase of successful use cases

### **Reactive Support**

#### **1. Issue Tracking**

- GitHub Issues for bug reports
- Feature requests and enhancement proposals
- Community feedback and suggestions

#### **2. Community Support**

- Discord server for real-time help
- GitHub Discussions for questions
- Documentation comments for clarifications

#### **3. Migration Assistance**

- Step-by-step migration guides
- Community support for complex migrations
- Automated migration tools where possible

## Future Update Plans

### **Short-term (Next 2 weeks)**

- VS Code extension development
- Enhanced CLI commands
- More role templates
- Performance optimizations

### **Medium-term (Next 2 months)**

- Community role marketplace
- Advanced coordination features
- Multi-IDE support
- Enterprise features

### **Long-term (Next 6 months)**

- AI collaboration platform
- Cross-project knowledge sharing
- Advanced analytics and insights
- Enterprise-grade features

## Stay Updated

### **Subscribe to Updates**

- **GitHub**: Watch the repository for releases
- **Discord**: Join our community server
- **Newsletter**: Subscribe to our development newsletter
- **RSS**: Follow our blog for detailed updates

### **Contribute to Updates**

- **Report Issues**: Use GitHub Issues
- **Request Features**: Submit feature requests
- **Share Feedback**: Join community discussions
- **Contribute Code**: Submit pull requests

---

**We're committed to keeping you informed about every important update and improvement to help you get the most out of Cortex AI!**
