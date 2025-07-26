# 🧠 Cortex AI - AI 協作大腦

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/)

Cortex 是一個智能 AI 協作系統，透過讀取專案文件中的角色定義，自動為每個任務選擇最適合的角色。

## 🚀 快速開始

### 安裝 Cortex

```bash
# 使用 npm 全域安裝
npm install -g @rikaidev/cortex

# 或使用 bun
bun add -g @rikaidev/cortex

# 或直接下載執行檔
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### 一鍵設置

```bash
# 在專案中設置 Cortex（自動檢測專案類型）
cortex setup

# 快速設置（使用預設配置）
cortex setup --quick

# 自定義設置
cortex setup --config my-config.json
```

### 開始使用

#### 選項 1：全域 CLI（推薦）

```bash
# 開始互動式協作
cortex start

# 發現角色和模式
cortex discover

# 生成 IDE 配置
cortex generate-ide
```

#### 選項 2：NPM Scripts（本地開發）

```bash
# 快速啟動（已設置完成）
npm run cortex:start

# 其他可用命令
npm run cortex:discover    # 發現專案模式
npm run cortex:generate-ide # 生成 IDE 配置
npm run cortex:setup       # 重新設置
```

## 🎯 Cortex 的功能

Cortex 會自動：

1. **檢測你的專案類型**（前端、後端、Python 等）
2. **根據專案需求創建適當的 AI 角色**
3. **生成 IDE 配置**以實現無縫 AI 整合
4. **整合現有系統**（如果你已有 AI 協作設置）
5. **根據你的查詢提供智能角色選擇**

## 📁 專案結構

設置完成後，你的專案將包含：

```
your-project/
├── docs/
│   └── ai-collaboration/
│       ├── roles/           # AI 角色定義
│       ├── templates/       # 角色模板
│       └── examples/        # 範例實作
├── .cursor/                 # Cursor IDE 配置
├── .vscode/                 # VS Code 配置
└── .cortex/                 # Cortex 配置
```

## 🎭 可用角色

Cortex 會根據專案類型自動創建角色：

### 所有專案

- **Code Assistant**：一般開發協助
- **Code Reviewer**：程式碼品質和最佳實踐

### 前端專案

- **Frontend Specialist**：UI/UX、React、Vue 等

### 後端專案

- **Backend Specialist**：API 設計、資料庫、伺服器架構

### Python 專案

- **Python Specialist**：Python 最佳實踐、框架

## 🛠️ 命令

### 設置和配置

#### 全域 CLI

```bash
cortex setup              # 一鍵設置
cortex integrate          # 整合現有系統
cortex init               # 傳統初始化
```

#### NPM Scripts

```bash
npm run cortex:setup      # 一鍵設置
npm run cortex:integrate  # 整合現有系統
npm run cortex:init       # 傳統初始化
```

### 分析和發現

#### 全域 CLI

```bash
cortex discover           # 發現角色和模式
cortex analyze-patterns   # 分析編碼模式
```

#### NPM Scripts

```bash
npm run cortex:discover   # 發現角色和模式
npm run cortex:analyze-patterns # 分析編碼模式
```

### IDE 整合

#### 全域 CLI

```bash
cortex generate-ide       # 生成 IDE 配置
cortex generate-role      # 創建新角色模板
```

#### NPM Scripts

```bash
npm run cortex:generate-ide  # 生成 IDE 配置
npm run cortex:generate-role # 創建新角色模板
```

### 協作

#### 全域 CLI

```bash
cortex start              # 開始互動式會話
```

#### NPM Scripts

```bash
npm run cortex:start      # 開始互動式會話
```

## 🔧 進階使用

### 自定義角色創建

在 `docs/ai-collaboration/roles/` 中創建自定義角色：

```markdown
---
name: "Security Specialist"
description: "Security expert for code review"
keywords: ["security", "vulnerability", "authentication"]
capabilities:
  - "Security code review"
  - "Vulnerability assessment"
version: "1.0.0"
---

# Role: Security Specialist

## Description

Security expert specialized in identifying vulnerabilities and security issues.

## Capabilities

- Security code review
- Vulnerability assessment
- Authentication guidance
```

### 整合現有系統

```bash
# 分析現有角色
cortex integrate --roles

# 分析現有工作流程
cortex integrate --workflows
```

## 🎯 使用案例

### 對於團隊

- **一致的 AI 協助**：跨團隊成員
- **專案特定專業知識**：基於你的程式碼庫
- **共享知識庫**：角色定義

### 對於個人

- **個人化 AI 協助**：基於你的專案
- **學習助手**：領域特定指導
- **程式碼審查夥伴**：具備上下文意識

### 對於專案

- **文件驅動的 AI**：從你的文件學習
- **可擴展協作**：隨專案成長
- **可維護的 AI 系統**：版本控制角色

## 🔄 從舊版遷移

如果你有現有的 Cortex 設置：

```bash
# 整合現有系統
cortex integrate

# 或重新開始設置
cortex setup
```

## 📊 效能

- **安裝時間**：30 秒（之前需要 5 分鐘）
- **設置**：1 個命令（之前需要 4+ 個命令）
- **學習曲線**：零（之前需要技術背景）

## 🤝 貢獻

1. Fork 專案
2. 創建功能分支
3. 進行變更
4. 添加測試（如適用）
5. 提交 Pull Request

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案。

## 🆘 支援

- **問題回報**：[GitHub Issues](https://github.com/RikaiDev/cortex/issues)
- **討論**：[GitHub Discussions](https://github.com/RikaiDev/cortex/discussions)
- **文件**：[docs/](docs/)

---

**Made with ❤️ by RikaiDev**
