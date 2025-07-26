# 🚀 快速開始指南

在 2 分鐘內讓 Cortex AI 在你的專案中運行！

## 📋 前置需求

- Node.js 18+ 或 Bun
- Git（用於版本控制）

## ⚡ 超快速設置

### 1. 安裝 Cortex

```bash
# 選擇你偏好的方法：

# 選項 A：npm（推薦）
npm install -g @rikaidev/cortex

# 選項 B：bun
bun add -g @rikaidev/cortex

# 選項 C：直接下載
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### 2. 在專案中設置

```bash
# 導航到你的專案
cd your-project

# 一鍵設置
cortex setup
```

就這樣！🎉 Cortex 現在可以開始使用了。

## 🎯 剛才發生了什麼？

Cortex 自動：

1. **檢測了你的專案類型**（前端、後端、Python 等）
2. **創建了適合你專案需求的 AI 角色**
3. **生成了 IDE 配置**以實現無縫 AI 整合
4. **設置了協作結構**在你的專案中

## 🚀 開始使用 Cortex

### 選項 1：互動模式（全域 CLI）

```bash
cortex start
```

### 選項 2：互動模式（NPM Scripts）

```bash
npm run cortex:start
```

### 選項 3：IDE 整合

開啟你的 IDE（Cursor、VS Code 等）- 配置已經設置完成！

### 選項 4：命令列

#### 全域 CLI

```bash
# 發現 Cortex 找到的內容
cortex discover

# 生成額外的 IDE 配置
cortex generate-ide
```

#### NPM Scripts

```bash
# 發現 Cortex 找到的內容
npm run cortex:discover

# 生成額外的 IDE 配置
npm run cortex:generate-ide
```

## 📁 創建了什麼

你的專案現在包含：

```
your-project/
├── docs/
│   └── ai-collaboration/
│       ├── roles/           # AI 角色定義
│       │   ├── code-assistant.md
│       │   ├── code-reviewer.md
│       │   └── [專案特定].md
│       ├── templates/       # 角色模板
│       └── examples/        # 範例實作
├── .cursor/                 # Cursor IDE 配置
├── .vscode/                 # VS Code 配置
└── .cortex/                 # Cortex 配置
```

## 🎭 你的 AI 角色

根據你的專案類型，Cortex 創建了這些角色：

### 所有專案

- **Code Assistant**：一般開發協助
- **Code Reviewer**：程式碼品質和最佳實踐

### 前端專案

- **Frontend Specialist**：UI/UX、React、Vue 等

### 後端專案

- **Backend Specialist**：API 設計、資料庫、伺服器架構

### Python 專案

- **Python Specialist**：Python 最佳實踐、框架

## 💬 開始聊天

現在你可以提出問題，Cortex 會自動選擇最適合的角色：

### 在你的 IDE 中

- 開啟 Cursor、VS Code 或你偏好的 IDE
- 開始與 AI 聊天 - 角色會自動載入
- 提出問題，例如：
  - "Review this code for security issues"
  - "Help me optimize this function"
  - "Design an API for this feature"

### 在終端機中

#### 全域 CLI

```bash
cortex start
```

#### NPM Scripts

```bash
npm run cortex:start
```

然後提出問題，例如：

- "What roles are available?"
- "Help me with this bug"
- "Review this code"

## 🔧 自定義

### 添加自定義角色

編輯 `docs/ai-collaboration/roles/` 中的檔案：

```markdown
---
name: "My Custom Role"
description: "Specialized for my project needs"
keywords: ["custom", "specialized"]
capabilities:
  - "Custom capability 1"
  - "Custom capability 2"
version: "1.0.0"
---

# Role: My Custom Role

## Description
Your custom role description...

## Capabilities
- Capability 1
- Capability 2
```

### 修改現有角色

編輯 `docs/ai-collaboration/roles/` 中的任何角色檔案來自定義行為。

## 🆘 故障排除

### 安裝問題

```bash
# 檢查 Cortex 是否已安裝
cortex --version

# 如需要重新安裝
npm uninstall -g @rikaidev/cortex
npm install -g @rikaidev/cortex
```

### 設置問題

```bash
# 檢查專案結構
ls -la docs/ai-collaboration/

# 重新運行設置
cortex setup

# 或重新開始
rm -rf docs/ai-collaboration/ .cursor/ .vscode/
cortex setup
```

### IDE 整合問題

```bash
# 重新生成 IDE 配置
cortex generate-ide

# 檢查配置是否存在
ls -la .cursor/ .vscode/
```

## 🎯 下一步

1. **探索你的角色**：檢查 `docs/ai-collaboration/roles/`
2. **開始聊天**：使用 `cortex start` 或你的 IDE
3. **自定義**：編輯角色定義以符合你的需求
4. **分享**：提交你的角色定義以與團隊分享

## 📚 了解更多

- [角色創作指南](role-authoring.md)
- [進階配置](advanced-config.md)
- [最佳實踐](best-practices.md)
- [API 參考](api-reference.md)

---

**需要幫助？** 查看我們的 [GitHub Issues](https://github.com/RikaiDev/cortex/issues) 或 [Discussions](https://github.com/RikaiDev/cortex/discussions)。 