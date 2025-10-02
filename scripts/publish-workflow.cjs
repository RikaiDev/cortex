#!/usr/bin/env node

/**
 * 🚀 Cortex AI - One Script to Rule Them All
 *
 * Single unified script for the complete development workflow:
 * - Quality checks
 * - Pre-publish validation
 * - Publishing to npm
 *
 * Usage: npm run publish [check|publish|help]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv[2] || 'help';
const versionArg = process.argv[3];

console.log('🧠 Cortex AI - Unified Workflow');
console.log('===============================\n');

// Colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m';

function print(color, message) {
  console.log(`${color}${message}${NC}`);
}

function runCommand(cmd, description, exitOnError = true) {
  try {
    print(BLUE, `📋 ${description}...`);
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    print(GREEN, `✅ ${description} completed`);
    return { success: true, output: result.trim() };
  } catch (error) {
    if (exitOnError) {
      print(RED, `❌ ${description} failed`);
      console.log(`   Error: ${error.message}`);
      process.exit(1);
    } else {
      print(RED, `❌ ${description} failed`);
      return { success: false, output: error.stdout || error.message };
    }
  }
}

function runQualityChecks() {
  print(BLUE, '\n🔍 Running Quality Checks...');

  // Environment checks
  runCommand('node --version', 'Check Node.js', false);
  runCommand('npm --version', 'Check npm', false);

  // Git status
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    print(RED, '❌ Git working directory not clean!');
    console.log('Please commit or stash changes before publishing.');
    throw new Error('Git working directory not clean');
  }
  print(GREEN, '✅ Git status clean');

  // Dependencies check (inline implementation)
  const projectRoot = path.join(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

  const criticalRuntimeDeps = [
    'typescript', // Used in project-scanner.ts
    'chalk',      // CLI output
    'commander',  // CLI parsing
    'fs-extra',   // File operations
  ];

  let depsGood = true;
  for (const dep of criticalRuntimeDeps) {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      print(RED, `❌ "${dep}" incorrectly in devDependencies but used at runtime!`);
      depsGood = false;
    } else if (packageJson.dependencies && packageJson.dependencies[dep]) {
      print(GREEN, `✅ "${dep}" correctly in dependencies`);
    } else {
      print(YELLOW, `⚠️  "${dep}" not found in any dependencies`);
    }
  }

  if (!depsGood) {
    throw new Error('Dependency placement issues found');
  }

  // TypeScript compilation
  runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript compilation', false);

  // Linting (inline implementation)
  const eslintResult = runCommand('npx eslint "src/**/*.ts"', 'ESLint check', false);
  if (eslintResult.success) {
    print(GREEN, '✅ ESLint passed');
  } else {
    print(RED, '❌ ESLint failed');
    throw new Error('ESLint check failed');
  }

  const prettierResult = runCommand('npx prettier --check "src/**/*.ts"', 'Prettier check', false);
  if (prettierResult.success) {
    print(GREEN, '✅ Prettier check passed');
  } else {
    print(RED, '❌ Prettier check failed');
    throw new Error('Prettier check failed');
  }

  // Tests
  runCommand('npm run test:all', 'Run test suite', false);

  // Security
  const securityResult = runCommand('npx secretlint "**/*"', 'Secret detection', false);
  if (securityResult.success) {
    print(GREEN, '✅ No secrets detected');
  } else {
    print(RED, '❌ Potential secrets found');
    throw new Error('Security check failed');
  }

  print(GREEN, '🎉 All quality checks passed!');
}

function runPublishValidation() {
  print(BLUE, '\n🔒 Running Publish Validation...');

  const projectRoot = path.join(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const currentVersion = packageJson.version;

  // Check CHANGELOG
  const changelog = fs.readFileSync(path.join(projectRoot, 'CHANGELOG.md'), 'utf8');
  const changelogVersionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);

  if (!changelogVersionMatch) {
    print(RED, '❌ No version found in CHANGELOG.md');
    process.exit(1);
  }

  if (changelogVersionMatch[1] !== currentVersion) {
    print(RED, `❌ CHANGELOG version (${changelogVersionMatch[1]}) doesn't match package.json (${currentVersion})`);
    process.exit(1);
  }
  print(GREEN, `✅ CHANGELOG version matches: ${currentVersion}`);

  // Check if version already published
  try {
    execSync(`npm view @rikaidev/cortex@${currentVersion} version`, { stdio: 'pipe' });
    print(RED, `❌ Version ${currentVersion} already published on npm!`);
    print(YELLOW, '💡 Set a new version: npm version 0.9.x');
    process.exit(1);
  } catch (e) {
    print(GREEN, `✅ Version ${currentVersion} ready for publishing`);
  }

  print(GREEN, '🎉 Publish validation passed!');
}

function getNewVersion(currentVersion, bumpType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (bumpType) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      return currentVersion;
  }
}

