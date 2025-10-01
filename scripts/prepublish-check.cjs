#!/usr/bin/env node

/**
 * 🔒 Pre-Publish Gatekeeper
 * Ensures ZERO inconsistency between npm and git before publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get project root
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

  // 5. Check if release check was completed
  info('\n5. Checking release check status...');
  const releaseCheckFile = path.join(projectRoot, '.release-check-passed');
  if (!fs.existsSync(releaseCheckFile)) {
    error('Release check not completed!');
    error('You must run: npm run release:check');
    error('This ensures the release follows the proper workflow.');
    hasErrors = true;
  } else {
    const checkTime = fs.statSync(releaseCheckFile).mtime;
    const now = new Date();
    const hoursDiff = (now.getTime() - checkTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 1) {
      warning('Release check was completed more than 1 hour ago');
      warning('Consider running: npm run release:check');
    } else {
      success('Release check passed recently');
    }
  }

  // 6. Final gate
  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    error('🚫 PUBLISH BLOCKED!');
    error('Fix the above issues before publishing.');
    console.log('\n💡 Required workflow:');
    console.log('  • Run release check: npm run release:check');
    console.log('  • Follow the release process strictly');
    console.log('  • Never use "npm version" directly');
    console.log('  • Always use release scripts for version bumps');
    process.exit(1);
  } else {
    success('🎉 ALL CHECKS PASSED!');
    success('Release follows proper workflow!');
    console.log('\n🚀 You can now safely run: npm publish');
  }

} catch (error) {
  console.error('Pre-publish check failed:', error.message);
  process.exit(1);
}
