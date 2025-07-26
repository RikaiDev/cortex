# 🌐 Internationalization (i18n) Guide

This guide explains the internationalization structure and standards for Cortex documentation.

## Overview

Cortex documentation follows a structured internationalization approach to support multiple languages while maintaining consistency and quality.

## Directory Structure

```
docs/
├── filename.md              # English version (default)
└── i18n/
    ├── README.md            # This file
    ├── zh-TW/               # Traditional Chinese
    │   ├── filename.md
    │   └── ...
    ├── ja/                  # Japanese (planned)
    ├── ko/                  # Korean (planned)
    ├── es/                  # Spanish (planned)
    └── fr/                  # French (planned)
```

## Locale Codes

We use standard ISO locale codes:

- **en**: English (default)
- **zh-TW**: Traditional Chinese
- **ja**: Japanese
- **ko**: Korean
- **es**: Spanish
- **fr**: French

## Translation Standards

### 1. File Naming

- Use the same filename as the English version
- No locale suffix in the filename
- Locale is indicated by directory structure

### 2. Language Selection Links

Each file should include language selection links at the top:

```markdown
[English](../filename.md) | [繁體中文](filename.md) | [日本語](../ja/filename.md)
```

### 3. Content Standards

- **Technical Terms**: Maintain accuracy of technical terminology
- **Code Examples**: Preserve all code examples exactly
- **Structure**: Keep the same document structure
- **Cultural Adaptation**: Adapt content for local context where appropriate

## Translation Process

### 1. Identify Files to Translate

- Start with core documentation (README, getting-started)
- Prioritize user-facing content
- Consider community demand for specific languages

### 2. Translation Guidelines

- **Accuracy**: Ensure technical accuracy
- **Clarity**: Maintain clear, understandable language
- **Consistency**: Use consistent terminology
- **Completeness**: Translate all content, including examples

### 3. Quality Assurance

- **Review**: Have native speakers review translations
- **Technical Review**: Ensure technical accuracy
- **Consistency Check**: Verify terminology consistency
- **Link Validation**: Check all links work correctly

## Adding New Languages

### 1. Create Locale Directory

```bash
mkdir -p docs/i18n/{locale}
```

### 2. Update Language Selection Links

Add the new language to existing language selection links.

### 3. Update This Guide

Add the new locale to the supported locales list.

## Best Practices

### 1. Translation Quality

- Use professional translation services when possible
- Maintain technical accuracy above all else
- Consider cultural context and local conventions

### 2. Maintenance

- Keep translations up-to-date with English versions
- Regular review and updates
- Community feedback integration

### 3. Consistency

- Use consistent terminology across all translations
- Maintain consistent formatting and structure
- Follow local documentation conventions

## Tools and Resources

### Translation Tools

- **Professional Services**: For high-quality translations
- **Machine Translation**: For initial drafts (with human review)
- **Glossary**: Maintain technical terminology glossary
- **Style Guide**: Language-specific style guides

### Quality Assurance

- **Automated Checks**: Link validation, structure verification
- **Manual Review**: Native speaker review
- **Community Feedback**: User feedback and suggestions

## Community Contributions

### Guidelines for Contributors

1. **Fork and Clone**: Start with the repository
2. **Create Branch**: Use descriptive branch names
3. **Translate**: Follow established standards
4. **Test**: Verify all links and formatting
5. **Submit PR**: Include clear description of changes

### Review Process

1. **Technical Review**: Ensure technical accuracy
2. **Language Review**: Native speaker review
3. **Formatting Check**: Verify Markdown formatting
4. **Link Validation**: Check all links work
5. **Approval**: Maintainer approval

---

**This internationalization structure ensures that Cortex documentation is accessible to developers worldwide while maintaining high quality and consistency.**
