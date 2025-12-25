#!/usr/bin/env node
/**
 * Script to record corrections to Cortex AI memory
 * Run from project root: node scripts/record-correction.mjs
 */

import { CorrectionService } from '../dist/core/mcp/services/correction-service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root is one level up from scripts/
const projectRoot = join(__dirname, '..');

const service = new CorrectionService(projectRoot);

const id = await service.recordCorrection({
  wrongBehavior: 'Used absolute file paths (e.g., /Users/username/...) in scripts or code, which only works on specific machines and breaks for other developers',
  correctBehavior: 'Always use relative paths (./..., ../...) or process.cwd() for cross-platform compatibility. Use __dirname, __filename, or import.meta.url for module-relative paths in ES modules',
  severity: 'major',
  context: {
    filePatterns: ['**/*.js', '**/*.mjs', '**/*.ts', 'scripts/**/*'],
    techStack: ['javascript', 'typescript', 'nodejs'],
    triggerKeywords: ['path', 'import', 'file', 'directory', 'absolute'],
    phases: ['implement']
  }
});

console.log('✅ Correction recorded:', id);
