#!/usr/bin/env node

/**
 * Future Development Variables Check Script
 * 
 * This script analyzes the codebase for variables that are:
 * 1. Unused but not prefixed with underscore (potential bugs)
 * 2. Prefixed with underscore (intentionally unused)
 * 3. Prefixed with _future_ (reserved for future development)
 * 
 * Usage:
 *   node future-vars-check.js [--fix] [--verbose]
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
  eslintConfig: '.eslintrc.future-vars.cjs',
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
console.log(chalk.blue('🔍 Starting future development variables check...'));
console.log();

// Step 1: Check for unused variables (not prefixed with _)
console.log(chalk.blue('Step 1: Checking for unused variables...'));
const eslintCommand = `npx eslint --config ${config.eslintConfig} "${config.srcDir}/**/*.ts"`;
const eslintResult = runCommand(eslintCommand);

if (eslintResult.success) {
  console.log(chalk.green('✅ No unused variables detected'));
} else {
  console.log(chalk.red('❌ Unused variables detected'));
  // Extract unused variables warnings
  const unusedVars = eslintResult.output.match(/[^\n]*no-unused-vars[^\n]*/g) || [];
  if (unusedVars.length > 0) {
    console.log(chalk.yellow('\n⚠️ Unused variables detected:'));
    unusedVars.forEach(line => {
      console.log(chalk.yellow(`  - ${line.trim()}`));
    });
    console.log(chalk.yellow('\nTip: Prefix unused variables with underscore (_) to indicate they are intentionally unused.'));
    console.log(chalk.yellow('     Prefix with _future_ to indicate they are reserved for future development.'));
  }
}
console.log();

// Step 2: Check for intentionally unused variables (prefixed with _)
console.log(chalk.blue('Step 2: Checking for intentionally unused variables...'));
const grepCommand = `grep -r "\\b_\\w\\+" --include="*.ts" ${config.srcDir} | grep -v "_future_" | grep -v "node_modules"`;
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

// Step 3: Check for future development variables (prefixed with _future_)
console.log(chalk.blue('Step 3: Checking for future development variables...'));
const futureVarsCommand = `grep -r "_future_" --include="*.ts" ${config.srcDir} | grep -v "node_modules"`;
const futureVarsResult = runCommand(futureVarsCommand, true);

if (futureVarsResult.success && futureVarsResult.output.trim()) {
  console.log(chalk.green('✅ Found variables reserved for future development:'));
  const lines = futureVarsResult.output.trim().split('\n');
  lines.forEach(line => {
    console.log(`  ${line}`);
  });
} else {
  console.log(chalk.yellow('⚠️ No future development variables found'));
}
console.log();

// Step 4: Generate documentation for future development variables
if (futureVarsResult.success && futureVarsResult.output.trim()) {
  console.log(chalk.blue('Step 4: Generating documentation for future development variables...'));
  
  const futureVarsDoc = {
    variables: [],
    lastUpdated: new Date().toISOString()
  };
  
  const lines = futureVarsResult.output.trim().split('\n');
  lines.forEach(line => {
    // Improved regex to better match future variables
    const match = line.match(/([^:]+):(\d+):(.*?)(_future_\w+)/);
    if (match) {
      const file = match[1];
      const lineNum = match[2];
      const name = match[4];
      
      // Try to extract context (comments or usage)
      let description = 'Reserved for future development';
      if (line.includes('//')) {
        const commentMatch = line.match(/\/\/\s*(.*)/);
        if (commentMatch) {
          description = commentMatch[1].trim();
        }
      } else if (line.includes('*')) {
        const docMatch = line.match(/\*\s*(.*)/);
        if (docMatch) {
          description = docMatch[1].trim();
        }
      }
      
      // Add to variables list if not already there
      if (!futureVarsDoc.variables.some(v => v.name === name && v.file === file)) {
        futureVarsDoc.variables.push({
          file,
          line: lineNum,
          name,
          description
        });
      }
    }
  });
  
  if (shouldFix) {
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const futureVarsDocPath = path.join(docsDir, 'future-development-variables.json');
    fs.writeFileSync(futureVarsDocPath, JSON.stringify(futureVarsDoc, null, 2));
    console.log(chalk.green(`✅ Documentation generated at docs/future-development-variables.json`));
  } else {
    console.log(chalk.yellow('⚠️ Run with --fix to generate documentation'));
  }
}
console.log();

// Summary
console.log(chalk.blue('📋 Summary:'));
console.log(`Unused Variables: ${eslintResult.success ? chalk.green('NONE') : chalk.red('DETECTED')}`);
console.log(`Intentionally Unused: ${grepResult.success && grepResult.output.trim() ? chalk.green('FOUND') : chalk.yellow('NONE')}`);
console.log(`Future Development: ${futureVarsResult.success && futureVarsResult.output.trim() ? chalk.green('FOUND') : chalk.yellow('NONE')}`);
console.log();

console.log(chalk.blue('\n🔍 Future development variables check complete!'));