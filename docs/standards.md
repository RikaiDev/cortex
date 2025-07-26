[English](standards.md) | [繁體中文](i18n/zh-TW/standards.md)

# 📋 Documentation Standards Guide

This document defines the standards and formats that all files in the Cortex project should follow.

## 🎯 Documentation Standards Principles

### 1. Language Standards

- **Code and Technical Terms**: Use English
- **Comments and Documentation**: Use English
- **User Interface**: Provide bilingual support (English and Traditional Chinese)
- **README**: Provide English and Traditional Chinese versions

### 2. Format Standards

- **Markdown Files**: Use standard Markdown syntax
- **Code Blocks**: Specify language types
- **Tables**: Use standard Markdown table format
- **Heading Levels**: Use standard # ## ### levels

### 3. Naming Standards

- **File Names**: Use kebab-case
- **Directory Names**: Use kebab-case
- **English Version**: Use standard English names
- **Chinese Version**: Use `-zh-TW` suffix

## 📁 File Structure Standards

### Root Directory Files

```
/
├── README.md              # Main documentation (English)
├── README.zh-TW.md        # Main documentation (Traditional Chinese)
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE               # License file
├── ROADMAP.md            # Development roadmap
└── IMPROVEMENTS.md       # Improvement records
```

### Documentation Directory Structure

```
docs/
├── standards.md           # Documentation standards (English)
├── getting-started.md     # Quick start guide (English)
├── npm-scripts.md         # NPM Scripts guide (English)
├── role-authoring.md      # Role authoring guide (English)
├── advanced-config.md     # Advanced configuration (English)
├── best-practices.md      # Best practices (English)
├── api-reference.md       # API reference (English)
├── troubleshooting.md     # Troubleshooting (English)
├── i18n/                  # Internationalization
│   ├── README.md          # i18n guidelines
│   ├── zh-TW/             # Traditional Chinese
│   │   ├── standards.md
│   │   ├── getting-started.md
│   │   ├── npm-scripts.md
│   │   ├── role-authoring.md
│   │   ├── advanced-config.md
│   │   ├── best-practices.md
│   │   ├── api-reference.md
│   │   └── troubleshooting.md
│   ├── ja/                # Japanese (future)
│   ├── ko/                # Korean (future)
│   ├── es/                # Spanish (future)
│   └── fr/                # French (future)
└── ai-collaboration/      # AI collaboration documentation
    ├── README.md          # AI collaboration overview (English)
    ├── i18n/              # AI collaboration i18n
    │   ├── zh-TW/         # Traditional Chinese
    │   │   └── README.md
    │   ├── ja/            # Japanese (future)
    │   └── ko/            # Korean (future)
    ├── roles/             # Role definitions
    │   ├── README.md      # Role system documentation (English)
    │   ├── i18n/          # Role i18n
    │   │   ├── zh-TW/     # Traditional Chinese
    │   │   │   └── README.md
    │   │   ├── ja/        # Japanese (future)
    │   │   └── ko/        # Korean (future)
    │   ├── code-assistant.md
    │   ├── code-reviewer.md
    │   └── ...
    ├── templates/         # Template files
    └── examples/          # Example files
```

## 📝 Content Standards

### 1. Heading Format

```markdown
# Main Title (H1)

## Section Title (H2)

### Subsection Title (H3)

#### Subsection Title (H4)
```

### 2. Code Blocks

````markdown
# With language specification

```bash
npm install -g @rikaidev/cortex
```
````

# Without language specification

```
some code here
```

````

### 3. Table Format

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Content 1 | Content 2 | Content 3 |
````

### 4. Link Format

```markdown
[Link Text](URL)
[Relative Path Link](./relative-path.md)
```

### 5. Image Format

```markdown
![Alt Text](image-path)
```

## 🎭 Role Definition Standards

### 1. File Naming

- Use kebab-case
- Use descriptive names
- Examples: `code-assistant.md`, `frontend-specialist.md`

