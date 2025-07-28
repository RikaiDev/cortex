[English](README.md) | [繁體中文](../i18n/zh-TW/README.md)

# AI Collaboration Brain

## Overview

This directory contains the **brain structure** for Cortex AI - the core thinking and learning system that transforms AI models into intelligent, learning partners.

## 🧠 **Brain Architecture**

### **Core Principle**

**Cortex AI** = **Brain** (prompt injection) + **Experience** (learning from conversation)

- **🧠 Brain** - Structured thinking through prompt injection
- **📚 Experience** - Real-time learning from user feedback
- **🔄 Evolution** - Continuous improvement without repeating mistakes

### **How It Works**

```
User Input → Brain Processing → Learning → Experience Storage → Future Application
```

1. **User provides feedback** (e.g., "不對", "我們用", "不要")
2. **Brain processes** with structured thinking
3. **System learns** the preference immediately
4. **Experience stored** in long-term memory
5. **Applied to future** responses automatically

## 🎯 **Learning System**

### **Preference Detection**

The system learns from these keywords:

- **Corrections**: "不對", "錯誤", "錯了", "不是這樣"
- **Preferences**: "我們用", "我們專案用", "我們團隊習慣"
- **Prohibitions**: "不要", "從來不用", "禁止"
- **Frustration**: "又來了", "還是這樣", "跟你說過"

### **Learning Examples**

```
User: "註解又開始寫中文了？"
AI: [Learns] Write all comments in English

User: "我們用 uv run pytest"
AI: [Learns] Always use uv run for Python commands

User: "我們專案都用 nx test"
AI: [Learns] Always use nx test for testing

User: "又來了"
AI: [Learns] Don't repeat the same mistake
```

## 🧠 **Structured Thinking**

### **6-Step Thinking Process**

Every AI response follows this mandatory structure:

1. **🎯 Intent Exploration** - What does the user REALLY want to achieve?
2. **🔍 Problem Analysis** - Understanding the issue
3. **📚 Knowledge Integration** - Applying learned preferences
4. **💡 Solution Development** - Considering user patterns
5. **⚡ Implementation Planning** - Respecting user preferences
6. **✅ Quality Validation** - Ensuring preference compliance

### **Response Format**

```
🎯 INTENT EXPLORATION: What does the user REALLY want?

🎭 ROLE DISCOVERY: Scanning docs/ai-collaboration/roles/

📚 LEARNING PHASE:
[Learn from user feedback and preferences in conversation]

🔍 ANALYSIS PLAN:
[Apply learned preferences to current problem analysis]

⚡ EXECUTION:
[Implement solution that respects user preferences and intent]
```

## 🛠️ **Basic Role Definitions**

### **Simple Role Structure**

Each role follows this simplified format:

```yaml
---
name: "Role Name"
description: "Brief description"
capabilities:
  - "Capability 1"
  - "Capability 2"
keywords:
  - "keyword1"
  - "keyword2"
version: "1.0.0"
---
```

### **Core Roles**

- **Code Assistant** - General development and coding
- **Code Reviewer** - Code quality and best practices
- **Architecture Designer** - System design and patterns
- **Experience Curator** - Learning and knowledge management

## 🔄 **Cross-Platform Consistency**

### **Unified Behavior**

The same brain works across all platforms:

- **Cursor** - Enhanced MDC with preference learning
- **Claude** - Context-aware system messages
- **Gemini** - Platform-specific prompt engineering

### **Same Learning Everywhere**

- **Same preferences** applied across all platforms
- **Same thinking** process on all platforms
- **Same evolution** through conversation
- **Same consistency** in behavior

## 🎯 **Key Benefits**

- **🧠 Structured Thinking** - Systematic approach to problem-solving
- **📚 Real-Time Learning** - Immediate preference detection and application
- **🔄 No Repetition** - Never repeats corrected mistakes
- **🌐 Cross-Platform** - Consistent behavior everywhere
- **⚡ Simple Setup** - Just initialize and start learning

## 🚀 **Getting Started**

1. **Initialize** - `cortex init`
2. **Generate IDE configs** - `cortex generate-ide`
3. **Start coding** - The AI learns from your feedback
4. **Provide feedback** - Use preference keywords
5. **Watch it learn** - See immediate improvements

---

**Transform your AI interactions from frustrating repetitions to intelligent, learning partnerships with Cortex AI.**
