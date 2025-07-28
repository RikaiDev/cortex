# Language-Specific Best Practices

## Overview

This directory contains language-specific best practices that are automatically applied by the Code Assistant role based on project language detection.

## Structure

```
languages/
├── README.md                    # This file - overview and guidelines
├── javascript/
│   ├── best-practices.md        # JavaScript specific practices
│   ├── patterns.md              # Common patterns and conventions
│   └── tools.md                 # Recommended tools and configurations
├── typescript/
│   ├── best-practices.md
│   ├── patterns.md
│   └── tools.md
├── python/
│   ├── best-practices.md
│   ├── patterns.md
│   └── tools.md
├── java/
│   ├── best-practices.md
│   ├── patterns.md
│   └── tools.md
└── shared/
    ├── security.md              # Cross-language security practices
    ├── performance.md           # Performance optimization guidelines
    └── testing.md               # Testing strategies
```

## Language Detection

The Code Assistant automatically detects languages by analyzing:

- File extensions and naming patterns
- Package.json, requirements.txt, pom.xml, etc.
- Project structure and conventions
- Existing code patterns

## Best Practice Application

### Automatic Selection

1. **Primary Language**: Most frequently used language in the project
2. **Secondary Languages**: Supporting languages and tools
3. **Framework Detection**: Identify frameworks and apply framework-specific practices
4. **Pattern Consistency**: Ensure consistent patterns across all detected languages

### Product-Focused Approach

- **User Experience**: Prioritize practices that enhance user experience
- **Maintainability**: Choose practices that improve long-term maintainability
- **Performance**: Apply performance optimization practices
- **Security**: Implement security best practices for each language

## Contributing

When adding new language practices:

1. Follow the established structure (best-practices.md, patterns.md, tools.md)
2. Include product-focused guidelines
3. Provide concrete examples
4. Consider cross-language consistency
5. Update this README with new language information

## Version Control

Each language directory includes version information to ensure practices remain current with language evolution and industry standards.
