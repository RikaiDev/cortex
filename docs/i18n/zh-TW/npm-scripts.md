[English](../npm-scripts.md) | [繁體中文](npm-scripts.md)

# 📦 NPM Scripts 使用指南

Cortex 提供了完整的 npm scripts 支援，讓你可以使用熟悉的 npm 命令來操作 Cortex，無需安裝全域 CLI。

## 🚀 快速開始

### 安裝和設置

```bash
# 安裝依賴
npm install

# 構建專案
npm run build

# 設置 Cortex
npm run cortex:setup
```

### 開始使用

```bash
# 快速啟動（已設置完成）
npm run cortex:start

# 其他可用命令
npm run cortex:discover    # 發現專案模式
npm run cortex:generate-ide # 生成 IDE 配置
npm run cortex:setup       # 重新設置
```

## 📋 完整命令列表

### 設置和配置

```bash
npm run cortex:setup       # 一鍵設置 Cortex
npm run cortex:integrate   # 整合現有 AI 協作系統
npm run cortex:init        # 傳統初始化（向後兼容）
```

### 分析和發現

```bash
npm run cortex:discover    # 發現角色和模式
npm run cortex:analyze-patterns # 分析編碼模式
```

### IDE 整合

```bash
npm run cortex:generate-ide  # 生成 IDE 配置
npm run cortex:generate-role # 創建新角色模板
```

### 協作

```bash
npm run cortex:start       # 啟動互動式協作會話
```

## 🎯 使用場景

### 開發環境

在本地開發環境中，使用 npm scripts 是最方便的方式：

```bash
# 開發工作流程
npm run build              # 構建專案
npm run cortex:setup       # 設置 Cortex
npm run cortex:discover    # 發現專案模式
npm run cortex:start       # 開始協作
```

### 團隊協作

團隊成員可以輕鬆使用相同的命令：

```bash
# 新成員加入
git clone <project>
npm install
npm run cortex:setup
npm run cortex:start
```

### CI/CD 流程

在自動化流程中使用：

```bash
# CI/CD 腳本
npm run build
npm run cortex:discover -- --output analysis.json
npm run cortex:generate-ide
```

## 🔧 自定義 Scripts

你可以在 `package.json` 中添加自定義 scripts：

```json
{
  "scripts": {
    "cortex:dev": "npm run build && npm run cortex:start",
    "cortex:full-setup": "npm run cortex:setup && npm run cortex:discover && npm run cortex:generate-ide",
    "cortex:analyze": "npm run cortex:discover -- --verbose && npm run cortex:analyze-patterns -- --output patterns.json"
  }
}
```

## 📊 與全域 CLI 的對比

| 功能     | NPM Scripts              | 全域 CLI         |
| -------- | ------------------------ | ---------------- |
| 安裝     | 本地安裝                 | 全域安裝         |
| 命令     | `npm run cortex:command` | `cortex command` |
| 版本管理 | 專案特定                 | 全域統一         |
| 團隊協作 | 版本控制                 | 需要手動同步     |
| 開發環境 | 推薦                     | 適合生產         |

## 🎯 最佳實踐

### 1. 開發環境使用 NPM Scripts

```bash
# 推薦：開發時使用 npm scripts
npm run cortex:start
npm run cortex:discover
npm run cortex:generate-ide
```

### 2. 生產環境使用全域 CLI

```bash
# 推薦：生產環境使用全域 CLI
cortex start
cortex discover
cortex generate-ide
```

### 3. 混合使用

```bash
# 設置使用全域 CLI
npm install -g @rikaidev/cortex
cortex setup

# 日常使用使用 npm scripts
npm run cortex:start
```

## 🔍 故障排除

### 常見問題

1. **Script 不存在**

   ```bash
   # 確保已安裝依賴
   npm install

   # 確保已構建
   npm run build
   ```

2. **權限問題**

   ```bash
   # 檢查檔案權限
   ls -la dist/cli/index.js

   # 重新構建
   npm run build
   ```

3. **路徑問題**

   ```bash
   # 檢查當前目錄
   pwd

   # 確保在專案根目錄
   cd /path/to/your/project
   ```

### 調試模式

```bash
# 啟用詳細輸出
npm run cortex:discover -- --verbose

# 檢查版本
npm run cortex:start -- --version
```

## 📚 相關文檔

- [快速開始指南](getting-started.md)
- [角色創作指南](role-authoring.md)
- [進階配置](advanced-config.md)
- [故障排除](troubleshooting.md)

---

**提示：** NPM Scripts 是開發環境的最佳選擇，全域 CLI 是生產環境的推薦方式。
