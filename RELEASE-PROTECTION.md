# 🔒 Release Protection System

This document describes the release protection mechanisms in place to ensure consistent and safe releases.

## 🚫 Blocked Operations

The following operations are **BLOCKED** to prevent bypassing the release workflow:

### ❌ Direct Version Bumping

```bash
npm version patch    # BLOCKED
npm version minor    # BLOCKED
npm version major    # BLOCKED
```

### ❌ Direct Publishing

```bash
npm publish          # BLOCKED
```

## ✅ Allowed Workflow

### 1. Release Check (Required)

```bash
npm run release:check
```

This runs comprehensive quality checks and creates a `.release-check-passed` marker.

### 2. Version Bumping (Protected)

```bash
npm run release:patch    # ✅ Allowed
npm run release:minor    # ✅ Allowed
npm run release:major    # ✅ Allowed
```

### 3. Publishing (Protected)

```bash
npm publish             # ✅ Allowed (after release:check)
```

## 🛡️ Protection Mechanisms

### 1. Pre-publish Hook

- **File**: `scripts/prepublish-check.cjs`
- **Function**: Runs before every `npm publish`
- **Checks**:
  - Git status is clean
  - All commits are pushed
  - CHANGELOG matches package.json version
  - Release check was completed recently

### 2. Version Protection

- **File**: `scripts/protect-release.cjs`
- **Function**: Blocks direct `npm version` commands
- **Enforced In**: `release:patch`, `release:minor`, `release:major`

### 3. Workflow Enforcer

- **File**: `scripts/enforce-release-workflow.cjs`
- **Function**: Global protection for version/publish operations
- **Checks**: Release check completion and recency

### 4. NPM Configuration

- **File**: `.npmrc`
- **Function**: NPM-level protection hooks

## 🔍 Release Check Process

When you run `npm run release:check`, the system:

1. ✅ Validates environment setup
2. ✅ Checks git status and remote sync
3. ✅ Verifies runtime dependencies
4. ✅ Runs TypeScript compilation
5. ✅ Executes ESLint and Prettier
6. ✅ Runs Knip for unused code detection
7. ✅ Tests CLI integration
8. ✅ Tests MCP server integration
9. ✅ Validates package.json configuration
10. ✅ Checks file structure and security
11. ✅ Estimates bundle size
12. ✅ Validates documentation
13. ✅ Tests global installation
14. ✅ **Creates `.release-check-passed` marker**

## 🚨 Error Messages

When protection is triggered, you'll see:

```
❌ RELEASE WORKFLOW VIOLATION!
You must run: npm run release:check
This ensures the release follows the proper workflow.
```

## 🎯 Benefits

1. **Consistency**: All releases follow the same rigorous process
2. **Quality**: Comprehensive checks prevent broken releases
3. **Safety**: No accidental direct publishes or version bumps
4. **Traceability**: Clear workflow with audit trail
5. **Team Coordination**: Everyone follows the same process

## 🔧 Maintenance

To temporarily bypass protection (for maintenance):

```bash
# Remove the marker file
rm .release-check-passed

# Then run your maintenance commands
```

**⚠️ WARNING**: Only do this for legitimate maintenance, then restore proper workflow.
