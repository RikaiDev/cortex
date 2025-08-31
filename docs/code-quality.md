# Code Quality Guidelines

This document outlines the code quality standards and automated quality checks used in the Cortex AI project. These guidelines ensure consistent, maintainable, and reliable code across the entire codebase.

## Core Quality Principles

### 1. Simplicity and Elegance

Quality code should be simple and effective, eliminating unnecessary complexity. Always look for ways to refactor code that make special cases disappear, turning them into normal cases.

- Prefer elegant solutions that handle edge cases naturally
- Avoid over-engineering simple problems
- Strive for code that is both powerful and understandable

### 2. Backward Compatibility

Never break existing functionality. Any change that could cause existing code to fail is considered a bug, regardless of theoretical correctness.

- Quality checks must ensure backward compatibility
- Changes should be evolutionary, not revolutionary
- Always consider the impact on existing users and integrations

### 3. Pragmatism in Practice

Solve actual problems, not imaginary threats. Quality checks should address real issues, not theoretical concerns.

- Tools should serve developers, not burden them
- Focus on practical improvements that matter
- Avoid perfectionism that hinders productivity

### 4. Simplicity Obsession

"If you need more than 3 levels of indentation, you're screwed, fix your program."

- Code should be concise and focused on doing one thing well
- Quality checks should enforce this simplicity
- Always question if there's a simpler approach

This document explains how to use the project's code quality checking tools, and how to distinguish between unused variables and variables reserved for future development.

## Automated Code Quality Checks

We provide automated code quality checking tools that can check code style, type errors, and formatting issues.

### Basic Usage

```bash
# Run basic checks
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Show detailed output
npm run lint:verbose
```

### Check Process

The automated checking tools perform the following checks:

1. **ESLint Check**: Checks code style and potential issues
2. **TypeScript Compiler Check**: Checks for type errors
3. **Prettier Format Check**: Checks code formatting

## Unused Variables vs Future Development Variables

During development, we often encounter unused variables. These variables can be:

1. **Truly unused variables**: These should be removed or renamed
2. **Intentionally unused variables**: These are temporarily unused but serve a specific purpose
3. **Variables reserved for future development**: These are reserved for future features

### Naming Conventions

To distinguish between these different types of variables, we use the following naming conventions:

- **Unused variables**: Normal naming, but will be flagged as errors by ESLint
- **Intentionally unused variables**: Start with `_`, e.g., `_unusedParam`
- **Variables reserved for future development**: Start with `_future_`, e.g., `_future_featureFlag`

### Checking Future Development Variables

We provide specialized tools to check and manage variables reserved for future development:

```bash
# Check future development variables
npm run lint:future

# Generate future development variables documentation
npm run lint:future:fix

# Show detailed output
npm run lint:future:verbose
```

## Best Practices

### Handling Unused Variables

1. **Remove truly unused variables**: If a variable is genuinely not needed, it should be removed
2. **Mark intentionally unused variables**: If a variable is temporarily unused but serves a specific purpose, prefix it with `_`
3. **Mark future development variables**: If a variable is reserved for future features, prefix it with `_future_`

### Documenting Future Development Variables

For variables reserved for future development, it's recommended to add comments explaining their purpose:

```typescript
// Reserved for future permission checking feature
const _future_permissionCheck = true;

// Reserved for future internationalization support
const _future_languageSupport = {
  enabled: false,
  defaultLanguage: "en",
};
```

## Automated Check Process

In CI/CD pipelines, you can add the following steps to ensure code quality:

```yaml
# Add to CI/CD configuration
steps:
  - name: Check code quality
    run: npm run lint

  - name: Check future development variables
    run: npm run lint:future
```

## Troubleshooting

### ESLint Reports Unused Variables

If ESLint reports an unused variable but you want to keep it, you have two options:

1. **Intentionally unused**: Rename the variable to start with `_`
2. **Future development**: Rename the variable to start with `_future_`

### TypeScript Compiler Errors

The TypeScript compiler may report type errors that usually need manual fixes. Common errors include:

1. **Missing type definitions**: Install the corresponding `@types` package
2. **Type mismatches**: Fix type definitions or variable usage

### Prettier Formatting Issues

Prettier formatting issues can usually be automatically fixed with `npm run lint:fix`.
