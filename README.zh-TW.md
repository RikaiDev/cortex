# Cortex AI

[![Version](https://img.shields.io/badge/version-v0.8.0-blue.svg)](https://github.com/RikaiDev/cortex/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/runtime-Node.js-green.svg)](https://nodejs.org/)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/) | [Updates](docs/updates/) | [Changelog](CHANGELOG.md)

## 🧠 AI 協作大腦

**Cortex AI** 是一個 AI 協作系統，將 AI 模型轉化為智慧學習夥伴。它透過 **prompt injection** 和 **即時偏好學習** 解決 AI 不一致和缺乏記憶的核心問題。

### 🎯 **為什麼要做 Cortex？**

**問題背景：**

- AI 模型缺乏穩定的思考流程（Chain-of-Thought）
- AI 忘記使用者偏好，重複犯同樣錯誤
- 不同 AI 平台行為不一致
- 缺乏個人化或從對話中學習的能力

**解決方案：**

- **🧠 大腦** - 透過 prompt injection 實現結構化思考
- **📚 經驗** - 從使用者回饋中即時學習
- **🔄 進化** - 持續改進，不再重複錯誤

### 🏗️ **架構**

```text
🧠 大腦 (MDC/GEMINI/CLAUDE)
├── 即時思考和決策
├── 結構化 5 步思考流程
├── 從對話中學習用戶偏好
└── 跨平台一致性

📚 經驗 (docs)
├── 長期記憶和知識庫
├── 專案特定模式和慣例
├── 從成功互動中學習
└── 持續知識演化

🛠️ 必要工具
├── AI 增強的 prompt injection
├── 用戶偏好檢測和應用
├── 跨平台適配器系統
└── 簡化的 CLI 核心操作
```

## ✨ **核心功能**

### **🧠 結構化思考**

- **6 步思考流程**：意圖探索 → 問題分析 → 知識整合 → 解決方案開發 → 實施規劃 → 品質驗證
- **強制協議**：強制 AI 系統性思考，無論模型能力如何
- **品質驗證**：確保完整和邏輯思考

### **📚 即時學習**

- **使用者偏好檢測**：從關鍵字學習，如 "不對"、"我們用"、"不要"
- **立即應用**：將學習的偏好應用到目前回應
- **不重複**：絕不重複已修正的錯誤
- **挫折檢測**：識別並從使用者挫折中學習

### **🔄 跨平台一致性**

- **Cursor 整合**：強化 MDC 與偏好學習
- **Claude 支援**：情境感知系統訊息
- **Gemini 支援**：平台特定 prompt 工程
- **統一行為**：所有平台相同的學習和思考

## 🚀 **快速開始**

### **安裝**

```bash
# 直接透過 npx 執行（推薦）
npx @rikaidev/cortex@latest

# 或全域安裝
npm install -g @rikaidev/cortex
```

> **注意**：使用 `@rikaidev/cortex@latest` 確保您始終獲得最新版本，無需手動更新。

### **MCP 客戶端配置**

將以下設定新增到您的 MCP 客戶端：

```json
{
  "mcpServers": {
    "cortex-ai": {
      "command": "npx",
      "args": ["-y", "@rikaidev/cortex@latest"]
    }
  }
}
```

#### **支援的 MCP 客戶端**

#### Claude Code

```bash
claude mcp add cortex-ai npx @rikaidev/cortex@latest
```

#### Cursor

- 前往 `Cursor Settings` → `MCP` → `New MCP Server`
- 使用上述設定

#### VS Code

```bash
code --add-mcp '{"name":"cortex-ai","command":"npx","args":["@rikaidev/cortex@latest"]}'
```

#### Copilot CLI

```bash
copilot
/mcp add
# Server name: cortex-ai
# Command: npx
# Arguments: -y, @rikaidev/cortex@latest
```

### **初始化專案**

```bash
# 初始化 Cortex 工作區結構和 IDE 整合
npx @rikaidev/cortex@latest init

# 或跳過 IDE 整合，僅設定工作區
npx @rikaidev/cortex@latest init --skip-ide

# 稍後重新產生 IDE 設定（如需要）
npx @rikaidev/cortex@latest generate-rules
```

### **初始化 MCP 工作區**（推薦）

針對最新的多角色模式工作流程：

```bash
# 初始化 Cortex 工作區結構
npx @rikaidev/cortex@latest init

# 啟動 MCP 伺服器進行工作流程管理
npx @rikaidev/cortex@latest start

# 運行工作流程演示查看多角色模式運作
node examples/integrated-multi-role-demo.js
```

新的 MCP 方法為每個工作流程建立隔離的工作區：

```text
.cortex/
├── .cortexrc              # 設定檔案
├── workflows/             # 工作流程狀態檔案
├── workspaces/            # 個別工作區資料夾（雜湊式）
│   └── abc12345/          # 每個工作流程的獨特工作區
│       ├── handoff.md     # 角色交接文件
│       └── pr.md          # 拉取請求描述
└── roles/                 # 角色定義
```

### **開始學習**

```bash
# 開始 AI 協作
npx @rikaidev/cortex@latest start

# 顯示版本
npx @rikaidev/cortex@latest version
```

## 🎯 **如何運作**

### **1. 從對話中學習**

```text
使用者：「註解又開始寫中文了？」
AI：[學習] 所有註解用英文寫

使用者：「我們用 uv run pytest」
AI：[學習] Python 命令都用 uv run

使用者：「又來了」
AI：[學習] 不要重複同樣的錯誤
```

### **2. 結構化思考**

```text
🔍 分析階段：[問題理解]
📚 知識整合：[應用學習的偏好]
💡 解決方案開發：[考慮使用者模式]
⚡ 實施規劃：[尊重使用者偏好]
✅ 品質驗證：[確保偏好合規]
```

### **3. 跨平台一致性**

- **相同學習** 在 Cursor、Claude 和 Gemini 之間
- **相同思考** 流程在所有平台
- **相同偏好** 應用到各處
- **相同演化** 通過對話

## 📚 **文檔**

- **[快速開始](docs/getting-started.md)** - 快速設定指南
- **[AI 協作](docs/ai-collaboration/)** - 系統架構和角色
- **[經驗學習](docs/experiences/)** - 學習和改進系統
- **[更新和通知](docs/updates/)** - 了解變更
- **[路線圖](ROADMAP.md)** - 未來開發計畫

## 🛠️ **開發**

### **先決條件**

- Node.js 18+
- TypeScript 知識

### **設定**

```bash
# 複製儲存庫
git clone https://github.com/RikaiDev/cortex.git
cd cortex

# 安裝依賴
npm install

# 建置專案
npm run build

# 執行程式碼品質和安全檢查
npm run quality

# 僅執行安全檢查
npm run security

# 執行測試
npm run test

# 開始開發
npm run dev
```

### **貢獻**

- [貢獻指南](CONTRIBUTING.md)
- [行為準則](CODE_OF_CONDUCT.md)
- [開發設定](docs/development/)

## 🎯 **為什麼取名 "Cortex"？**

**Cortex（大腦皮質）** 代表大腦的高級認知功能：

- **🧠 思考** - 結構化推理和問題解決
- **📚 記憶** - 學習和儲存經驗
- **🔄 進化** - 透過經驗持續改進
- **🎯 決策** - 基於學習做出判斷

就像人類大腦皮質一樣，**Cortex AI** 是 AI 的「大腦」- 負責思考、記憶、學習和決策。

---

**將您的 AI 互動從令人挫折的重複轉化為智慧學習夥伴關係！**
