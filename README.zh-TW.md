# Cortex AI

[![Version](https://img.shields.io/badge/version-v0.1.2-blue.svg)](https://github.com/RikaiDev/cortex/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-yellow.svg)](https://bun.sh)

[English](README.md) | [繁體中文](README.zh-TW.md) | [Documentation](docs/) | [Updates](docs/updates/) | [Changelog](CHANGELOG.md)

## 🧠 AI 協作中央大腦

**Cortex AI** 是一個 AI 協作系統，從專案文檔中學習並適應您的開發需求。它提供動態角色發現、智能任務協調和通過經驗學習的持續自我改進。

### ✨ 最新更新 (v0.1.2)

🚀 **新功能：**

- **任務協調者**：通過協調多個 AI 角色智能編排複雜任務
- **經驗策展人**：系統性收集和分析開發經驗
- **自我演化協議**：強制性經驗驅動學習和持續改進
- **經驗記錄系統**：每日經驗記錄與模板和分析

📚 **增強文檔：**

- 全面的角色定義和使用範例
- 詳細的協調機制和學習協議
- 改進的 Cursor 規則與演化協議

🔧 **CLI 改進：**

- `cortex check-updates` - 檢查可用更新
- `cortex version` - 顯示當前版本
- 增強的角色發現和協調

[📋 查看完整更新日誌](CHANGELOG.md) | [🚀 檢查更新](#保持更新)

## 🎯 核心功能

### **動態角色發現**

- 自動從 `docs/ai-collaboration/roles/` 發現角色
- 基於任務需求的智能角色選擇
- 語言無關設計，未來支援語言特定擴展

### **任務協調**

- **任務協調者**編排複雜的多領域任務
- 將複雜任務分解為可管理的組件
- 協調多個角色以提供全面解決方案
- 平滑的角色轉換和輸出合成

### **經驗學習**

- **經驗策展人**記錄每次互動和學習
- 系統性模式識別和知識綜合
- 基於實際經驗的持續流程改進
- 自我演化的文檔和角色定義

### **IDE 整合**

- **Cursor**：主要整合，動態角色讀取
- **VS Code**：擴展開發中
- **其他 IDE**：計劃支援 Windsurf、Cline、Roo Code

## 🚀 快速開始

### **安裝**

```bash
# 全域安裝
bun install -g @rikaidev/cortex

# 或使用 npx
npx @rikaidev/cortex
```

### **初始化專案**

```bash
# 在專案中初始化 Cortex AI
cortex init

# 發現可用角色
cortex discover

# 生成 IDE 配置
cortex generate-ide
```

### **開始協作**

```bash
# 互動式協作模式
cortex start

# 檢查更新
cortex check-updates

# 顯示版本
cortex version
```

## 📚 文檔

- **[快速開始](docs/getting-started.md)** - 快速設置指南
- **[角色系統](docs/ai-collaboration/roles/)** - 可用角色和協調
- **[經驗學習](docs/experiences/)** - 學習和改進系統
- **[更新和通知](docs/updates/)** - 了解變更資訊
- **[發展路線圖](ROADMAP.md)** - 未來發展計劃

## 🎭 可用角色

### **核心協調**

- **[任務協調者](docs/ai-collaboration/roles/task-coordinator.md)** - 編排複雜任務
- **[經驗策展人](docs/ai-collaboration/roles/experience-curator.md)** - 管理學習和知識

### **開發**

- **[程式碼審查者](docs/ai-collaboration/roles/code-reviewer.md)** - 程式碼品質分析
- **[QA 測試者](docs/ai-collaboration/roles/qa-tester.md)** - 測試和品質保證
- **[架構設計師](docs/ai-collaboration/roles/architecture-designer.md)** - 系統設計
- **[安全專家](docs/ai-collaboration/roles/security-specialist.md)** - 安全分析
- **[效能優化師](docs/ai-collaboration/roles/performance-optimizer.md)** - 效能優化

### **專案管理**

- **[產品經理](docs/ai-collaboration/roles/product-manager.md)** - 產品策略
- **[發布品質守門員](docs/ai-collaboration/roles/release-quality-gatekeeper.md)** - 發布管理
- **[Git 分析師](docs/ai-collaboration/roles/git-analyzer.md)** - 版本控制分析

### **專業分析**

- **[TODO 分析師](docs/ai-collaboration/roles/todo-analyzer.md)** - 任務分析
- **[遺留程式碼分析師](docs/ai-collaboration/roles/legacy-code-analyzer.md)** - 遺留系統分析
- **[日期驗證專家](docs/ai-collaboration/roles/date-verification-specialist.md)** - 時間準確性
- **[認知演化專家](docs/ai-collaboration/roles/cognitive-evolution-specialist.md)** - 認知模式演化
- **[TDD 開發專家](docs/ai-collaboration/roles/tdd-development-specialist.md)** - 測試驅動開發
- **[程式碼品質守門員](docs/ai-collaboration/roles/code-quality-gatekeeper.md)** - 程式碼品質標準
- **[單體倉庫架構師](docs/ai-collaboration/roles/monorepo-architect.md)** - 單體倉庫架構

## 🔄 自我演化協議

Cortex AI 通過系統性經驗學習持續改進：

1. **經驗記錄** - 記錄每次互動
2. **模式識別** - 識別重複問題和解決方案
3. **知識整合** - 將學習應用到文檔
4. **流程優化** - 基於經驗改進工作流程
5. **角色演化** - 基於表現更新角色定義

## 🛠️ 開發

### **前置需求**

- [Bun](https://bun.sh)（推薦）或 Node.js 18+
- TypeScript 知識

### **設置**

```bash
# 克隆專案
git clone https://github.com/RikaiDev/cortex.git
cd cortex

# 安裝依賴
bun install

# 建置專案
bun run build

# 執行測試
bun run test

# 開始開發
bun run dev
```

### **貢獻**

- [貢獻指南](CONTRIBUTING.md)
- [行為準則](CODE_OF_CONDUCT.md)
- [開發設置](docs/development/)

## 📈 保持更新

### **自動更新**

```bash
# 檢查更新
cortex check-updates

# 更新到最新版本
bun update @rikaidev/cortex
```

### **手動更新**

- **[GitHub Releases](https://github.com/RikaiDev/cortex/releases)** - 詳細更新日誌
- **[更新日誌](CHANGELOG.md)** - 完整版本歷史
- **[更新文檔](docs/updates/)** - 遷移指南和通知

### **社群**

- **[GitHub Issues](https://github.com/RikaiDev/cortex/issues)** - 錯誤回報和功能請求
- **[討論](https://github.com/RikaiDev/cortex/discussions)** - 社群討論
- **[Discord](https://discord.gg/cortex)** - 即時社群支援

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案。

## 🙏 致謝

- 靈感來自 [Hygieia](https://github.com/weemed-ai/hygieia) 專案的 AI 協作模式
- 使用現代 TypeScript 和 Bun 建置，實現最佳效能
- 社群驅動開發和持續改進

---

**🧠 每個專案都值得擁有自己的 AI 大腦。讓 Cortex AI 與您的專案一起演化！**
