#!/usr/bin/env node

/**
 * 🔒 Release Protection Script
 * Prevents bypassing the release workflow
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// Check if this is a direct npm version command (bypassing release workflow)
const args = process.argv.slice(2);
const isDirectVersionBump = args.some(arg =>
  arg.includes('npm version') ||
  arg.includes('--version') ||
  arg === 'version'
);

if (isDirectVersionBump) {
  error('🚫 DIRECT VERSION BUMP BLOCKED!');
  error('You are attempting to bypass the release workflow.');
  console.log('\n💡 Proper workflow:');
  console.log('  1. Run: npm run release:check');
  console.log('  2. Follow the release process');
  console.log('  3. Use release scripts: npm run release:patch|minor|major');
  console.log('  4. Never use "npm version" directly');
  process.exit(1);
}

// Check for suspicious npm publish attempts
const isDirectPublish = args.some(arg =>
  arg.includes('npm publish') ||
  arg.includes('publish') ||
  arg === '--publish'
);

if (isDirectPublish) {
  error('🚫 DIRECT PUBLISH BLOCKED!');
  error('You must run: npm run release:check');
  error('This ensures the release follows the proper workflow.');
  process.exit(1);
}

console.log('✅ Release protection check passed');
