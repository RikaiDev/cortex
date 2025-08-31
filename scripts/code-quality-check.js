#!/usr/bin/env node

/**
 * Automated code quality check script
 * 
 * This script performs the following checks:
 * 1. Delete old files (if specified)
 * 2. Update imports (if specified)
 * 3. Run ESLint to check for code style issues
 * 4. Run TypeScript compiler to check for type errors
 * 5. Run Prettier to check for formatting issues
 * 
 * Usage:
 *   node code-quality-check.js [--fix] [--verbose]
 *   
 *   Options:
 *     --fix      Automatically fix issues when possible
 *     --verbose  Show detailed output
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

// Configuration
const config = {
  srcDir: 'src',
  eslintConfig: '.eslintrc.cjs',
  prettierConfig: '.prettierrc',
  tsConfig: 'tsconfig.json',
  ignorePatterns: ['node_modules', 'dist', 'build'],
};

// Helper function to run a command and return the output
function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    if (verbose && !silent) {
      console.log(output);
    }
    return { success: true, output };
  } catch (error) {
    if (!silent) {
      console.error(`Error running command: ${command}`);
      if (verbose) {
        console.error(error.stdout || error.message);
      }
    }
    return { success: false, output: error.stdout || error.message };
  }
}

// Print header
console.log(chalk.blue('🔍 Starting code quality check...'));
console.log();

// Step 1: Check if ESLint is configured
console.log(chalk.blue('Step 1: Checking ESLint configuration...'));
if (fs.existsSync(path.join(process.cwd(), config.eslintConfig))) {
  console.log(chalk.green('✅ ESLint is configured'));
} else {
  console.log(chalk.yellow('⚠️ ESLint configuration not found, skipping ESLint checks'));
}
console.log();

// Step 2: Check if TypeScript is configured
console.log(chalk.blue('Step 2: Checking TypeScript configuration...'));
if (fs.existsSync(path.join(process.cwd(), config.tsConfig))) {
  console.log(chalk.green('✅ TypeScript is configured'));
} else {
  console.log(chalk.yellow('⚠️ TypeScript configuration not found, skipping TypeScript checks'));
}
console.log();

// Step 3: Check if Prettier is configured
console.log(chalk.blue('Step 3: Checking Prettier configuration...'));
if (fs.existsSync(path.join(process.cwd(), config.prettierConfig))) {
  console.log(chalk.green('✅ Prettier is configured'));
} else {
  console.log(chalk.yellow('⚠️ Prettier configuration not found, using default settings'));
}
console.log();

// Step 4: Run ESLint
console.log(chalk.blue('Step 4: Running ESLint...'));
const eslintCommand = shouldFix
  ? `npx eslint --fix "${config.srcDir}/**/*.ts"`
  : `npx eslint "${config.srcDir}/**/*.ts"`;
const eslintResult = runCommand(eslintCommand, true); // Always capture output

// Parse ESLint output to check for issues
const hasErrors = eslintResult.output.includes('✖') || eslintResult.output.includes('error');
const hasWarnings = eslintResult.output.includes('warning') || eslintResult.output.includes('⚠️');

if (eslintResult.success && !hasErrors && !hasWarnings) {
  console.log(chalk.green('✅ ESLint check passed'));
} else {
  if (hasErrors) {
    console.log(chalk.red('❌ ESLint check failed - errors found'));
  } else if (hasWarnings) {
    console.log(chalk.yellow('⚠️ ESLint check completed with warnings'));
  } else {
    console.log(chalk.red('❌ ESLint check failed'));
  }

  // Extract and display issues
  const errorLines = eslintResult.output.match(/[^\n]*error[^\n]*/gi) || [];
  const warningLines = eslintResult.output.match(/[^\n]*warning[^\n]*/gi) || [];

  if (errorLines.length > 0) {
    console.log(chalk.red('\n❌ Errors:'));
    errorLines.forEach(line => {
      console.log(chalk.red(`  - ${line.trim()}`));
    });
  }

  if (warningLines.length > 0) {
    console.log(chalk.yellow('\n⚠️ Warnings:'));
    warningLines.forEach(line => {
      console.log(chalk.yellow(`  - ${line.trim()}`));
    });
  }

  if (shouldFix) {
    console.log(chalk.yellow('\n🛠️ Some issues may have been automatically fixed'));
  } else {
    console.log(chalk.yellow('\n💡 Tip: Run with --fix to automatically fix some issues'));
  }

  // If there are errors, mark as failed
  if (hasErrors) {
    eslintResult.success = false;
  }
}
console.log();

// Step 5: Run TypeScript compiler
console.log(chalk.blue('Step 5: Running TypeScript compiler...'));
const tsResult = runCommand('npx tsc --noEmit');

if (tsResult.success) {
  console.log(chalk.green('✅ TypeScript check passed'));
} else {
  console.log(chalk.red('❌ TypeScript check failed'));
  // Extract missing type declarations
  const missingTypes = tsResult.output.match(/[^\n]*Could not find a declaration file[^\n]*/g) || [];
  if (missingTypes.length > 0) {
    console.log(chalk.yellow('\n⚠️ Missing type declarations:'));
    missingTypes.forEach(line => {
      const match = line.match(/Try `npm i --save-dev @types\/([^`]+)`/);
      if (match) {
        console.log(chalk.yellow(`  - Missing @types/${match[1]} - Run: npm install --save-dev @types/${match[1]}`));
      }
    });
  }
}
console.log();

// Step 6: Run Prettier
console.log(chalk.blue('Step 6: Running Prettier...'));
const prettierCommand = shouldFix 
  ? `npx prettier --write "${config.srcDir}/**/*.ts"`
  : `npx prettier --check "${config.srcDir}/**/*.ts"`;
const prettierResult = runCommand(prettierCommand);

if (prettierResult.success) {
  console.log(chalk.green('✅ Prettier check passed'));
} else {
  console.log(chalk.red('❌ Prettier check failed'));
  if (shouldFix) {
    console.log(chalk.yellow('⚠️ Some files were automatically formatted'));
  } else {
    console.log(chalk.yellow('⚠️ Run with --fix to automatically format files'));
  }
}
console.log();

// Step 7: Generate intentional unused variables report
console.log(chalk.blue('Step 7: Generating intentional unused variables report...'));
const grepCommand = `grep -r "_\\w\\+" --include="*.ts" ${config.srcDir} | grep -v "node_modules"`;
const grepResult = runCommand(grepCommand, true);

if (grepResult.success && grepResult.output.trim()) {
  console.log(chalk.green('✅ Found intentionally unused variables (prefixed with _):'));
  const lines = grepResult.output.trim().split('\n');
  lines.forEach(line => {
    console.log(`  ${line}`);
  });
} else {
  console.log(chalk.yellow('⚠️ No intentionally unused variables found'));
}
console.log();

// Summary
console.log(chalk.blue('📋 Summary:'));
console.log(`ESLint: ${eslintResult.success ? chalk.green('PASS') : chalk.red('FAIL')}`);
console.log(`TypeScript: ${tsResult.success ? chalk.green('PASS') : chalk.red('FAIL')}`);
console.log(`Prettier: ${prettierResult.success ? chalk.green('PASS') : chalk.red('FAIL')}`);
console.log();

if (shouldFix) {
  console.log(chalk.blue('🛠️ Fix mode was enabled. Some issues may have been automatically fixed.'));
} else {
  console.log(chalk.yellow('💡 Tip: Run with --fix to automatically fix some issues.'));
}

console.log(chalk.blue('\n🔍 Code quality check complete!'));