function updateChangelog(newVersion, currentVersion) {
  const changelogPath = 'CHANGELOG.md';
  let changelog = fs.readFileSync(changelogPath, 'utf8');

  // Add new version entry at the top
  const date = new Date().toISOString().split('T')[0];
  const newEntry = `## [${newVersion}] - ${date}\n\n### 🔧 **Bug Fixes**\n\n- Release ${newVersion}\n\n## [${currentVersion}]`;

  // Replace the first version header
  const versionPattern = /^## \[(\d+\.\d+\.\d+)\]/m;
  changelog = changelog.replace(versionPattern, newEntry);

  fs.writeFileSync(changelogPath, changelog);
  print(GREEN, `✅ Updated CHANGELOG.md to version ${newVersion}`);
}

function releaseVersion(bumpType) {
  print(YELLOW, `🚀 Releasing ${bumpType} version...`);

  // Get current version
  const currentVersion = require('../package.json').version;
  const newVersion = getNewVersion(currentVersion, bumpType);

  print(BLUE, `📋 Current version: ${currentVersion}`);
  print(BLUE, `📋 New version: ${newVersion}`);

  // Step 1: Run quality checks
  print(BLUE, '\n🔍 Running Quality Checks...');
  runQualityChecks();

  // Step 2: Update CHANGELOG
  print(BLUE, '\n📝 Updating CHANGELOG...');
  updateChangelog(newVersion, currentVersion);

  // Step 3: Set version (this will create commit and tag)
  print(BLUE, '\n🏷️  Setting version...');
  runCommand(`npm version ${newVersion}`, 'Version bump');

  // Step 4: Push commits and tags
  print(BLUE, '\n📤 Pushing to repository...');
  runCommand('git push origin main', 'Push commits');
  runCommand(`git push origin v${newVersion}`, 'Push tags');

  // Step 5: Publish to npm (reuse existing publish logic)
  print(BLUE, '\n🚀 Publishing to npm...');

  // Run publish validation
  runPublishValidation();

  // Check CHANGELOG version consistency (should pass now)
  const currentVersionCheck = require('../package.json').version;
  const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
  const changelogVersionMatch = changelogContent.match(/## \[(\d+\.\d+\.\d+)\]/);
  const changelogVersion = changelogVersionMatch ? changelogVersionMatch[1] : null;

  if (changelogVersion !== currentVersionCheck) {
    print(RED, `\n❌ CHANGELOG.md version (${changelogVersion}) doesn't match package.json version (${currentVersionCheck})`);
    process.exit(1);
  }

  print(GREEN, '✅ CHANGELOG.md version matches package.json');

  // Build project
  print(BLUE, '\n📦 Building project...');
  const buildResult = runCommand('npm run build', 'Build project', false);
  if (!buildResult.success) {
    print(RED, '❌ Build failed - cannot publish broken code!');
    process.exit(1);
  }

  // Publish to npm
  runCommand('npm publish', 'Publish to npm', false);

  print(GREEN, '\n🎉 Successfully released version ' + newVersion + '!');
  print(GREEN, '📦 Available at: https://www.npmjs.com/package/@rikaidev/cortex');
}

function showHelp() {
  console.log('Usage: npm run publish <command>');
  console.log('');
  console.log('Commands:');
  console.log('  check     - Run all pre-publish checks');
  console.log('  publish   - Full publish workflow (check + publish)');
  console.log('  patch     - Release patch version (0.0.x)');
  console.log('  minor     - Release minor version (0.x.0)');
  console.log('  major     - Release major version (x.0.0)');
  console.log('  help      - Show this help message');
  console.log('');
  console.log('Quick Release Workflow:');
  console.log('  npm run publish patch    # Bug fixes');
  console.log('  npm run publish minor    # New features');
  console.log('  npm run publish major    # Breaking changes');
}

switch (command) {
  case 'check':
    runQualityChecks();
    runPublishValidation();
    print(GREEN, '\n🎉 Ready for publish!');
    break;

  case 'publish':
    print(YELLOW, '🚀 Starting Full Publish Workflow...');

    // Run all checks
    runQualityChecks();
    runPublishValidation();

    // Check CHANGELOG version consistency
    {
      const currentVersion = require('../package.json').version;
      const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
      const changelogVersionMatch = changelogContent.match(/## \[(\d+\.\d+\.\d+)\]/);
      const changelogVersion = changelogVersionMatch ? changelogVersionMatch[1] : null;

      if (changelogVersion !== currentVersion) {
        print(RED, `\n❌ CHANGELOG.md version (${changelogVersion}) doesn't match package.json version (${currentVersion})`);
        print(YELLOW, '💡 Please update CHANGELOG.md or run: npm version <version>');
        process.exit(1);
      }

      print(GREEN, '✅ CHANGELOG.md version matches package.json');
    }

    // Build project
    print(BLUE, '\n📦 Building project...');
    {
      const buildResult = runCommand('npm run build', 'Build project', false);
      if (!buildResult.success) {
        print(RED, '❌ Build failed - cannot publish broken code!');
        process.exit(1);
      }
    }

    // Publish to npm
    print(BLUE, '\n🚀 Publishing to npm...');
    runCommand('npm publish', 'Publish to npm', false);

    print(GREEN, '\n🎉 Successfully published to npm!');
    break;

  case 'patch':
  case 'minor':
  case 'major':
    releaseVersion(command);
    break;

  case 'help':
  default:
    showHelp();
    break;
}
