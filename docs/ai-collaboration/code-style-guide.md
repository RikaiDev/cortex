# Cortex AI Code Style Guide

## Overview

This document defines the coding standards and patterns used in the Cortex AI project. **ALL AI-generated code MUST follow these patterns.**

## Core Principles

### **1. Consistency First**

- **ALWAYS** analyze existing code before writing new code
- **ALWAYS** match existing naming conventions and patterns
- **NEVER** introduce new patterns without justification

### **2. Project-Specific Patterns**

- **TypeScript** with strict typing
- **ES Modules** (import/export)
- **Async/Await** for all asynchronous operations
- **Error handling** with try/catch blocks
- **Logging** with chalk for colored output

## File Structure Patterns

### **Class Definitions**

```typescript
export class ClassName {
  private propertyName: string;

  constructor(parameter: string) {
    this.propertyName = parameter;
  }

  public async methodName(): Promise<void> {
    try {
      // Implementation
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      throw error;
    }
  }
}
```

### **Interface Definitions**

```typescript
export interface InterfaceName {
  propertyName: string;
  optionalProperty?: string;
  methodName(): Promise<void>;
}
```

### **Type Definitions**

```typescript
export type TypeName = {
  propertyName: string;
  optionalProperty?: string;
};
```

## Naming Conventions

### **Files and Directories**

- **kebab-case** for file names: `role-discovery.ts`
- **PascalCase** for class files: `CortexCLI.ts`
- **camelCase** for utility files: `utils.ts`

### **Classes and Interfaces**

- **PascalCase** for classes: `DynamicRoleDiscovery`
- **PascalCase** for interfaces: `RoleDefinition`
- **PascalCase** for types: `ProjectContext`

### **Methods and Properties**

- **camelCase** for methods: `discoverRoles()`
- **camelCase** for properties: `projectPath`
- **camelCase** for variables: `roleDefinitions`

### **Constants**

- **UPPER_SNAKE_CASE** for constants: `MAX_RETRY_ATTEMPTS`
- **camelCase** for configuration: `defaultConfig`

## Error Handling Patterns

### **Standard Error Handling**

```typescript
try {
  const result = await asyncOperation();
  return result;
} catch (error) {
  console.error(chalk.red(`Error in operation: ${error.message}`));
  throw new Error(`Operation failed: ${error.message}`);
}
```

### **Validation Patterns**

```typescript
if (!requiredParameter) {
  throw new Error(`Required parameter 'requiredParameter' is missing`);
}
```

## Logging Patterns

### **Success Messages**

```typescript
console.log(chalk.green("✅ Operation completed successfully"));
```

### **Info Messages**

```typescript
console.log(chalk.blue("ℹ️  Processing data..."));
```

### **Warning Messages**

```typescript
console.log(chalk.yellow("⚠️  Warning: This is a warning message"));
```

### **Error Messages**

```typescript
console.error(chalk.red("❌ Error: This is an error message"));
```

## CLI Command Patterns

### **Command Structure**

```typescript
async commandName(options: CommandOptions = {}): Promise<void> {
  console.log(chalk.blue("🚀 Starting command..."));

  try {
    // Implementation
    console.log(chalk.green("✅ Command completed successfully"));
  } catch (error) {
    console.error(chalk.red(`❌ Command failed: ${error.message}`));
    throw error;
  }
}
```

### **Options Interface**

```typescript
interface CommandOptions {
  verbose?: boolean;
  config?: string;
  output?: string;
}
```

## Documentation Patterns

### **JSDoc Comments**

```typescript
/**
 * Brief description of the function
 * @param parameterName - Description of parameter
 * @returns Description of return value
 * @throws Description of exceptions
 */
async functionName(parameterName: string): Promise<void> {
  // Implementation
}
```

### **Inline Comments**

```typescript
// Brief explanation of complex logic
const result = complexCalculation();
```

## Testing Patterns

### **Test File Structure**

```typescript
describe("ClassName", () => {
  describe("methodName", () => {
    it("should handle normal case", async () => {
      // Test implementation
    });

    it("should handle error case", async () => {
      // Error test implementation
    });
  });
});
```

## Import/Export Patterns

### **Import Order**

1. Node.js built-in modules
2. Third-party packages
3. Local modules (relative paths)

```typescript
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";

import { Role, Task } from "../core/types.js";
import { DynamicRoleDiscovery } from "../core/role-discovery.js";
```

### **Export Patterns**

```typescript
// Named exports for classes and interfaces
export class ClassName {}
export interface InterfaceName {}

// Default export for main functionality
export default ClassName;
```

## Configuration Patterns

### **Configuration Objects**

```typescript
const defaultConfig = {
  timeout: 5000,
  retries: 3,
  verbose: false,
} as const;
```

## Validation Patterns

### **Input Validation**

```typescript
function validateInput(input: unknown): asserts input is string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  if (input.trim().length === 0) {
    throw new Error("Input cannot be empty");
  }
}
```

## Performance Patterns

### **Async Operations**

```typescript
// Use Promise.all for parallel operations
const results = await Promise.all([operation1(), operation2(), operation3()]);
```

### **Batch Processing**

```typescript
// Process items in batches
const batchSize = 10;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await processBatch(batch);
}
```

## Security Patterns

### **Input Sanitization**

```typescript
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "");
}
```

### **Path Validation**

```typescript
function validatePath(filePath: string): void {
  if (path.isAbsolute(filePath)) {
    throw new Error("Absolute paths are not allowed");
  }
}
```

## Common Anti-Patterns to Avoid

### **❌ Don't Do This**

```typescript
// Don't use any type
const data: any = getData();

// Don't ignore errors
try {
  await operation();
} catch (error) {
  // Empty catch block
}

// Don't use console.log for errors
console.log("Error occurred");

// Don't use var
var variable = "value";
```

### **✅ Do This Instead**

```typescript
// Use proper typing
const data: DataType = getData();

// Handle errors properly
try {
  await operation();
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  throw error;
}

// Use console.error for errors
console.error(chalk.red("Error occurred"));

// Use const or let
const variable = "value";
```

## Style Validation Checklist

Before submitting any code, ensure:

- [ ] Follows existing naming conventions
- [ ] Uses proper error handling patterns
- [ ] Includes appropriate logging
- [ ] Has proper TypeScript typing
- [ ] Follows file structure patterns
- [ ] Uses consistent import/export patterns
- [ ] Includes JSDoc comments for public APIs
- [ ] Passes linting and formatting checks
- [ ] Matches existing code style in the same file/module

---

**Remember: Consistency is more important than personal preference. Always match the existing codebase style.**
