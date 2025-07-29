# Cortex AI Collaboration

This project uses Cortex AI for enhanced AI collaboration.

## Quick Start

1. Run `cortex generate-ide` to create IDE configurations
2. Restart your IDE
3. Start coding with AI assistance!

## Features

- **Real-time user preference learning** from conversation
- **Cross-platform consistency** across Cursor, Claude, and Gemini
- **Project-specific adaptations** based on your codebase
- **Structured thinking process** for better AI responses

## Architecture

- **MDC/GEMINI/CLAUDE** = Brain (real-time thinking and decision making)
- **docs** = Experience and long-term memory (learning and knowledge base)
- **Scripts** = Essential tools only

## User Preference Learning

The system learns from your feedback:
- Corrections: "不對", "錯誤", "錯了"
- Preferences: "我們用", "我們專案用"
- Prohibitions: "不要", "從來不用"
- Frustration: "又來了", "還是這樣"

The AI immediately applies learned preferences to current and future responses.