### 2. YAML Frontmatter Standards

```yaml
---
name: "Role Name"
description: "Brief description of the role's purpose"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities:
  - "Capability 1"
  - "Capability 2"
  - "Capability 3"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---
```

### 3. Content Structure Standards

```markdown
# Role: [Role Name]

## Description

Clear description of what the role does and its purpose.

## Capabilities

- Specific capability 1
- Specific capability 2
- Specific capability 3

## Keywords

keyword1, keyword2, keyword3

## Implementation Guidelines

- Guideline 1
- Guideline 2
- Guideline 3

## Examples

### Example 1

**Input:** "Example input"
**Output:** "Example output"

### Example 2

**Input:** "Another example input"
**Output:** "Another example output"
```

## 🔧 Technical Documentation Standards

### 1. API Documentation

````markdown
## Function Name

### Description

Brief description of the function.

### Parameters

- `param1` (type): Description
- `param2` (type): Description

### Returns

Return type and description.

### Example

```typescript
functionName(param1, param2);
```
````

````

### 2. Configuration Documentation

```markdown
## Configuration Option

### Type

`string` | `number` | `boolean` | `object`

### Default

Default value if not specified.

### Description

Detailed description of the option.

### Example

```json
{
  "option": "value"
}
````

````

## 🌐 Internationalization (i18n) Standards

### 1. Directory Structure

- **English**: Default language, located in root of each directory
- **Other Languages**: Located in `i18n/{locale}/` subdirectories
- **Locale Codes**: Use ISO 639-1 + ISO 3166-1 alpha-2 (e.g., `zh-TW`, `ja`, `ko`)

### 2. File Organization

```
docs/
├── filename.md              # English version
└── i18n/
    ├── zh-TW/
    │   └── filename.md      # Traditional Chinese version
    ├── ja/
    │   └── filename.md      # Japanese version (future)
    └── ko/
        └── filename.md      # Korean version (future)
```

### 3. Language Selection Format

```markdown
[English](../filename.md) | [繁體中文](filename.md) | [日本語](../ja/filename.md)
```

### 4. Translation Principles

- **Technical Accuracy**: Maintain precision of technical terms
- **Structural Consistency**: Preserve document structure across languages
- **Cultural Adaptation**: Adapt content to local cultural context
- **Complete Examples**: Ensure all code examples are preserved
- **Local Standards**: Follow local documentation conventions

### 5. Supported Locales

- **en**: English (default)
- **zh-TW**: Traditional Chinese
- **ja**: Japanese (planned)
- **ko**: Korean (planned)
- **es**: Spanish (planned)
- **fr**: French (planned)

## 📋 Checklists

### New File Creation Checklist

- [ ] Use correct file naming format
- [ ] Follow heading level standards
- [ ] Include appropriate code block language markers
- [ ] Use standard table format
- [ ] Provide language selection links (if applicable)
- [ ] Check Markdown syntax correctness
- [ ] Ensure content structure consistency

### Role Definition Checklist

- [ ] Use standard YAML frontmatter format
- [ ] Include all required fields
- [ ] Use descriptive keywords
- [ ] Provide specific capability descriptions
- [ ] Include practical examples
- [ ] Follow content structure standards

### Translation Checklist

- [ ] Accurate translation of technical terms
- [ ] Consistent document structure
- [ ] Complete code examples
- [ ] Natural language expression
- [ ] Provide language selection links

## 🚀 Tools and Resources

### 1. Markdown Checking Tools

- VS Code Markdown extensions
- markdownlint
- Prettier

### 2. Translation Tools

- Professional translation services
- Technical terminology glossary
- Consistency checking tools

### 3. Quality Assurance

- Automated checking scripts
- Document structure validation
- Link validity checking

---

**Following these standards ensures consistency and professionalism across all documentation, providing users with the best reading experience.**
````
