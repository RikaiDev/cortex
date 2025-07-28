#!/usr/bin/env node

/**
 * Philosophy Extractor Initialization Script
 * 
 * This script automatically analyzes existing codebases to extract development
 * philosophies and create comprehensive, clear guidelines.
 */

const fs = require('fs');
const path = require('path');

class PhilosophyExtractor {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.analysisResults = {
      structure: {},
      patterns: {},
      philosophy: {},
      bestPractices: {},
      guidelines: {}
    };
  }

  /**
   * Main initialization process
   */
  async initialize() {
    console.log('🔍 Starting Philosophy Extractor...');
    
    try {
      // Step 1: Analyze project structure
      await this.analyzeProjectStructure();
      
      // Step 2: Extract coding patterns
      await this.extractCodingPatterns();
      
      // Step 3: Identify development philosophy
      await this.identifyDevelopmentPhilosophy();
      
      // Step 4: Synthesize best practices
      await this.synthesizeBestPractices();
      
      // Step 5: Generate comprehensive guidelines
      await this.generateGuidelines();
      
      // Step 6: Create output files
      await this.createOutputFiles();
      
      console.log('✅ Philosophy extraction completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during philosophy extraction:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze project structure and organization
   */
  async analyzeProjectStructure() {
    console.log('📁 Analyzing project structure...');
    
    const structure = {
      directories: this.scanDirectories(),
      files: this.scanFiles(),
      technologyStack: this.detectTechnologyStack(),
      architecture: this.analyzeArchitecture()
    };
    
    this.analysisResults.structure = structure;
  }

  /**
   * Scan directory structure
   */
  scanDirectories() {
    const directories = [];
    const scanDir = (dir, depth = 0) => {
      if (depth > 5) return; // Limit depth to avoid infinite recursion
      
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            directories.push({
              name: item,
              path: fullPath,
              depth: depth,
              type: this.categorizeDirectory(item)
            });
            scanDir(fullPath, depth + 1);
          }
        });
      } catch (error) {
        // Skip directories we can't access
      }
    };
    
    scanDir(this.projectPath);
    return directories;
  }

  /**
   * Categorize directory types
   */
  categorizeDirectory(dirName) {
    const categories = {
      source: ['src', 'source', 'app', 'lib', 'components', 'modules'],
      test: ['test', 'tests', 'spec', '__tests__'],
      config: ['config', 'conf', 'settings'],
      docs: ['docs', 'documentation', 'readme'],
      build: ['build', 'dist', 'out', 'target'],
      assets: ['assets', 'static', 'public', 'resources']
    };
    
    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.some(pattern => dirName.includes(pattern))) {
        return category;
      }
    }
    
    return 'other';
  }

  /**
   * Scan files and their patterns
   */
  scanFiles() {
    const files = [];
    const extensions = new Set();
    
    const scanFilesRecursive = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile()) {
            const ext = path.extname(item);
            extensions.add(ext);
            
            files.push({
              name: item,
              path: fullPath,
              extension: ext,
              size: stat.size,
              type: this.categorizeFile(item, ext)
            });
          } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanFilesRecursive(fullPath);
          }
        });
      } catch (error) {
        // Skip files we can't access
      }
    };
    
    scanFilesRecursive(this.projectPath);
    
    return {
      files: files,
      extensions: Array.from(extensions),
      patterns: this.analyzeFilePatterns(files)
    };
  }

  /**
   * Categorize file types
   */
  categorizeFile(fileName, extension) {
    const categories = {
      code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.php', '.rb', '.go', '.rs'],
      config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf'],
      docs: ['.md', '.txt', '.rst'],
      assets: ['.css', '.scss', '.sass', '.html', '.xml', '.svg', '.png', '.jpg', '.jpeg'],
      build: ['.lock', '.log', '.tmp']
    };
    
    for (const [category, exts] of Object.entries(categories)) {
      if (exts.includes(extension)) {
        return category;
      }
    }
    
    return 'other';
  }

  /**
   * Analyze file naming patterns
   */
  analyzeFilePatterns(files) {
    const patterns = {
      naming: this.analyzeNamingPatterns(files),
      organization: this.analyzeOrganizationPatterns(files),
      conventions: this.analyzeConventions(files)
    };
    
    return patterns;
  }

  /**
   * Analyze naming patterns
   */
  analyzeNamingPatterns(files) {
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      snakeCase: 0,
      PascalCase: 0,
      lowercase: 0
    };
    
    files.forEach(file => {
      const name = path.basename(file.name, file.extension);
      
      if (/^[a-z][a-zA-Z]*$/.test(name)) patterns.camelCase++;
      else if (/^[a-z][a-z-]*$/.test(name)) patterns.kebabCase++;
      else if (/^[a-z][a-z_]*$/.test(name)) patterns.snakeCase++;
      else if (/^[A-Z][a-zA-Z]*$/.test(name)) patterns.PascalCase++;
      else patterns.lowercase++;
    });
    
    return patterns;
  }

  /**
   * Analyze organization patterns
   */
  analyzeOrganizationPatterns(files) {
    const organization = {
      byType: {},
      byFeature: {},
      byLayer: {}
    };
    
    files.forEach(file => {
      // Group by file type
      if (!organization.byType[file.type]) {
        organization.byType[file.type] = [];
      }
      organization.byType[file.type].push(file);
      
      // Group by feature (based on directory structure)
      const dirPath = path.dirname(file.path);
      const feature = path.basename(dirPath);
      if (!organization.byFeature[feature]) {
        organization.byFeature[feature] = [];
      }
      organization.byFeature[feature].push(file);
    });
    
    return organization;
  }

  /**
   * Analyze coding conventions
   */
  analyzeConventions(files) {
    const conventions = {
      imports: this.analyzeImportPatterns(files),
      exports: this.analyzeExportPatterns(files),
      structure: this.analyzeCodeStructure(files)
    };
    
    return conventions;
  }

  /**
   * Analyze import patterns
   */
  analyzeImportPatterns(files) {
    const importPatterns = {
      relative: 0,
      absolute: 0,
      aliased: 0,
      wildcard: 0
    };
    
    files.filter(f => f.type === 'code').forEach(file => {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach(line => {
          if (line.includes('import') || line.includes('require')) {
            if (line.includes('./') || line.includes('../')) importPatterns.relative++;
            else if (line.includes('*')) importPatterns.wildcard++;
            else if (line.includes('from') && !line.includes('./')) importPatterns.absolute++;
            else importPatterns.aliased++;
          }
        });
      } catch (error) {
        // Skip files we can't read
      }
    });
    
    return importPatterns;
  }

  /**
   * Analyze export patterns
   */
  analyzeExportPatterns(files) {
    const exportPatterns = {
      default: 0,
      named: 0,
      mixed: 0
    };
    
    files.filter(f => f.type === 'code').forEach(file => {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n');
        
        let hasDefault = false;
        let hasNamed = false;
        
        lines.forEach(line => {
          if (line.includes('export default')) hasDefault = true;
          if (line.includes('export ') && !line.includes('export default')) hasNamed = true;
        });
        
        if (hasDefault && hasNamed) exportPatterns.mixed++;
        else if (hasDefault) exportPatterns.default++;
        else if (hasNamed) exportPatterns.named++;
      } catch (error) {
        // Skip files we can't read
      }
    });
    
    return exportPatterns;
  }

  /**
   * Analyze code structure patterns
   */
  analyzeCodeStructure(files) {
    const structure = {
      classes: 0,
      functions: 0,
      components: 0,
      modules: 0
    };
    
    files.filter(f => f.type === 'code').forEach(file => {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        
        if (content.includes('class ')) structure.classes++;
        if (content.includes('function ')) structure.functions++;
        if (content.includes('export default') && content.includes('function')) structure.components++;
        if (content.includes('module.exports') || content.includes('export')) structure.modules++;
      } catch (error) {
        // Skip files we can't read
      }
    });
    
    return structure;
  }

  /**
   * Detect technology stack
   */
  detectTechnologyStack() {
    const stack = {
      languages: [],
      frameworks: [],
      tools: [],
      databases: []
    };
    
    // Check for package.json (Node.js)
    if (fs.existsSync(path.join(this.projectPath, 'package.json'))) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8'));
        stack.languages.push('JavaScript');
        
        if (packageJson.dependencies) {
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          // Detect frameworks
          if (deps.react) stack.frameworks.push('React');
          if (deps.vue) stack.frameworks.push('Vue');
          if (deps.angular) stack.frameworks.push('Angular');
          if (deps.express) stack.frameworks.push('Express');
          if (deps.next) stack.frameworks.push('Next.js');
          if (deps.nuxt) stack.frameworks.push('Nuxt.js');
          
          // Detect tools
          if (deps.webpack) stack.tools.push('Webpack');
          if (deps.vite) stack.tools.push('Vite');
          if (deps.eslint) stack.tools.push('ESLint');
          if (deps.prettier) stack.tools.push('Prettier');
        }
      } catch (error) {
        console.warn('Could not parse package.json');
      }
    }
    
    // Check for TypeScript
    if (fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
      stack.languages.push('TypeScript');
    }
    
    // Check for Python
    if (fs.existsSync(path.join(this.projectPath, 'requirements.txt')) || 
        fs.existsSync(path.join(this.projectPath, 'pyproject.toml'))) {
      stack.languages.push('Python');
    }
    
    // Check for Java
    if (fs.existsSync(path.join(this.projectPath, 'pom.xml')) || 
        fs.existsSync(path.join(this.projectPath, 'build.gradle'))) {
      stack.languages.push('Java');
    }
    
    return stack;
  }

  /**
   * Analyze architecture patterns
   */
  analyzeArchitecture() {
    const architecture = {
      patterns: [],
      layers: []
    };
    
    // Analyze directory structure for architectural patterns
    const dirs = this.analysisResults.structure.directories;
    
    // Check for common architectural patterns
    const patterns = {
      mvc: dirs.some(d => d.name.includes('controller') || d.name.includes('model') || d.name.includes('view')),
      layered: dirs.some(d => d.name.includes('layer') || d.name.includes('tier')),
      modular: dirs.some(d => d.name.includes('module') || d.name.includes('feature')),
      microservices: dirs.some(d => d.name.includes('service') || d.name.includes('api')),
      component: dirs.some(d => d.name.includes('component') || d.name.includes('widget'))
    };
    
    architecture.patterns = Object.keys(patterns).filter(key => patterns[key]);
    
    return architecture;
  }

  /**
   * Extract coding patterns from the codebase
   */
  async extractCodingPatterns() {
    console.log('🔍 Extracting coding patterns...');
    
    const patterns = {
      naming: this.analysisResults.structure.files.patterns.naming,
      organization: this.analysisResults.structure.files.patterns.organization,
      conventions: this.analysisResults.structure.files.patterns.conventions,
      architecture: this.analysisResults.structure.architecture
    };
    
    this.analysisResults.patterns = patterns;
  }

  /**
   * Identify development philosophy
   */
  async identifyDevelopmentPhilosophy() {
    console.log('🧠 Identifying development philosophy...');
    
    const philosophy = {
      principles: this.extractPrinciples(),
      constraints: this.extractConstraints(),
      goals: this.extractGoals(),
      values: this.extractValues()
    };
    
    this.analysisResults.philosophy = philosophy;
  }

  /**
   * Extract development principles
   */
  extractPrinciples() {
    const principles = [];
    
    // Analyze patterns to extract principles
    const patterns = this.analysisResults.patterns;
    
    if (patterns.naming.camelCase > patterns.naming.snakeCase) {
      principles.push('Consistent camelCase naming convention');
    }
    
    if (patterns.conventions.imports.relative > patterns.conventions.imports.absolute) {
      principles.push('Prefer relative imports for local modules');
    }
    
    if (patterns.conventions.structure.components > 0) {
      principles.push('Component-based architecture');
    }
    
    if (patterns.conventions.structure.modules > 0) {
      principles.push('Modular code organization');
    }
    
    return principles;
  }

  /**
   * Extract technical constraints
   */
  extractConstraints() {
    const constraints = [];
    const stack = this.analysisResults.structure.technologyStack;
    
    if (stack.languages.includes('JavaScript')) {
      constraints.push('Browser compatibility requirements');
      constraints.push('JavaScript runtime constraints');
    }
    
    if (stack.frameworks.includes('React')) {
      constraints.push('React component lifecycle');
      constraints.push('JSX syntax requirements');
    }
    
    return constraints;
  }

  /**
   * Extract development goals
   */
  extractGoals() {
    const goals = [];
    
    // Analyze structure to infer goals
    const structure = this.analysisResults.structure;
    
    if (structure.directories.some(d => d.type === 'test')) {
      goals.push('Comprehensive testing coverage');
    }
    
    if (structure.directories.some(d => d.type === 'docs')) {
      goals.push('Thorough documentation');
    }
    
    if (structure.files.patterns.organization.byFeature) {
      goals.push('Feature-based organization');
    }
    
    return goals;
  }

  /**
   * Extract development values
   */
  extractValues() {
    const values = [];
    
    // Analyze patterns to infer values
    const patterns = this.analysisResults.patterns;
    
    if (patterns.conventions.structure.components > 0) {
      values.push('Reusability');
      values.push('Modularity');
    }
    
    if (patterns.naming.camelCase > 0) {
      values.push('Consistency');
    }
    
    values.push('Maintainability');
    values.push('Readability');
    
    return values;
  }

  /**
   * Synthesize best practices
   */
  async synthesizeBestPractices() {
    console.log('📚 Synthesizing best practices...');
    
    const bestPractices = {
      naming: this.synthesizeNamingPractices(),
      structure: this.synthesizeStructurePractices(),
      patterns: this.synthesizePatternPractices(),
      quality: this.synthesizeQualityPractices()
    };
    
    this.analysisResults.bestPractices = bestPractices;
  }

  /**
   * Synthesize naming practices
   */
  synthesizeNamingPractices() {
    const patterns = this.analysisResults.patterns.naming;
    const practices = [];
    
    // Determine dominant naming convention
    const conventions = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
    const dominant = conventions[0][0];
    
    practices.push(`Use ${dominant} naming convention consistently`);
    practices.push('Use descriptive, meaningful names');
    practices.push('Avoid abbreviations unless widely understood');
    
    return practices;
  }

  /**
   * Synthesize structure practices
   */
  synthesizeStructurePractices() {
    const practices = [];
    const structure = this.analysisResults.structure;
    
    practices.push('Organize code by feature or functionality');
    practices.push('Separate concerns into different modules');
    practices.push('Use clear directory structure');
    
    if (structure.directories.some(d => d.type === 'test')) {
      practices.push('Maintain comprehensive test coverage');
    }
    
    return practices;
  }

  /**
   * Synthesize pattern practices
   */
  synthesizePatternPractices() {
    const practices = [];
    const patterns = this.analysisResults.patterns;
    
    if (patterns.conventions.structure.components > 0) {
      practices.push('Use component-based architecture');
      practices.push('Keep components focused and single-purpose');
    }
    
    if (patterns.conventions.structure.modules > 0) {
      practices.push('Use modular code organization');
      practices.push('Export only what is necessary');
    }
    
    return practices;
  }

  /**
   * Synthesize quality practices
   */
  synthesizeQualityPractices() {
    const practices = [];
    
    practices.push('Write self-documenting code');
    practices.push('Use consistent formatting');
    practices.push('Handle errors gracefully');
    practices.push('Write meaningful comments');
    
    return practices;
  }

  /**
   * Generate comprehensive guidelines
   */
  async generateGuidelines() {
    console.log('📋 Generating comprehensive guidelines...');
    
    const guidelines = {
      overview: this.generateOverview(),
      standards: this.generateStandards(),
      patterns: this.generatePatternGuidelines(),
      examples: this.generateExamples()
    };
    
    this.analysisResults.guidelines = guidelines;
  }

  /**
   * Generate overview section
   */
  generateOverview() {
    const philosophy = this.analysisResults.philosophy;
    const stack = this.analysisResults.structure.technologyStack;
    
    return {
      philosophy: philosophy.principles.join(', '),
      technology: stack.languages.join(', '),
      frameworks: stack.frameworks.join(', '),
      goals: philosophy.goals.join(', ')
    };
  }

  /**
   * Generate coding standards
   */
  generateStandards() {
    const bestPractices = this.analysisResults.bestPractices;
    
    return {
      naming: bestPractices.naming,
      structure: bestPractices.structure,
      patterns: bestPractices.patterns,
      quality: bestPractices.quality
    };
  }

  /**
   * Generate pattern guidelines
   */
  generatePatternGuidelines() {
    const patterns = this.analysisResults.patterns;
    
    return {
      architecture: patterns.architecture.patterns,
      conventions: patterns.conventions,
      organization: patterns.organization
    };
  }

  /**
   * Generate examples
   */
  generateExamples() {
    // Extract examples from actual codebase
    const examples = [];
    const files = this.analysisResults.structure.files.files.filter(f => f.type === 'code');
    
    // Take a few representative files as examples
    const sampleFiles = files.slice(0, 3);
    
    sampleFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        examples.push({
          file: file.name,
          path: file.path,
          content: content.substring(0, 200) + '...' // Truncate for readability
        });
      } catch (error) {
        // Skip files we can't read
      }
    });
    
    return examples;
  }

  /**
   * Create output files
   */
  async createOutputFiles() {
    console.log('📄 Creating output files...');
    
    const outputDir = path.join(this.projectPath, 'docs', 'extracted-philosophy');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate comprehensive report
    await this.generateComprehensiveReport(outputDir);
    
    // Generate best practices document
    await this.generateBestPracticesDocument(outputDir);
    
    // Generate development philosophy document
    await this.generatePhilosophyDocument(outputDir);
    
    console.log(`📁 Output files created in: ${outputDir}`);
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateComprehensiveReport(outputDir) {
    const report = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectPath,
      analysis: this.analysisResults
    };
    
    const reportPath = path.join(outputDir, 'comprehensive-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also generate markdown version
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = path.join(outputDir, 'comprehensive-analysis.md');
    fs.writeFileSync(markdownPath, markdownReport);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const analysis = this.analysisResults;
    
    return `# Comprehensive Codebase Analysis Report

## Project Overview
- **Project Path**: ${this.projectPath}
- **Analysis Date**: ${new Date().toLocaleDateString()}

## Technology Stack
- **Languages**: ${analysis.structure.technologyStack.languages.join(', ')}
- **Frameworks**: ${analysis.structure.technologyStack.frameworks.join(', ')}
- **Tools**: ${analysis.structure.technologyStack.tools.join(', ')}

## Project Structure
- **Total Files**: ${analysis.structure.files.files.length}
- **File Types**: ${Object.keys(analysis.structure.files.patterns.organization.byType).join(', ')}
- **Directory Categories**: ${analysis.structure.directories.map(d => d.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}

## Coding Patterns
### Naming Conventions
${Object.entries(analysis.patterns.naming).map(([convention, count]) => `- ${convention}: ${count} files`).join('\n')}

### Import Patterns
${Object.entries(analysis.patterns.conventions.imports).map(([pattern, count]) => `- ${pattern}: ${count} occurrences`).join('\n')}

### Code Structure
${Object.entries(analysis.patterns.conventions.structure).map(([type, count]) => `- ${type}: ${count} files`).join('\n')}

## Development Philosophy
### Principles
${analysis.philosophy.principles.map(principle => `- ${principle}`).join('\n')}

### Goals
${analysis.philosophy.goals.map(goal => `- ${goal}`).join('\n')}

### Values
${analysis.philosophy.values.map(value => `- ${value}`).join('\n')}

## Best Practices
### Naming
${analysis.bestPractices.naming.map(practice => `- ${practice}`).join('\n')}

### Structure
${analysis.bestPractices.structure.map(practice => `- ${practice}`).join('\n')}

### Patterns
${analysis.bestPractices.patterns.map(practice => `- ${practice}`).join('\n')}

### Quality
${analysis.bestPractices.quality.map(practice => `- ${practice}`).join('\n')}
`;
  }

  /**
   * Generate best practices document
   */
  async generateBestPracticesDocument(outputDir) {
    const bestPractices = this.analysisResults.bestPractices;
    
    const document = `# Best Practices Guidelines

## Overview
This document contains best practices extracted from the existing codebase analysis.

## Naming Conventions
${bestPractices.naming.map(practice => `- ${practice}`).join('\n')}

## Code Structure
${bestPractices.structure.map(practice => `- ${practice}`).join('\n')}

## Design Patterns
${bestPractices.patterns.map(practice => `- ${practice}`).join('\n')}

## Quality Standards
${bestPractices.quality.map(practice => `- ${practice}`).join('\n')}

## Implementation Examples
${this.analysisResults.guidelines.examples.map(example => `
### ${example.file}
\`\`\`
${example.content}
\`\`\`
`).join('\n')}
`;
    
    const documentPath = path.join(outputDir, 'best-practices.md');
    fs.writeFileSync(documentPath, document);
  }

  /**
   * Generate development philosophy document
   */
  async generatePhilosophyDocument(outputDir) {
    const philosophy = this.analysisResults.philosophy;
    const overview = this.analysisResults.guidelines.overview;
    
    const document = `# Development Philosophy

## Core Philosophy
${overview.philosophy}

## Technology Choices
- **Languages**: ${overview.technology}
- **Frameworks**: ${overview.frameworks}

## Development Goals
${philosophy.goals.map(goal => `- ${goal}`).join('\n')}

## Core Principles
${philosophy.principles.map(principle => `- ${principle}`).join('\n')}

## Development Values
${philosophy.values.map(value => `- ${value}`).join('\n')}

## Technical Constraints
${philosophy.constraints.map(constraint => `- ${constraint}`).join('\n')}

## Success Criteria
- Code is maintainable and readable
- Patterns are consistent across the codebase
- Architecture supports scalability
- Quality standards are met consistently
`;
    
    const documentPath = path.join(outputDir, 'development-philosophy.md');
    fs.writeFileSync(documentPath, document);
  }
}

// CLI interface
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const extractor = new PhilosophyExtractor(projectPath);
  
  extractor.initialize().catch(error => {
    console.error('Failed to initialize philosophy extractor:', error);
    process.exit(1);
  });
}

module.exports = PhilosophyExtractor; 