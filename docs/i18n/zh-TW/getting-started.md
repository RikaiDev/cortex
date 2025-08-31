# 🚀 快速開始指南

在 2 分鐘內讓 Cortex AI 在你的專案中運行！

## 🎯 **什麼是 Cortex AI？**

**Cortex AI** 將 AI 模型轉化為智能學習夥伴：

- **🧠 大腦** - 通過 prompt injection 實現結構化思考
- **📚 經驗** - 從用戶反饋中即時學習
- **🔄 進化** - 持續改進，不再重複錯誤

## 📋 前置需求

- Node.js 18+
- Git（用於版本控制）

## ⚡ 超快速設置

### 1. 安裝 Cortex

```bash
# 選擇你偏好的方法：

# 選項 A：npm（推薦）
npm install -g @rikaidev/cortex

# 選項 B：使用 npx（無需全域安裝）
npx @rikaidev/cortex

# 選項 C：直接下載
curl -fsSL https://github.com/RikaiDev/cortex/releases/latest/download/cortex-cli | sh
```

### 2. 在專案中設置

```bash
# 導航到你的專案
cd your-project

# 初始化 Cortex
cortex init

# 生成 IDE 配置
cortex generate-ide
```

就這樣！🎉 Cortex 現在可以開始使用了。

## 🎯 剛才發生了什麼？

Cortex 自動：

1. **創建了大腦結構** - Prompt injection 用於結構化思考
2. **設置了經驗系統** - 長期記憶和學習
3. **生成了 IDE 配置** - 適用於 Cursor、Claude 和 Gemini
4. **準備了學習環境** - 準備從你的偏好中學習

## 🚀 開始使用 Cortex

### 選項 1：IDE 整合（推薦）

```bash
# 生成 IDE 配置
cortex generate-ide

# 開啟你的 IDE 並開始編碼！
# AI 會自動從你的反饋中學習
```

### 選項 2：互動模式

```bash
cortex start
```

## 📁 創建了什麼

你的專案現在包含：

```
your-project/
├── .cortex/
│   ├── docs/                # 生成的文檔
│   ├── experiences/         # 學習經驗
│   └── cortex.json         # 專案配置
├── .cursor/
│   └── rules/
│       └── cortex.mdc       # Cursor AI 規則
├── CLAUDE                   # Claude 系統訊息
└── GEMINI                   # Gemini prompt 模板
```

## 🧠 如何運作

### **從對話中學習**

```
用戶：「註解又開始寫中文了？」
AI：[學習] 所有註解用英文寫

用戶：「我們用 uv run pytest」
AI：[學習] Python 命令都用 uv run

用戶：「又來了」
AI：[學習] 不要重複同樣的錯誤
```

### **結構化思考**

AI 遵循 6 步思考流程：

1. **意圖探索** - 用戶真正想要達成什麼？
2. **問題分析** - 理解問題
3. **知識整合** - 應用學習的偏好
4. **解決方案開發** - 考慮用戶模式
5. **實施規劃** - 尊重用戶偏好
6. **品質驗證** - 確保偏好合規

## 🎯 下一步

1. **開始編碼** - AI 會從你的反饋中學習
2. **提供反饋** - 使用關鍵字如 "不對"、"我們用"、"不要"
3. **觀察學習** - AI 會記住並應用你的偏好
4. **享受一致性** - 所有 AI 平台都有相同的學習

## 🔧 可用命令

```bash
# 在專案中初始化 Cortex
cortex init

# 生成 IDE 配置
cortex generate-ide

# 開始 AI 協作
cortex start

# 顯示版本
cortex version
```

## 🎯 **為什麼這樣有效**

**傳統 AI**：忘記偏好、重複錯誤、行為不一致

**Cortex AI**：

- ✅ **從反饋中學習** - 記住你的偏好
- ✅ **結構化思考** - 遵循系統性方法
- ✅ **跨平台一致性** - 到處都有相同行為
- ✅ **持續進化** - 每次互動都變得更好

---

**將你的 AI 互動從令人挫折的重複轉化為智能學習夥伴關係！**
