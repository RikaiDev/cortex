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
npm run release:patch   # ✅ Allowed - Full workflow
npm run release:minor   # ✅ Allowed - Full workflow  
npm run release:major   # ✅ Allowed - Full workflow
```

## 🛡️ Protection Mechanisms

### 1. Pre-publish Hook

- **File**: `package.json` → `prepublishOnly` script
- **Function**: Runs before every `npm publish`
- **Behavior**:
  - Blocks direct `npm publish` commands
  - Shows clear error message with proper workflow instructions
  - Forces use of `npm run release:patch/minor/major`

### 2. Release Workflow Scripts

- **File**: `scripts/publish-workflow.cjs`
- **Function**: Comprehensive release process
- **Features**:
  - Version consistency validation
  - Quality checks and fixes
  - Automated changelog generation
  - Atomic release execution

### 3. NPM Configuration

- **File**: `.npmrc`
- **Function**: NPM-level configuration
- **Settings**: Audit and fund warnings disabled

## 🔍 Release Workflow Process

When you run `npm run release:patch/minor/major`, the system:

1. ✅ Validates version consistency
2. ✅ Runs comprehensive quality checks
3. ✅ Executes build verification
4. ✅ Runs release tests
5. ✅ Generates changelog with AI assistance
6. ✅ Updates documentation and version badges
7. ✅ Creates git commit and tag
8. ✅ Pushes to remote repository
9. ✅ Publishes to NPM

## 🚨 Error Messages

When protection is triggered, you'll see:

```
❌ RELEASE WORKFLOW VIOLATION!

You must use the proper release workflow:
  npm run release:patch    # for patch releases
  npm run release:minor    # for minor releases
  npm run release:major    # for major releases

Direct npm publish is blocked to ensure quality and consistency.
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
# Temporarily remove the prepublishOnly script from package.json
# Then run your maintenance commands
# Remember to restore the protection afterward
```

**⚠️ WARNING**: Only do this for legitimate maintenance, then restore proper workflow.
