#!/usr/bin/env node

/**
 * 🔍 Dependency Validator - Zero Patch Guarantee
 * Ensures no runtime dependencies are accidentally placed in devDependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Read package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Runtime dependencies that should NOT be in devDependencies
const criticalRuntimeDeps = [
  'typescript', // Used in project-scanner.ts
  'chalk',      // CLI output
  'commander',  // CLI parsing
  'fs-extra',   // File operations
];

console.log('🔍 Checking runtime dependencies...\n');

let hasErrors = false;

for (const dep of criticalRuntimeDeps) {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`❌ ERROR: "${dep}" is in devDependencies but used at runtime!`);
    hasErrors = true;
  } else if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ "${dep}" correctly placed in dependencies`);
  } else {
    console.log(`⚠️  "${dep}" not found in any dependencies`);
  }
}

console.log('\n' + '='.repeat(50));

// Additional checks
console.log('\n🔍 Additional dependency checks...\n');

// Check for any imports that might indicate missing dependencies
const srcFiles = fs.readdirSync(path.join(projectRoot, 'src'), { recursive: true })
  .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
  .map(file => path.join(projectRoot, 'src', file));

let foundRuntimeImports = false;

for (const file of srcFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // Check for problematic runtime imports
    const runtimeImportPatterns = [
      /import.*typescript/,
      /require.*typescript/,
    ];

    for (const pattern of runtimeImportPatterns) {
      if (pattern.test(content)) {
        const relativePath = path.relative(projectRoot, file);
        console.log(`⚠️  Runtime import found in: ${relativePath}`);
        foundRuntimeImports = true;
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

if (foundRuntimeImports) {
  console.log('\n💡 Tip: Ensure these imports are from runtime dependencies, not devDependencies');
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n❌ DEPENDENCY CHECK FAILED!');
  console.log('Please move the flagged dependencies from devDependencies to dependencies.');
  process.exit(1);
} else {
  console.log('\n✅ All runtime dependencies are correctly placed!');
  console.log('🎉 Zero patch guarantee: Dependencies check passed');
}

process.exit(0);
