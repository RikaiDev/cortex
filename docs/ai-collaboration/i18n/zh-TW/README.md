[English](../README.md) | [繁體中文](README.md)

# AI 協作角色

## 概述

此目錄包含 Cortex AI Brain 系統的角色定義。每個角色都在 Markdown 文件中定義，並使用 YAML frontmatter 來指定角色的能力和發現關鍵字。

## 角色系統設計

### **核心哲學**

- **語言無關**：角色設計適用於所有程式語言
- **專案特定**：角色根據專案上下文和模式進行調整
- **動態發現**：AI 自動發現並選擇適當的角色
- **單一事實來源**：所有角色定義都位於 `docs/ai-collaboration/roles/`

### **當前角色**

#### **一般開發角色**

- **Code Assistant**：通用程式碼協助
- **Code Reviewer**：程式碼分析和改進建議
- **Architecture Designer**：系統設計和架構模式
- **QA Tester**：測試和品質保證
- **Security Specialist**：安全分析和漏洞評估
- **Performance Optimizer**：效能優化和分析

#### **專案管理角色**

- **Product Manager**：產品策略和需求
- **Release Quality Gatekeeper**：發布管理和品質保證
- **TODO Analyzer**：任務分析和實施規劃

#### **流程和知識角色**

- **Experience Curator**：文檔和知識管理
- **Git Analyzer**：版本控制和工作流程分析
- **Legacy Code Analyzer**：舊程式碼分析和遷移規劃
- **Date Verification Specialist**：基於時間的資訊準確性

## 角色定義格式

每個角色文件都遵循此結構：

```yaml
---
name: "Role Name"
description: "Brief description of the role's purpose"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities: ["capability1", "capability2", "capability3"]
---
```

### **必要欄位**

- `name`：人類可讀的角色名稱
- `description`：角色功能的清晰、簡潔描述
- `keywords`：用於角色發現的關鍵字陣列（AI 用來匹配用戶查詢）
- `capabilities`：角色提供的特定能力陣列

### **內容結構**

在 YAML frontmatter 之後，包含：

1. **角色目的**：角色功能的清晰說明
2. **責任範圍**：特定任務和關注領域
3. **工作流程**：角色如何處理問題
4. **實施指南**：具體說明和範例
5. **成功指標**：如何衡量角色的有效性
6. **整合**：角色如何與其他角色協作

## 未來：社群角色貢獻

### **計劃的貢獻系統**

#### **第一階段：語言特定角色**

- **Python Specialist**：Python 特定開發模式
- **JavaScript/TypeScript Specialist**：前端和 Node.js 專業知識
- **Go Specialist**：Go 開發和微服務
- **Rust Specialist**：系統程式設計和效能
- **Java Specialist**：企業和 Android 開發

#### **第二階段：領域特定角色**

- **Frontend Specialist**：UI/UX 和前端框架
- **Backend Specialist**：API 設計和伺服器端開發
- **DevOps Specialist**：基礎設施和部署
- **Data Scientist**：數據分析和機器學習
- **Mobile Developer**：iOS 和 Android 開發

#### **第三階段：產業特定角色**

- **Healthcare Specialist**：HIPAA 合規和醫療軟體
- **Finance Specialist**：金融法規和金融科技
- **E-commerce Specialist**：線上零售和支付系統
- **Gaming Specialist**：遊戲開發和即時系統

### **貢獻指南（未來）**

#### **角色提交流程**

1. **創建角色文件**：在 `docs/ai-collaboration/roles/` 中添加新的角色定義
2. **遵循格式**：使用標準 YAML frontmatter 和內容結構
3. **測試整合**：確保角色與現有角色發現系統協作
4. **文檔**：提供清晰的範例和使用指南
5. **審查流程**：社群審查和批准

#### **品質標準**

- **清晰目的**：角色必須具有獨特、有價值的功能
- **語言無關**：應該適用於所有程式語言
- **專案適應性**：必須適應不同的專案上下文
- **良好文檔**：全面的範例和指南
- **經過測試**：驗證與角色發現系統協作

#### **社群效益**

- **共享知識**：跨專案的最佳實踐
- **專業知識**：領域特定的 AI 協助
- **持續改進**：演進的角色定義
- **跨專案學習**：團隊之間的知識轉移

## 當前實施

### **角色發現**

AI 自動掃描此目錄並：

1. **解析 YAML frontmatter** 以了解角色能力
2. **匹配關鍵字** 到用戶查詢意圖
3. **選擇最佳角色** 基於上下文和需求
4. **應用角色特定知識** 提供協助

### **動態載入**

- **無硬編碼角色**：所有角色從 `docs/ai-collaboration/roles/` 載入
- **即時更新**：對角色文件的更改立即可用
- **專案特定**：角色適應專案上下文和模式
- **單一事實來源**：所有角色定義在一個位置

## 開始使用

### **使用現有角色**

1. **自然提問**：AI 將自動選擇適當的角色
2. **使用角色特定關鍵字**：提及相關概念以觸發特定角色
3. **提供上下文**：分享專案詳細資訊以獲得更好的角色選擇

### **自定義角色**

1. **編輯現有角色**：修改 `docs/ai-collaboration/roles/*.md` 文件
2. **添加專案上下文**：包含專案特定的範例和模式
3. **測試更改**：驗證角色選擇按預期工作

### **創建新角色**

1. **遵循格式**：使用標準 YAML frontmatter 結構
2. **具體明確**：定義清晰的責任和能力
3. **包含範例**：提供實用的使用範例
4. **測試整合**：確保角色發現正確工作

## 最佳實踐

### **角色設計**

- **單一責任**：每個角色應該有一個明確的目的
- **關鍵字精確性**：使用特定、相關的關鍵字進行發現
- **全面覆蓋**：包含所有重要的責任
- **實用範例**：提供真實世界的使用場景

### **內容品質**

- **清晰結構**：使用一致的格式和組織
- **可操作指導**：提供具體、可實施的建議
- **上下文感知**：考慮不同的專案類型和大小
- **持續更新**：保持角色與最佳實踐同步

---

**角色系統設計為靈活、可擴展和社群驅動，使團隊能夠創建自己的 AI 協作大腦，隨著需求增長而發展。**
