[English](../standards.md) | [繁體中文](standards.md)

# 📋 文件標準指南

本文檔定義了 Cortex 專案中所有文件應遵循的標準和格式。

## 🎯 文件標準原則

### 1. 語言標準

- **程式碼和技術術語**：使用英文
- **註解和文檔**：使用英文
- **用戶介面**：提供中英文雙語支援
- **README**：提供英文和繁體中文版本

### 2. 格式標準

- **Markdown 文件**：使用標準 Markdown 語法
- **程式碼區塊**：指定語言類型
- **表格**：使用標準 Markdown 表格格式
- **標題層級**：使用 # ## ### 等標準層級

### 3. 命名標準

- **檔案名稱**：使用 kebab-case
- **目錄名稱**：使用 kebab-case
- **英文版本**：使用標準英文名稱
- **中文版本**：使用 `-zh-TW` 後綴

## 📁 文件結構標準

### 根目錄文件

```
/
├── README.md              # 英文版主要說明
├── README.zh-TW.md        # 繁體中文版主要說明
├── CONTRIBUTING.md        # 貢獻指南
├── LICENSE               # 授權文件
├── ROADMAP.md            # 發展路線圖
└── IMPROVEMENTS.md       # 改進記錄
```

### 文檔目錄結構

```
docs/
├── standards.md           # 文件標準（英文版）
├── standards-zh-TW.md     # 文件標準（繁體中文版）
├── getting-started.md     # 英文版快速開始
├── getting-started-zh-TW.md # 繁體中文版快速開始
├── npm-scripts.md         # 英文版 NPM Scripts 指南
├── npm-scripts-zh-TW.md   # 繁體中文版 NPM Scripts 指南
├── role-authoring.md      # 角色創作指南
├── advanced-config.md     # 進階配置
├── best-practices.md      # 最佳實踐
├── api-reference.md       # API 參考
├── troubleshooting.md     # 故障排除
└── ai-collaboration/      # AI 協作相關文件
    ├── README.md          # AI 協作概述
    ├── roles/             # 角色定義
    │   ├── README.md      # 角色系統說明
    │   ├── code-assistant.md
    │   ├── code-reviewer.md
    │   └── ...
    ├── templates/         # 模板文件
    └── examples/          # 範例文件
```

## 📝 文件內容標準

### 1. 標題格式

```markdown
# 主標題 (H1)

## 章節標題 (H2)

### 子章節標題 (H3)

#### 小節標題 (H4)
```

### 2. 程式碼區塊

````markdown
# 指定語言

```bash
npm install -g @rikaidev/cortex
```
````

# 不指定語言

```
some code here
```

````

### 3. 表格格式

```markdown
| 欄位 1 | 欄位 2 | 欄位 3 |
|--------|--------|--------|
| 內容 1 | 內容 2 | 內容 3 |
````

### 4. 連結格式

```markdown
[連結文字](URL)
[相對路徑連結](./relative-path.md)
```

### 5. 圖片格式

```markdown
![替代文字](圖片路徑)
```

## 🎭 角色定義標準

### 1. 檔案命名

- 使用 kebab-case
- 使用描述性名稱
- 範例：`code-assistant.md`, `frontend-specialist.md`

### 2. YAML Frontmatter 標準

```yaml
---
name: "Role Name"
description: "Brief description of the role's purpose"
keywords: ["keyword1", "keyword2", "keyword3"]
capabilities:
  - "Capability 1"
  - "Capability 2"
  - "Capability 3"
version: "1.0.0"
tags: ["tag1", "tag2"]
priority: 1
---
```

### 3. 內容結構標準

```markdown
# Role: [Role Name]

## Description

Clear description of what the role does and its purpose.

## Capabilities

- Specific capability 1
- Specific capability 2
- Specific capability 3

## Keywords

keyword1, keyword2, keyword3

## Implementation Guidelines

- Guideline 1
- Guideline 2
- Guideline 3

## Examples

### Example 1

**Input:** "Example input"
**Output:** "Example output"

### Example 2

**Input:** "Another example input"
**Output:** "Another example output"
```

## 🔧 技術文件標準

### 1. API 文檔

````markdown
## Function Name

### Description

Brief description of the function.

### Parameters

- `param1` (type): Description
- `param2` (type): Description

### Returns

Return type and description.

### Example

```typescript
functionName(param1, param2);
```
````

````

### 2. 配置文檔

```markdown
## Configuration Option

### Type

`string` | `number` | `boolean` | `object`

### Default

Default value if not specified.

### Description

Detailed description of the option.

### Example

```json
{
  "option": "value"
}
````

````

## 🌐 多語言支援標準

### 1. 文件對應

- 每個英文文件都應有對應的繁體中文版本
- 中文版本使用 `-zh-TW` 後綴
- 在文件開頭提供語言選擇連結

### 2. 語言選擇格式

```markdown
[English](filename.md) | [繁體中文](filename-zh-TW.md)
````

### 3. 翻譯原則

- 保持技術術語的準確性
- 維持文件結構的一致性
- 確保範例和程式碼的完整性
- 適應中文表達習慣

## 📋 檢查清單

### 新文件創建檢查清單

- [ ] 使用正確的檔案命名格式
- [ ] 遵循標題層級標準
- [ ] 包含適當的程式碼區塊語言標記
- [ ] 使用標準表格格式
- [ ] 提供語言選擇連結（如適用）
- [ ] 檢查 Markdown 語法正確性
- [ ] 確保內容結構一致性

### 角色定義檢查清單

- [ ] 使用標準 YAML frontmatter 格式
- [ ] 包含所有必要欄位
- [ ] 使用描述性關鍵字
- [ ] 提供具體的能力描述
- [ ] 包含實用的範例
- [ ] 遵循內容結構標準

### 翻譯檢查清單

- [ ] 技術術語翻譯準確
- [ ] 保持文件結構一致
- [ ] 程式碼範例完整
- [ ] 語言表達自然
- [ ] 提供語言選擇連結

## 🚀 工具和資源

### 1. Markdown 檢查工具

- VS Code Markdown 擴展
- markdownlint
- Prettier

### 2. 翻譯工具

- 專業翻譯服務
- 技術詞彙表
- 一致性檢查工具

### 3. 品質保證

- 自動化檢查腳本
- 文件結構驗證
- 連結有效性檢查

---

**遵循這些標準確保所有文件的一致性和專業性，為用戶提供最佳的閱讀體驗。**
