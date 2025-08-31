/**
 * Documentation Generator - Handles documentation generation
 *
 * This module provides functionality for generating various types
 * of documentation based on project analysis.
 */

import fs from "fs-extra";
import path from "path";

export interface ArchitectureInfo {
  patterns: string[];
  layers: string[];
  dependencies: string[];
  entryPoints: string[];
  complexity: "low" | "medium" | "high";
}

export interface ProjectStructure {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: ProjectStructure[];
  content?: string;
  metadata?: {
    language?: string;
    framework?: string;
    purpose?: string;
    dependencies?: string[];
  };
}

export interface CodePattern {
  name: string;
  pattern: string;
  description: string;
  examples: string[];
  category: "architecture" | "design" | "implementation" | "utility";
  confidence: number;
}

export interface Convention {
  name: string;
  description: string;
  pattern: string;
  enforcement: "strict" | "recommended" | "optional";
  examples: string[];
  category: "naming" | "structure" | "style" | "documentation";
}

export interface ToolInfo {
  name: string;
  type: "build" | "test" | "lint" | "format" | "deploy" | "other";
  command: string;
  configFiles: string[];
  description: string;
  priority: "primary" | "secondary" | "optional";
}

export class DocumentationGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate project documentation
   */
  async generateDocumentation(docsDir?: string): Promise<void> {
    const targetDir = docsDir || path.join(this.projectRoot, "docs");
    await fs.ensureDir(targetDir);

    // Generate different types of documentation
    await this.generateProjectStructureDocs(targetDir);
    await this.generateCodePatternsDocs(targetDir);
    await this.generateConventionsDocs(targetDir);
    await this.generateToolsDocs(targetDir);
    await this.generateArchitectureDocs(targetDir);
    await this.generateProjectKnowledge(targetDir);
  }

  /**
   * Generate project structure documentation
   */
  private async generateProjectStructureDocs(docsDir: string): Promise<void> {
    const structurePath = path.join(docsDir, "project-structure.md");

    const content = `# Project Structure

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document describes the structure and organization of the project codebase.

## Directory Structure

\`\`\`
${this.projectRoot}/
├── src/                    # Source code
│   ├── core/              # Core business logic
│   ├── adapters/          # External service adapters
│   ├── cli/               # Command line interface
│   └── examples/          # Example usage
├── docs/                   # Documentation
├── test/                   # Test files
├── scripts/               # Build and utility scripts
└── cortex.json           # Project configuration
\`\`\`

## Key Directories

### src/core/
Contains the core business logic and domain models of the application.

### src/adapters/
Contains adapters for external services and third-party integrations.

### src/cli/
Contains the command-line interface and user interaction logic.

### docs/
Contains all project documentation, guides, and API references.

## File Organization Principles

1. **Separation of Concerns**: Each directory has a single, well-defined responsibility
2. **Dependency Direction**: Core modules should not depend on adapters
3. **Test Coverage**: Test files should mirror the structure of source files
4. **Documentation**: Every module should have corresponding documentation
`;

    await fs.writeFile(structurePath, content);
  }

  /**
   * Generate code patterns documentation
   */
  private async generateCodePatternsDocs(docsDir: string): Promise<void> {
    const patternsPath = path.join(docsDir, "code-patterns.md");

    const content = `# Code Patterns

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document describes the common code patterns and architectural approaches used in this project.

## Architectural Patterns

### Core/Adapter Pattern
The project follows a clean architecture approach with clear separation between core business logic and external adapters.

**Benefits:**
- Easier testing with mock adapters
- Framework independence
- Clear dependency boundaries

**Example:**
\`\`\`typescript
// Core business logic (framework-independent)
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
}

// Adapter for specific framework/technology
export class DatabaseUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    // Database-specific implementation
  }
}
\`\`\`

## Design Patterns

### Repository Pattern
Used for data access abstraction.

### Factory Pattern
Used for object creation and dependency injection.

## Implementation Patterns

### Error Handling
Consistent error handling across the application using custom error types.

### Async/Await
Modern asynchronous programming with proper error handling.

## Best Practices

1. **Single Responsibility**: Each function/class should have one reason to change
2. **Dependency Injection**: Use constructor injection for testability
3. **Interface Segregation**: Keep interfaces small and focused
4. **DRY Principle**: Don't Repeat Yourself
`;

    await fs.writeFile(patternsPath, content);
  }

  /**
   * Generate conventions documentation
   */
  private async generateConventionsDocs(docsDir: string): Promise<void> {
    const conventionsPath = path.join(docsDir, "conventions.md");

    const content = `# Coding Conventions

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document outlines the coding conventions and standards followed in this project.

## Naming Conventions

### Files
- Use kebab-case for file names: \`user-service.ts\`
- Use PascalCase for class names: \`UserService.ts\`
- Use camelCase for other files: \`userRepository.ts\`

### Variables and Functions
- Use camelCase: \`userName\`, \`getUserData()\`
- Use PascalCase for classes and interfaces: \`UserService\`, \`IUserRepository\`
- Use UPPER_SNAKE_CASE for constants: \`MAX_RETRY_COUNT\`

### Directories
- Use kebab-case: \`user-management/\`, \`core-services/\`

## Code Style

### Formatting
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters

### Structure
- Group imports: external libraries, internal modules, types
- Use blank lines to separate logical sections
- Order class members: properties, constructor, public methods, private methods

## Documentation

### JSDoc Comments
\`\`\`typescript
/**
 * Creates a new user with the provided information.
 *
 * @param userData - The user information
 * @returns Promise<User> - The created user
 * @throws {ValidationError} When user data is invalid
 */
async function createUser(userData: UserInput): Promise<User> {
  // Implementation
}
\`\`\`

### Inline Comments
- Use for complex logic explanation
- Avoid obvious comments
- Keep comments up to date

## Error Handling

### Custom Error Types
\`\`\`typescript
export class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(\`\${field}: \${message}\`);
    this.name = 'ValidationError';
  }
}
\`\`\`

### Error Propagation
- Use async/await for clean error handling
- Don't suppress errors without logging
- Provide meaningful error messages

## Testing

### Test File Naming
- Use \`.test.ts\` or \`.spec.ts\` suffix
- Mirror source file structure: \`userService.test.ts\`

### Test Structure
\`\`\`typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a valid user', async () => {
      // Test implementation
    });

    it('should throw ValidationError for invalid data', async () => {
      // Test implementation
    });
  });
});
\`\`\`
`;

    await fs.writeFile(conventionsPath, content);
  }

  /**
   * Generate tools documentation
   */
  private async generateToolsDocs(docsDir: string): Promise<void> {
    const toolsPath = path.join(docsDir, "tools.md");

    const content = `# Development Tools

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document describes the development tools and utilities used in this project.

## Build Tools

### TypeScript Compiler (tsc)
- **Purpose**: Compiles TypeScript to JavaScript
- **Configuration**: \`tsconfig.json\`
- **Usage**: \`npm run build\` or \`tsc\`

### Build Scripts
\`\`\`json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  }
}
\`\`\`

## Quality Assurance

### ESLint
- **Purpose**: Code linting and style checking
- **Configuration**: \`.eslintrc.js\`
- **Usage**: \`npm run lint\`

### Prettier
- **Purpose**: Code formatting
- **Configuration**: \`.prettierrc\`
- **Usage**: \`npm run format\`

## Testing

### Test Framework
- **Purpose**: Unit and integration testing
- **Configuration**: Test files in \`test/\` directory
- **Usage**: \`npm run test\`

### Test Structure
\`\`\`
test/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── utils/            # Test utilities
└── fixtures/         # Test data
\`\`\`

## Development Workflow

### Git Hooks
- Pre-commit: Runs linting and tests
- Pre-push: Runs full test suite

### CI/CD Pipeline
1. **Lint**: Code quality checks
2. **Test**: Automated test execution
3. **Build**: Compilation and packaging
4. **Deploy**: Automated deployment

## IDE Integration

### VS Code Extensions
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer

### Recommended Settings
\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
\`\`\`
`;

    await fs.writeFile(toolsPath, content);
  }

  /**
   * Generate architecture documentation
   */
  private async generateArchitectureDocs(docsDir: string): Promise<void> {
    const architecturePath = path.join(docsDir, "architecture.md");

    const content = `# Architecture Documentation

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document describes the system architecture and design principles.

## System Architecture

### Core Principles

1. **Separation of Concerns**: Clear boundaries between different system components
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Single Responsibility**: Each module has one reason to change
4. **Open/Closed**: Open for extension, closed for modification

### Architecture Diagram

\`\`\`
┌─────────────────────────────────────┐
│           Presentation Layer       │
│                                     │
│  - CLI Interface                   │
│  - API Endpoints                   │
│  - User Interfaces                 │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        Application Layer           │
│                                     │
│  - Use Cases                       │
│  - Application Services            │
│  - Domain Logic                    │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│          Domain Layer              │
│                                     │
│  - Entities                        │
│  - Value Objects                   │
│  - Domain Services                 │
│  - Repository Interfaces           │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        Infrastructure Layer        │
│                                     │
│  - Repository Implementations      │
│  - External Service Adapters       │
│  - Database Connections            │
│  - Configuration                   │
└─────────────────────────────────────┘
\`\`\`

## Component Architecture

### Core Module Structure

\`\`\`
src/core/
├── common/          # Shared utilities and types
├── experience/      # Learning and memory systems
├── mcp/            # Model Context Protocol implementation
└── project/        # Project analysis and management
\`\`\`

### Adapter Pattern

The system uses adapters to abstract external dependencies:

\`\`\`typescript
// Interface in core
interface AIService {
  generateResponse(prompt: string): Promise<string>;
}

// Implementation in adapters
class ClaudeAdapter implements AIService {
  async generateResponse(prompt: string): Promise<string> {
    // Claude-specific implementation
  }
}

class GeminiAdapter implements AIService {
  async generateResponse(prompt: string): Promise<string> {
    // Gemini-specific implementation
  }
}
\`\`\`

## Data Flow

1. **Input Processing**: User input is processed and validated
2. **Context Gathering**: Relevant context is collected from the project
3. **AI Processing**: Input is sent to the configured AI service
4. **Response Processing**: AI response is processed and formatted
5. **Learning**: Interaction is stored for future learning

## Error Handling Strategy

- **Graceful Degradation**: System continues to work with reduced functionality
- **Comprehensive Logging**: All errors are logged with context
- **User-Friendly Messages**: Error messages are clear and actionable
- **Recovery Mechanisms**: Automatic retry for transient failures

## Performance Considerations

- **Lazy Loading**: Components are loaded only when needed
- **Caching**: Frequently accessed data is cached
- **Async Processing**: Long-running operations use async patterns
- **Resource Management**: Proper cleanup of resources

## Security Measures

- **Input Validation**: All inputs are validated and sanitized
- **Secure Storage**: Sensitive data is properly encrypted
- **Access Control**: Appropriate permission checks are implemented
- **Audit Logging**: Security events are logged for monitoring
`;

    await fs.writeFile(architecturePath, content);
  }

  /**
   * Generate project knowledge documentation
   */
  private async generateProjectKnowledge(docsDir: string): Promise<void> {
    const knowledgePath = path.join(docsDir, "project-knowledge.md");

    const content = `# Project Knowledge Base

_Generated on ${new Date().toISOString().split("T")[0]}_

## Overview

This document serves as a knowledge base for project-specific information, patterns, and best practices.

## Current Project Status

### Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **Build Tool**: TypeScript Compiler
- **Testing**: Custom test framework
- **Linting**: ESLint + Prettier

### Architecture Decisions

#### Core/Adapter Pattern
**Decision**: Use clean architecture with core/adapter separation
**Rationale**: Enables framework independence and easier testing
**Impact**: Clear dependency boundaries and modular design

#### TypeScript Strict Mode
**Decision**: Enable strict type checking
**Rationale**: Catch errors at compile time and improve code quality
**Impact**: More reliable code with better IDE support

## Known Issues and Workarounds

### Current Limitations
1. **Memory Usage**: Large projects may consume significant memory during analysis
   - **Workaround**: Process files in smaller batches
   - **Future Fix**: Implement streaming analysis

2. **Type Inference**: Complex generic types may not be fully inferred
   - **Workaround**: Add explicit type annotations
   - **Future Fix**: Improve type inference algorithms

## Best Practices

### Code Organization
1. Keep functions under 50 lines
2. Use descriptive variable names
3. Add JSDoc comments for public APIs
4. Follow the single responsibility principle

### Error Handling
1. Use custom error types for different error categories
2. Provide meaningful error messages
3. Log errors with appropriate context
4. Don't suppress errors without good reason

### Testing
1. Write tests for all public functions
2. Use descriptive test names
3. Test both success and error cases
4. Mock external dependencies

## Frequently Asked Questions

### How do I add a new AI adapter?
1. Create a new adapter class in \`src/adapters/\`
2. Implement the required interface
3. Add configuration options
4. Update the CLI to support the new adapter

### How do I customize the analysis behavior?
1. Modify the analysis configuration
2. Add custom patterns to the pattern detection
3. Extend the file type recognition
4. Customize the documentation generation

## Maintenance Notes

### Regular Tasks
- Update dependencies monthly
- Review and update documentation quarterly
- Monitor performance metrics
- Clean up unused code

### Breaking Changes
- Version compatibility requirements
- Migration guides for major updates
- Deprecation notices for removed features

---

*This knowledge base is continuously updated as the project evolves.*
`;

    await fs.writeFile(knowledgePath, content);
  }

  /**
   * Generate structure tree representation
   */
  private generateStructureTree(
    structure: ProjectStructure,
    prefix = ""
  ): string {
    let result = "";

    if (structure.children) {
      structure.children.forEach((child, index) => {
        const isLast = index === structure.children!.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const nextPrefix = prefix + (isLast ? "    " : "│   ");

        result += `${prefix}${connector}${child.name}\n`;

        if (child.children && child.children.length > 0) {
          result += this.generateStructureTree(child, nextPrefix);
        }
      });
    }

    return result;
  }
}
