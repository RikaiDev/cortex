#!/usr/bin/env node

/**
 * 🚫 Release Workflow Enforcer
 * This script runs before any npm command to enforce release workflow compliance
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const releaseCheckFile = path.join(projectRoot, '.release-check-passed');

// Check if we're in a dangerous operation
const args = process.argv.slice(2);
const isVersionCommand = args.some(arg =>
  arg.includes('version') ||
  arg.includes('--version') ||
  arg.includes('-v')
);

const isPublishCommand = args.some(arg =>
  arg.includes('publish') ||
  arg.includes('--publish')
);

// Only enforce for version/publish operations
if (!isVersionCommand && !isPublishCommand) {
  process.exit(0);
}

// Check if release check was completed recently
if (!fs.existsSync(releaseCheckFile)) {
  console.error('❌ RELEASE WORKFLOW VIOLATION!');
  console.error('You must run: npm run release:check');
  console.error('This ensures the release follows the proper workflow.');
  process.exit(1);
}

const checkTime = fs.statSync(releaseCheckFile).mtime;
const now = new Date();
const hoursDiff = (now.getTime() - checkTime.getTime()) / (1000 * 60 * 60);

if (hoursDiff > 1) {
  console.error('⚠️  RELEASE CHECK EXPIRED!');
  console.error('Release check was completed more than 1 hour ago.');
  console.error('Please run: npm run release:check');
  process.exit(1);
}

console.log('✅ Release workflow compliance verified');
process.exit(0);
