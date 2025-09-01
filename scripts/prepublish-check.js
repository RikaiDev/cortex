#!/usr/bin/env node

/**
 * 🔒 Pre-Publish Gatekeeper
 * Ensures ZERO inconsistency between npm and git before publishing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

let hasErrors = false;

try {
  info('🔒 Pre-Publish Gatekeeper Started');
  info('Ensuring ZERO inconsistency between npm and git...\n');

  // 1. Check Git Status
  info('1. Checking Git Status...');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });

  if (gitStatus.trim()) {
    error('Git working directory is NOT clean!');
    error('Modified files:');
    console.log(gitStatus);
    hasErrors = true;
  } else {
    success('Git working directory is clean');
  }

  // 2. Check if all commits are pushed
  info('\n2. Checking if local commits are pushed...');
  try {
    const localCommits = execSync('git log --oneline origin/main..HEAD', { encoding: 'utf8' });
    if (localCommits.trim()) {
      error('Local commits are NOT pushed to remote!');
      error('Unpushed commits:');
      console.log(localCommits);
      hasErrors = true;
    } else {
      success('All local commits are pushed to remote');
    }
  } catch (e) {
    warning('Could not check remote status (may be offline)');
  }

  // 3. Check CHANGELOG consistency
  info('\n3. Checking CHANGELOG consistency...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const currentVersion = packageJson.version;

  const changelog = fs.readFileSync(path.join(projectRoot, 'CHANGELOG.md'), 'utf8');
  const changelogVersionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);

  if (!changelogVersionMatch) {
    error('No version found in CHANGELOG.md');
    hasErrors = true;
  } else if (changelogVersionMatch[1] !== currentVersion) {
    error(`CHANGELOG version (${changelogVersionMatch[1]}) does not match package.json (${currentVersion})`);
    hasErrors = true;
  } else {
    success(`CHANGELOG version matches: ${currentVersion}`);
  }

  // 4. Check if version is already published
  info('\n4. Checking if version is already published...');
  try {
    const publishedVersion = execSync(`npm view @rikaidev/cortex@${currentVersion} version 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (publishedVersion === currentVersion) {
      error(`Version ${currentVersion} is already published on npm!`);
      error('Use "npm version patch" to bump version first.');
      hasErrors = true;
    } else {
      success(`Version ${currentVersion} is not yet published`);
    }
  } catch (e) {
    success(`Version ${currentVersion} is not yet published`);
  }

  // 5. Final gate
  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    error('🚫 PUBLISH BLOCKED!');
    error('Fix the above issues before publishing.');
    console.log('\n💡 Quick fixes:');
    console.log('  • Commit all changes: git add . && git commit -m "..."');
    console.log('  • Push to remote: git push origin main');
    console.log('  • Update CHANGELOG: edit CHANGELOG.md');
    console.log('  • Bump version: npm version patch');
    process.exit(1);
  } else {
    success('🎉 ALL CHECKS PASSED!');
    success('Ready for npm publish with ZERO inconsistency!');
    console.log('\n🚀 You can now safely run: npm publish');
  }

} catch (error) {
  console.error('Pre-publish check failed:', error.message);
  process.exit(1);
}
