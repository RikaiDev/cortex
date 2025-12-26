# Cortex AI

**AI collaboration brain for coding assistants** - Memory, structure, and intelligence for your AI.

[![npm version](https://img.shields.io/npm/v/@rikaidev/cortex.svg)](https://www.npmjs.com/package/@rikaidev/cortex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/protocol-MCP-purple.svg)](https://modelcontextprotocol.io)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/)

---

## The Problem

AI coding assistants are powerful, but they share critical limitations:

| Limitation | Impact |
|------------|--------|
| **No Memory** | Every session starts fresh. Past decisions are forgotten. |
| **No Structure** | Responses vary wildly. Same prompt, different quality. |
| **No Validation** | No quality gates. AI can generate inconsistent code. |
| **No Impact Awareness** | AI doesn't understand how changes affect your codebase. |

**Result**: Unpredictable "vibe coding" that requires constant human oversight.

## The Solution

Cortex AI extends any MCP-compatible AI assistant with **memory, structure, and intelligence**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your AI Assistant                            │
│              (Claude Code / Cursor / Copilot)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ MCP Protocol
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CORTEX AI                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Memory     │ │  Workflows   │ │   Analysis   │            │
│  │   System     │ │   System     │ │   Engine     │            │
│  │              │ │              │ │              │            │
│  │ • Patterns   │ │ • Spec       │ │ • Security   │            │
│  │ • Decisions  │ │ • Plan       │ │ • Quality    │            │
│  │ • Lessons    │ │ • Tasks      │ │ • Impact     │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Persistent Memory
Your AI finally remembers. Patterns, decisions, and lessons persist across sessions.

```bash
# AI learns from this session
learn "Use React Query for server state, Zustand for client state"

# Months later, AI recalls this automatically
context "state management"
# → Returns: "Previously decided: React Query for server state..."
```

### Structured Workflows
Transform chaos into predictable delivery with phase-based development.

```
spec → clarify → plan → review → tasks → implement → release
```

### Impact Analysis
AI understands your codebase structure before making changes.

```bash
impact-analyze files:["src/auth/service.ts"]
# → 23 files affected
# → 2 breaking changes detected
# → Risk level: HIGH
```

### Code Intelligence (72 Tools)
Security scanning, quality analysis, test coverage, architecture validation—all built-in.

```bash
security-scan path:"src/"           # Find vulnerabilities
quality-analyze path:"src/"         # Detect code smells
test-suggest path:"src/services/"   # Suggest missing tests
```

### Constitution-Driven Development
Define your project's principles once. Every AI response respects them.

```markdown
<!-- .cortex/constitution.md -->
## Principles
- All functions must have JSDoc comments
- No console.log in production code
- Tests required for all public APIs
```

---

## Quick Start

### Install

```bash
npm install -g @rikaidev/cortex
```

### Connect to Your AI Assistant

**Claude Code:**
```bash
claude mcp add cortex -- npx -y @rikaidev/cortex@latest start
```

**Cursor:**
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["-y", "@rikaidev/cortex@latest", "start"]
    }
  }
}
```

### Initialize Your Project

```bash
cd your-project
cortex init
```

### Start Building

```bash
# In your AI assistant
spec "Add user authentication with OAuth"
```

---

## Tool Categories

Cortex provides **72 specialized tools** across 16 categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Workflow** | `spec` `clarify` `plan` `review` `tasks` `implement` | Structured development |
| **Memory** | `learn` `context` `correct` | Persistent knowledge |
| **Impact** | `impact-analyze` `impact-preview` `impact-validate` | Change assessment |
| **Quality** | `quality-analyze` `quality-complexity` `quality-duplicates` | Code smell detection |
| **Security** | `security-scan` `security-detect-secrets` `security-check-deps` | Vulnerability scanning |
| **Testing** | `test-analyze` `test-quality` `test-suggest` | Test gap identification |
| **Architecture** | `arch-validate` `arch-check` `arch-suggest` | Pattern validation |
| **Documentation** | `doc-analyze` `doc-validate` `doc-missing` | Documentation quality |

---

## Example Session

```bash
# 1. Define what you're building
> spec "Add real-time notifications with WebSocket"
✓ Created workflow: 001-realtime-notifications
✓ Generated: spec.md, checklists/requirements.md

# 2. Clarify ambiguities
> clarify
? Should notifications persist when user is offline?
> Yes, queue and deliver on reconnect
✓ Updated: spec.md

# 3. Create technical plan
> plan
✓ Generated: plan.md, CONTEXT.md
✓ Memory updated with tech stack decisions

# 4. Break into tasks
> tasks
✓ Generated: tasks.md
✓ Identified 3 parallelizable task groups

# 5. Implement
> implement
✓ Pre-checks: .gitignore validated, dependencies checked
✓ Executing tasks with quality validation...

# 6. Release
> release
✓ Analyzed: 12 commits, 3 workflows
✓ Generated: CHANGELOG.md, RELEASE_NOTES.md
```

---

## Before & After

### Before Cortex AI

```
Developer: "Add authentication"
AI: *generates code*
Developer: "Wait, that's inconsistent with our patterns"
AI: *generates different code*
Developer: "You broke the user service"
AI: "I don't see how they're connected"
```

### After Cortex AI

```
Developer: "Add authentication"

Cortex:
├─ Memory: "Auth pattern uses JWT + refresh tokens"
├─ Impact: "Will affect: UserService, 12 routes"
├─ Constitution: "Must include rate limiting"
└─ Security: "Checking for auth vulnerabilities..."

AI: *generates consistent, validated code*
```

---

## Project Structure

```
.cortex/
├── constitution.md          # Your project's principles
├── memory/
│   └── index.json          # Persistent knowledge store
├── templates/              # Workflow templates
│   └── commands/           # AI execution guides
└── workflows/
    └── 001-feature/        # Individual workflows
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

---

## Requirements

- Node.js 18+
- MCP-compatible AI assistant (Claude Code, Cursor, or any MCP client)

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT License - see [LICENSE](LICENSE).

---

## About RikaiDev

**Rikai** (理解) means "understanding" in Japanese. We build tools that help developers understand their work through AI assistance.

- [Cortex AI](https://github.com/RikaiDev/cortex-ai) - AI collaboration brain for coding assistants
- [Toki](https://github.com/RikaiDev/toki) - Automatic time tracking for developers

---

<p align="center">
  <strong>Stop vibe coding. Start building with intelligence.</strong>
</p>
