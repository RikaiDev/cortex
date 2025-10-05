# Cortex AI

[![Version](https://img.shields.io/badge/version-v0.11.3-blue.svg)](https://github.com/RikaiDev/cortex/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/runtime-Node.js-green.svg)](https://nodejs.org/)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/) | [Changelog](CHANGELOG.md)

## 🧠 AI 協作大腦

**Cortex AI** 是一個智慧 AI 協作系統，將 AI 模型轉化為可靠的學習夥伴。它透過 **MCP (Model Context Protocol)** 和 **結構化工作流程** 解決 AI 不一致和缺乏記憶的核心問題。

### 🎯 **為什麼選擇 Cortex？** - 設計哲學的精妙之處

**問題背景：**

- AI 模型在不同平台間行為不一致
- AI 忘記使用者偏好和程式碼模式
- 重複解釋相同的專案慣例
- AI 協作缺乏個人化
- 沒有成功互動模式的記憶

**精妙解決方案：**

- **🧠 一致 AI 行為** - 所有 AI 平台的標準化思考流程
- **📚 學習記憶** - 記住使用者偏好和專案模式
- **🔄 持續適應** - 基於成功互動進行演化
- **🎯 情境意識** - 理解專案特定的慣例和工作流程

#### 🧠 **核心設計原則** - 建築學上的天才傑作

**Cortex AI** 實作了革命性的原則，將 AI 協作轉化為建築學上的傑作：

1. **🔮 少量範例到精細調整轉換** - **煉金術般的轉化**：我們不只是使用少量範例，而是*轉化*它們。一個簡單的用戶指令如「用英文寫註釋」變成一個全面的、生產就緒的提示系統，在所有未來互動中強制執行這個偏好。這是系統性的轉化，超越了傳統學習模式。

2. **🪝 鉤子式攔截系統** - **隱形的指揮家**：每一個用戶輸入在到達 AI 模型之前就被攔截。我們不等待 AI 回應，而是*塑造*它們。這個建築學上的巧妙設計確保無論您使用哪個 AI 模型（Cursor、Claude、Gemini），它們都會表現一致，因為我們已經預先決定了結果。

3. **⚙️ 決定論式展開而非隨機性** - **發條腦袋**：我們拒絕「湧現行為」的謬論。我們系統性地將最小輸入展開成完整、結構良好的指令，而非依賴 AI「會明白」。當您說「修復錯誤」時，我們直接*告訴*它確切該怎麼做、如何做、為什麼這麼做。

4. **🔒 保證處理管線** - **牢不可破的鎖鏈**：每個輸入都通過我們完整的管線，執行率達 100%。沒有步驟會被跳過，沒有流程會被繞過。這是*建築學上的必然性*，超越了傳統可靠性概念。系統無法不應用您的偏好，因為失敗從字面上就不可能發生。

5. **📋 明確推理與文件化** - **透明大腦**：每個轉化都被記錄，每個決定都被文件化，每個偏好變化都可以追溯。您可以親眼看到「使用 TypeScript」如何成為一個系統範圍的指令，影響每個程式碼建議、每個註釋、每個回應。

這個哲學創造了一個智慧系統，不僅僅是回應，而是*與您共同進化*，透過系統性、決定論式的意圖轉化來學習您的模式和偏好，而不是透過試錯。

**最終結果？** 簡單輸入變成全面的、個人化的 AI 體驗。「不要使用 async/await」變成一個普遍規則，塑造每個程式碼建議、每個重構、每個架構決定。

### 🏗️ **架構概覽**

Cortex AI 採用多層架構實現智慧 AI 協作：

```text
🧠 大腦層 (AI 平台整合)
├── MCP 伺服器 - 統一協定介面
├── 多角色工作流程 - 結構化任務執行
├── 即時學習系統 - 用戶偏好記憶
└── 跨平台一致性 - 統一行為體驗

📚 經驗層 (.cortex 目錄)
├── 隱形專案配置 - 自動專案適應
├── 用戶偏好學習 - 個人化記憶
├── 專案模式識別 - 自動慣例發現
└── 持續改進 - 經驗積累優化

🛠️ 核心工具
├── MCP 工具系統 - 豐富的功能集合
├── 資源管理 - 專案和流程快照
├── 提示模板 - 結構化思考指南
└── CLI 介面 - 簡化的操作入口
```

> **📖 [詳細架構指南](docs/architecture.md)** - 完整系統架構和技術詳情

## ✨ **核心功能**

### **🧠 MCP 協議支援**

**Cortex AI** 完全支援 MCP (Model Context Protocol)，提供豐富的工具、資源和提示系統：

#### **🛠️ MCP 工具 (Tools)**

| 工具名稱 | 描述 | 用途 |
|---------|------|------|
| `cortex-task` | 建立並執行完整的 AI 協作工作流程 | 啟動複雜開發任務的多角色協作 |
| `execute-workflow-role` | 執行工作流程中的下一個角色 | 繼續進行中的工作流程執行 |
| `submit-role-result` | 將 AI 處理結果提交回工作流程 | 完成角色任務並傳遞結果 |
| `get-workflow-status` | 取得工作流程狀態和進度 | 追蹤工作流程執行狀況 |
| `list-workflows` | 列出所有可用工作流程 | 查看專案中的工作流程清單 |
| `create-pull-request` | 為工作流程結果建立拉取請求 | 自動化 PR 創建流程 |

#### **📚 MCP 資源 (Resources)**

| 資源 URI | 名稱 | 描述 | 格式 |
|---------|------|------|------|
| `cortex://workflows` | Cortex 工作流程 | 所有 Cortex AI 工作流程清單 | JSON |
| `cortex://workflows/{id}/handoff` | 工作流程交接 | 特定工作流程的交接文件 | Markdown |
| `cortex://workflows/{id}/pr` | 工作流程 PR | 特定工作流程的拉取請求文件 | Markdown |
| `cortex://snapshots/project` | 專案快照 | 當前專案結構和架構快照 | JSON |
| `cortex://snapshots/{id}` | 工作流程快照 | 工作流程執行和決策快照 | JSON |
| `cortex://project/tasks` | 專案任務 | 來自 .vscode/tasks.json 的開發任務 | JSON |
| `cortex://ide/integration-guide` | IDE 整合指南 | Cortex AI IDE 整合設定指南 | Markdown |

#### **💬 MCP 提示 (Prompts)**

| 提示名稱 | 描述 | 參數 |
|---------|------|------|
| `workflow-role-analysis` | 為工作流程中的角色產生結構化分析 | `roleId`, `workflowId` |
| `technical-code-review` | 產生技術程式碼審查和評估 | `codebase`, `requirements`, `role` |
| `workflow-progress-summary` | 產生工作流程進度和決策的執行摘要 | `workflowId`, `includeTechnicalDetails` |

### **🔄 多角色工作流程**

**Cortex AI** 支援多角色協作模式，每個角色專注於特定領域：

- **🏗️ Architecture Designer** - 系統架構設計和決策
- **💻 Code Assistant** - 程式碼撰寫和品質保證
- **📝 Documentation Specialist** - 文件撰寫和維護
- **🔒 Security Specialist** - 安全性審查和最佳實務
- **🧪 Testing Specialist** - 測試策略和實作
- **🎨 UI/UX Designer** - 用戶體驗設計
- **⚛️ React Expert** - React 生態系統專家

每個角色都有專門的模板和指導原則，確保專業性和一致性。

### **📚 即時學習系統**

- **用戶偏好偵測**：從關鍵字學習，如「不對」、「我們用」、「不要」
- **立即應用**：將學習的偏好應用到當前回應
- **不重複錯誤**：絕不重複已修正的錯誤
- **挫折偵測**：識別並從用戶挫折中學習

## 🚀 **快速開始**

### **簡易任務執行（推薦）**

使用單一命令執行完整的開發任務與 AI 協作：

```bash
# 執行開發任務與完整 AI 工作流程
npx @rikaidev/cortex@latest task "實作使用者驗證系統，包含註冊、登入和密碼重設"

# 包含 PR 選項
npx @rikaidev/cortex@latest task "為設定頁面新增深色模式切換" --draft-pr --base-branch develop
```

**自動執行流程：**

1. 🧠 **情境增強**：使用 MCP 工具尋找相關過去經驗
2. 📝 **工作流程建立**：建立結構化的多角色工作流程
3. 🎭 **角色執行**：依序執行每個角色任務
4. 📚 **經驗記錄**：記錄學習內容供未來任務使用
5. 🚀 **PR 建立**：產生完整的 PR 文件並建立 GitHub PR

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
- **[系統架構](docs/architecture.md)** - 架構設計詳情
- **[程式碼模式](docs/code-patterns.md)** - 程式碼風格指南
- **[變更日誌](CHANGELOG.md)** - 完整變更歷史
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

### **📋 專案任務配置 (.vscode/tasks.json)**

**Cortex AI** 會自動讀取您專案的 `.vscode/tasks.json` 來理解可用的開發工具和命令。
這樣可以實現智能任務執行，並確保 AI 使用正確的專案特定命令。

#### **為什麼使用 tasks.json？**

1. **🎯 標準化開發工具** - 在一個地方定義所有專案的建置、測試和品質檢查命令
2. **🤖 AI 任務發現** - Cortex AI 自動發現並理解您專案的開發工作流程
3. **🔄 一致性執行** - 確保 AI 使用正確的專案特定命令
4. **📚 專案特定工作流程** - 每個專案都可以有自己的開發慣例和工具鏈

#### **建議的 tasks.json 結構**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build Project",
      "type": "shell",
      "command": "npm run build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm test",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Lint Code",
      "type": "shell",
      "command": "npm run lint",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Quality Check",
      "type": "shell",
      "command": "npm run quality-check",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start MCP Server",
      "type": "shell",
      "command": "node dist/cli/index.js start",
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

#### **AI 任務整合優勢**

- **🧠 智能任務選擇** - AI 自動選擇正確的任務
- **📊 任務目的推斷** - AI 理解每個任務的用途（建置、測試、程式碼檢查等）
- **🎯 預設任務識別** - AI 知道哪個任務是預設建置任務
- **🔄 工作流程整合** - 任務與 Cortex AI 工作流程無縫整合

#### **Cortex AI 如何使用 tasks.json**

1. **任務發現** - 自動讀取和解析您的 tasks.json 配置
2. **目的分析** - 推斷每個任務的目的（建置、測試、程式碼檢查、啟動等）
3. **命令產生** - 產生正確的命令與參數
4. **工作流程整合** - 在開發工作流程中使用適當的任務
5. **品質保證** - 確保一致使用專案特定命令

**AI 任務使用範例：**
```text
AI：「我將執行建置任務來編譯專案」
→ 執行：npm run build（來自 tasks.json）

AI：「讓我先執行品質檢查再繼續」
→ 執行：npm run quality-check（來自 tasks.json）
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
