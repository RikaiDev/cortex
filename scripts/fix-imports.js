#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Regular expression to match import statements without .js extension
// This matches both "from './path/to/file'" and "from '../path/to/file'"
const importRegex = /from\s+['"]([^'"]*\/[^'"./]*)['"];/g;

async function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports without .js extension
    const newContent = content.replace(importRegex, (match, importPath) => {
      // Only add .js to relative imports that don't already have an extension
      if ((importPath.startsWith('./') || importPath.startsWith('../')) && 
          !path.extname(importPath)) {
        modified = true;
        return `from '${importPath}.js';`;
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function main() {
  try {
    // Find all TypeScript files
    const files = await glob('src/**/*.ts', { cwd: rootDir });
    
    // Process each file
    for (const file of files) {
      await processFile(path.join(rootDir, file));
    }
    
    console.log('✅ Import paths fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing import paths:', error);
    process.exit(1);
  }
}

main();