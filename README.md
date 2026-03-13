# ⚠️ Cortex AI - Archived

> **This project is no longer actively maintained.**  
> Released: 2025-07 | Last Updated: 2025-08

---

## Why Archived

This project was built in mid-2025 to solve AI coding assistant limitations:

- No persistent memory across sessions
- No structured workflows
- No impact analysis
- Limited context windows (128K)

**In 2026, these problems are now solved natively by AI models:**

| Feature  | Cortex AI (2025) | Native Solution (2026)     |
| -------- | ---------------- | -------------------------- |
| Memory   | Manual + MCP     | Claude Memory, Agent Teams |
| Context  | 128K             | **1M tokens** (Opus 4.6)   |
| Workflow | Template-based   | Native CLI agents          |
| Analysis | 72 static tools  | Semantic understanding     |

**Recommendation:** Use [Claude Code](https://github.com/anthropics/claude-code), [Gemini CLI](https://github.com/google-gemini/gemini-cli), or [OpenCode](https://github.com/anomalyco/opencode) instead.

---

## Historical Context

This was v0.12.0 - a working implementation with:

- 72 MCP tools across 16 categories
- Memory system with persistent learning
- Structured workflow system
- Impact analysis with dependency graphs
- Team knowledge sharing
- Constitution-driven development

Built when Claude 4.1 was the best model available. The AI landscape has changed dramatically since then.
