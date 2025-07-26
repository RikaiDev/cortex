# Contributing to Cortex

Thank you for your interest in contributing to Cortex! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup Development Environment

1. **Fork and Clone**

   ```bash
   git clone https://github.com/RikaiDev/cortex.git
   cd cortex
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Project Structure

```
src/
├── core/           # Core engine components
├── cli/            # Command line interface
├── adapters/       # Platform integrations
└── types.ts        # Type definitions
```

### Adding New Features

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Feature**
   - Add tests for new functionality
   - Update documentation
   - Follow existing code patterns

3. **Test Your Changes**

   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Submit Pull Request**
   - Provide clear description of changes
   - Include any relevant issue numbers
   - Ensure all tests pass

## 🎭 Adding New Roles

### Role Template Structure

```markdown
---
name: "Role Name"
description: "Brief description of the role"
keywords: ["keyword1", "keyword2"]
capabilities:
  - "Capability 1"
  - "Capability 2"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---

# Role: Role Name

## Description

Detailed description of the role and its purpose.

## Capabilities

- Specific capabilities and skills

## Keywords

Comma-separated keywords for role discovery

## Implementation Guidelines

- Guidelines for how the role should behave

## Examples

### Example 1

**Input:** "Example user input"
**Output:** "Example AI response"
```

### Role Guidelines

- Make roles specific and focused
- Include clear examples
- Use descriptive keywords
- Consider project-specific needs

## 🐛 Reporting Issues

### Bug Reports

- Use the bug report template
- Include steps to reproduce
- Provide error messages and logs
- Specify environment details

### Feature Requests

- Use the feature request template
- Explain the problem you're solving
- Provide use case examples
- Consider implementation complexity

## 📚 Documentation

### Contributing to Docs

- Keep documentation up to date
- Use clear, concise language
- Include code examples
- Test all code snippets

### Documentation Structure

```
docs/
├── getting-started.md
├── role-authoring.md
├── best-practices.md
└── api-reference.md
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.ts
```

### Writing Tests

- Test both success and error cases
- Use descriptive test names
- Mock external dependencies
- Maintain good test coverage

## 🔄 Release Process

### Versioning

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Update CHANGELOG.md for all releases
- Tag releases in Git

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow project conventions

### Communication

- Use GitHub issues for discussions
- Join our community channels
- Ask questions in discussions
- Share your experiences

## 📄 License

By contributing to Cortex, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Cortex! 🧠
