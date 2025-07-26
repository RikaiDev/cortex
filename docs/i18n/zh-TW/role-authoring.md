[English](../role-authoring.md) | [繁體中文](role-authoring.md)

# 角色創作指南

本指南提供在 Cortex 中創建和維護 AI 協作角色的全面說明。

## 概述

Cortex 中的角色定義為具有 YAML frontmatter 的 Markdown 文件，指定角色的能力、關鍵字和行為模式。每個角色代表一個專業的 AI 助手，可以根據用戶查詢和專案上下文動態選擇。

## 角色文件結構

### 標準模板

```markdown
---
name: "Role Name"
description: "Brief description of the role's purpose and expertise"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities:
  - "Specific capability 1"
  - "Specific capability 2"
  - "Specific capability 3"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---

# Role: [Role Name]

## Description

Clear, comprehensive description of what this role does, its primary responsibilities, and when it should be used.

## Capabilities

- **Capability 1**: Detailed description of what this capability covers
- **Capability 2**: Specific areas of expertise and knowledge
- **Capability 3**: Tools and methods this role can use

## Keywords

Primary keywords that trigger this role selection:

- keyword1: Used for [specific context]
- keyword2: Triggers when [specific scenario]
- keyword3: Relevant for [specific domain]

## Implementation Guidelines

### Core Responsibilities

1. **Primary Task**: Detailed description of the main responsibility
2. **Secondary Task**: Additional responsibilities and areas of focus
3. **Collaboration**: How this role works with other roles

### Workflow Process

1. **Analysis Phase**: How the role analyzes the problem
2. **Solution Design**: Approach to creating solutions
3. **Implementation**: How to execute the solution
4. **Validation**: Methods for verifying results

### Best Practices

- **Practice 1**: Specific guidance for optimal results
- **Practice 2**: Common pitfalls to avoid
- **Practice 3**: Recommended tools and approaches

## Examples

### Example 1: [Specific Scenario]

**Context**: Brief description of the scenario
**Input**: Sample user query or problem
**Role Response**: Expected response pattern
**Output**: Typical solution or recommendation

### Example 2: [Another Scenario]

**Context**: Different scenario description
**Input**: Another sample input
**Role Response**: How the role would respond
**Output**: Expected outcome

## Integration

### Working with Other Roles

- **Collaboration Pattern 1**: How this role complements others
- **Collaboration Pattern 2**: When to hand off to other roles
- **Collaboration Pattern 3**: Joint problem-solving approaches

### Project Context Adaptation

- **Frontend Projects**: Specific considerations for frontend development
- **Backend Projects**: Backend-specific guidance
- **Full-Stack Projects**: Comprehensive approach considerations

## Success Metrics

### Quality Indicators

- **Metric 1**: How to measure effectiveness
- **Metric 2**: Success criteria for this role
- **Metric 3**: User satisfaction indicators

### Continuous Improvement

- **Feedback Collection**: How to gather role performance feedback
- **Iteration Process**: Methods for improving role effectiveness
- **Version Control**: Managing role updates and changes

## Troubleshooting

### Common Issues

- **Issue 1**: Description and resolution
- **Issue 2**: Common problem and solution
- **Issue 3**: Edge case handling

### Debugging Tips

- **Tip 1**: How to diagnose role selection issues
- **Tip 2**: Testing role effectiveness
- **Tip 3**: Performance optimization

---

**This role is designed to provide specialized expertise while maintaining consistency with the overall AI collaboration system.**
```

## YAML Frontmatter 標準

### 必要欄位

```yaml
---
name: "Role Name" # 人類可讀的角色名稱
description: "Brief description" # 一行目的描述
keywords: ["kw1", "kw2", "kw3"] # 發現關鍵字陣列
capabilities: ["cap1", "cap2"] # 能力陣列
---
```

### 可選欄位

```yaml
---
version: "1.0.0" # 角色版本
tags: ["tag1", "tag2"] # 分類標籤
priority: 1 # 選擇優先級 (1-10)
author: "Author Name" # 角色創建者
last_updated: "2024-01-01" # 最後更新日期
---
```

## 內容指南

### 寫作風格

- **清晰簡潔**：使用簡單、直接的語言
- **行動導向**：專注於角色能做的事情
- **具體範例**：提供具體、可操作的指導
- **一致格式**：遵循既定模式

### 技術準確性

- **最新資訊**：確保所有技術細節都是最新的
- **驗證實踐**：只包含經過驗證、可靠的方法
- **安全考量**：在相關情況下解決安全影響
- **效能注意事項**：包含效能考量

### 可訪問性

- **語言無關**：避免語言特定假設
- **框架靈活**：除非必要，否則不要綁定到特定框架
- **技能水平適當**：考慮不同開發者經驗水平
- **文化敏感性**：使用包容、尊重的語言

## 角色類別

### 開發角色

- **Code Assistant**：一般程式設計協助
- **Code Reviewer**：程式碼分析和改進
- **Architecture Designer**：系統設計和模式
- **Performance Optimizer**：效能分析和優化

### 專業角色

- **Security Specialist**：安全分析和最佳實踐
- **QA Tester**：測試策略和品質保證
- **DevOps Engineer**：基礎設施和部署
- **Data Scientist**：數據分析和機器學習

### 管理角色

- **Product Manager**：產品策略和需求
- **Project Manager**：專案規劃和協調
- **Release Manager**：發布規劃和執行
- **Technical Lead**：技術決策制定

## 品質保證

### 審查檢查清單

- [ ] **YAML Frontmatter**：所有必要欄位都存在且格式正確
- [ ] **Keywords**：相關、具體且全面
- [ ] **Capabilities**：清晰、可操作且定義良好
- [ ] **Examples**：實用、現實且有用
- [ ] **Integration**：與其他角色的清晰協作模式
- [ ] **Accuracy**：技術資訊是最新且正確的
- [ ] **Completeness**：所有章節都正確填寫
- [ ] **Consistency**：遵循既定模式和標準

### 測試流程

1. **角色發現測試**：驗證角色被正確發現
2. **關鍵字匹配測試**：測試基於關鍵字的選擇
3. **範例驗證**：驗證範例是實用的
4. **整合測試**：測試與其他角色的協作
5. **用戶反饋**：收集實際使用的反饋

## 維護

### 版本控制

- **語義版本控制**：對角色更新使用語義版本控制
- **變更日誌**：記錄所有變更和改進
- **向後相容性**：在可能的情況下保持相容性
- **棄用流程**：明確的角色退休流程

### 更新流程

1. **識別需求**：確定需要更新的內容
2. **規劃變更**：設計改進方案
3. **實施更新**：進行變更
4. **徹底測試**：驗證更新正確工作
5. **文檔變更**：更新版本和變更日誌
6. **部署**：使更新可用

## 最佳實踐

### 角色設計

- **單一責任**：每個角色應該有一個明確的目的
- **全面覆蓋**：涵蓋角色領域的所有方面
- **實用焦點**：強調現實世界的適用性
- **持續改進**：定期更新和改進

### 內容品質

- **清晰結構**：組織良好、易於導航
- **可操作指導**：提供具體、可實施的建議
- **上下文感知**：考慮不同的專案類型和大小
- **用戶中心**：專注於用戶需求和痛點

### 協作

- **角色協調**：明確的交接和協作模式
- **知識共享**：利用其他角色的見解
- **一致標準**：在所有角色中保持一致性
- **社群輸入**：整合反饋和建議

---

**創建有效的角色需要理解技術領域和用戶需求。專注於提供實用、可操作的指導，幫助用戶解決實際問題。**
