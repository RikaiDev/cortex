import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';

const execAsync = promisify(exec);

interface TechStack {
  language?: string;
  framework?: string;
  storage?: string;
  projectType?: string;
}

interface IgnoreConfig {
  file: string;
  detector: () => Promise<boolean>;
  patterns: string[];
}

export class GitignoreValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate and create/update ignore files based on tech stack
   */
  async validateIgnoreFiles(planPath: string): Promise<void> {
    // 1. Extract tech stack from plan.md
    const techStack = await this.extractTechStack(planPath);

    // 2. Check if git repository exists
    const hasGit = await this.hasGitRepo();

    // 3. Validate/create ignore files
    const configs = await this.buildIgnoreConfigs(techStack, hasGit);

    for (const config of configs) {
      const shouldCreate = await config.detector();
      if (shouldCreate) {
        await this.ensureIgnoreFile(config.file, config.patterns);
      }
    }
  }

  /**
   * Extract tech stack information from plan.md
   */
  private async extractTechStack(planPath: string): Promise<TechStack> {
    try {
      const content = await fs.readFile(planPath, 'utf-8');
      
      const extractField = (fieldName: string): string | undefined => {
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+)`, 'i');
        const match = content.match(regex);
        if (match && match[1]) {
          const value = match[1].trim();
          if (value === 'NEEDS CLARIFICATION' || value === 'N/A') {
            return undefined;
          }
          return value;
        }
        return undefined;
      };

      return {
        language: extractField('Language/Version'),
        framework: extractField('Primary Dependencies'),
        storage: extractField('Storage'),
        projectType: extractField('Project Type'),
      };
    } catch (error) {
      console.warn(`Failed to extract tech stack from plan: ${error}`);
      return {};
    }
  }

  /**
   * Check if git repository exists
   */
  private async hasGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.projectRoot });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build ignore file configurations based on tech stack
   */
  private async buildIgnoreConfigs(
    techStack: TechStack,
    hasGit: boolean
  ): Promise<IgnoreConfig[]> {
    const configs: IgnoreConfig[] = [];

    // .gitignore
    if (hasGit) {
      configs.push({
        file: '.gitignore',
        detector: async () => true,
        patterns: this.getGitignorePatterns(techStack),
      });
    }

    // .dockerignore
    configs.push({
      file: '.dockerignore',
      detector: async () => await this.fileExists('Dockerfile') || 
                             await this.fileExists('Dockerfile.*') ||
                             (techStack.projectType?.toLowerCase().includes('docker') ?? false),
      patterns: this.getDockerignorePatterns(),
    });

    // .eslintignore
    configs.push({
      file: '.eslintignore',
      detector: async () => await this.fileExists('.eslintrc*') || 
                             await this.fileExists('eslint.config.*'),
      patterns: this.getEslintignorePatterns(),
    });

    // .prettierignore
    configs.push({
      file: '.prettierignore',
      detector: async () => await this.fileExists('.prettierrc*'),
      patterns: this.getPrettierignorePatterns(),
    });

    // .npmignore
    configs.push({
      file: '.npmignore',
      detector: async () => await this.fileExists('package.json'),
      patterns: this.getNpmignorePatterns(),
    });

    // .terraformignore
    configs.push({
      file: '.terraformignore',
      detector: async () => await this.hasFilesMatching('*.tf'),
      patterns: this.getTerraformignorePatterns(),
    });

    return configs;
  }

  /**
   * Get .gitignore patterns based on tech stack
   */
  private getGitignorePatterns(techStack: TechStack): string[] {
    const patterns: string[] = [];
    const lang = techStack.language?.toLowerCase() || '';

    // Universal patterns
    patterns.push(
      '# OS files',
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.swp',
      '',
      '# IDE',
      '.vscode/',
      '.idea/',
      '*.iml',
      '',
      '# Environment',
      '.env',
      '.env.local',
      '.env*.local',
      '',
      '# Logs',
      '*.log',
      'logs/',
      ''
    );

    // Language-specific patterns
    if (lang.includes('python')) {
      patterns.push(
        '# Python',
        '__pycache__/',
        '*.py[cod]',
        '*$py.class',
        '*.so',
        '.Python',
        'build/',
        'develop-eggs/',
        'dist/',
        'downloads/',
        'eggs/',
        '.eggs/',
        'lib/',
        'lib64/',
        'parts/',
        'sdist/',
        'var/',
        'wheels/',
        '*.egg-info/',
        '.installed.cfg',
        '*.egg',
        'venv/',
        'ENV/',
        'env/',
        '.venv/',
        ''
      );
    } else if (lang.includes('javascript') || lang.includes('typescript') || lang.includes('node')) {
      patterns.push(
        '# Node.js',
        'node_modules/',
        'dist/',
        'build/',
        '.next/',
        'out/',
        '*.tsbuildinfo',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '.pnpm-debug.log*',
        ''
      );
    } else if (lang.includes('rust')) {
      patterns.push(
        '# Rust',
        'target/',
        'debug/',
        'release/',
        '*.rs.bk',
        '*.rlib',
        '*.prof*',
        'Cargo.lock',
        ''
      );
    } else if (lang.includes('go')) {
      patterns.push(
        '# Go',
        '*.exe',
        '*.test',
        '*.out',
        'vendor/',
        'go.work',
        ''
      );
    } else if (lang.includes('java')) {
      patterns.push(
        '# Java',
        'target/',
        '*.class',
        '*.jar',
        '*.war',
        '*.ear',
        '.gradle/',
        'build/',
        ''
      );
    } else if (lang.includes('c#') || lang.includes('csharp') || lang.includes('.net')) {
      patterns.push(
        '# C#/.NET',
        'bin/',
        'obj/',
        '*.user',
        '*.suo',
        '*.userosscache',
        '*.sln.docstates',
        'packages/',
        ''
      );
    } else if (lang.includes('ruby')) {
      patterns.push(
        '# Ruby',
        '.bundle/',
        'log/',
        'tmp/',
        '*.gem',
        'vendor/bundle/',
        '.ruby-version',
        ''
      );
    } else if (lang.includes('php')) {
      patterns.push(
        '# PHP',
        'vendor/',
        'composer.lock',
        '*.cache',
        ''
      );
    } else if (lang.includes('swift')) {
      patterns.push(
        '# Swift',
        '.build/',
        'DerivedData/',
        '*.swiftpm/',
        'Packages/',
        '*.xcodeproj/',
        '*.xcworkspace/',
        ''
      );
    }

    // Database-specific
    if (techStack.storage) {
      patterns.push(
        '# Database',
        '*.sqlite',
        '*.sqlite3',
        '*.db',
        ''
      );
    }

    return patterns;
  }

  /**
   * Get .dockerignore patterns
   */
  private getDockerignorePatterns(): string[] {
    return [
      'node_modules/',
      '.git/',
      '.gitignore',
      'Dockerfile*',
      '.dockerignore',
      '*.log',
      '.env*',
      'coverage/',
      'dist/',
      'build/',
      '.next/',
      'out/',
      '__pycache__/',
      '*.pyc',
      '.pytest_cache/',
      'target/',
      '*.md',
      'README*',
      'LICENSE',
      '.vscode/',
      '.idea/',
    ];
  }

  /**
   * Get .eslintignore patterns
   */
  private getEslintignorePatterns(): string[] {
    return [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      '*.config.js',
      '.next/',
      'out/',
    ];
  }

  /**
   * Get .prettierignore patterns
   */
  private getPrettierignorePatterns(): string[] {
    return [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.next/',
      'out/',
    ];
  }

  /**
   * Get .npmignore patterns
   */
  private getNpmignorePatterns(): string[] {
    return [
      'node_modules/',
      'src/',
      'test/',
      'tests/',
      '*.test.js',
      '*.test.ts',
      '*.spec.js',
      '*.spec.ts',
      'coverage/',
      '.nyc_output/',
      '.vscode/',
      '.idea/',
      '.DS_Store',
    ];
  }

  /**
   * Get .terraformignore patterns
   */
  private getTerraformignorePatterns(): string[] {
    return [
      '.terraform/',
      '*.tfstate',
      '*.tfstate.backup',
      '*.tfvars',
      '.terraform.lock.hcl',
      'override.tf',
      'override.tf.json',
    ];
  }

  /**
   * Ensure ignore file exists with patterns
   */
  private async ensureIgnoreFile(filename: string, patterns: string[]): Promise<void> {
    const filepath = path.join(this.projectRoot, filename);

    try {
      // Check if file exists
      const exists = await this.fileExistsAbsolute(filepath);

      if (exists) {
        // File exists, append missing patterns
        const content = await fs.readFile(filepath, 'utf-8');
        const existingLines = new Set(content.split('\n').map(line => line.trim()));
        
        const missingPatterns = patterns.filter(pattern => {
          const trimmed = pattern.trim();
          return trimmed && !trimmed.startsWith('#') && !existingLines.has(trimmed);
        });

        if (missingPatterns.length > 0) {
          const appendContent = '\n\n# Added by Cortex AI\n' + missingPatterns.join('\n') + '\n';
          await fs.appendFile(filepath, appendContent, 'utf-8');
          console.log(`✓ Updated ${filename} with ${missingPatterns.length} new patterns`);
        }
      } else {
        // File doesn't exist, create it
        const content = `# Generated by Cortex AI\n\n${patterns.join('\n')}\n`;
        await fs.writeFile(filepath, content, 'utf-8');
        console.log(`✓ Created ${filename}`);
      }
    } catch (error) {
      console.warn(`Failed to update ${filename}: ${error}`);
    }
  }

  /**
   * Check if file exists (glob pattern support)
   */
  private async fileExists(pattern: string): Promise<boolean> {
    try {
      const files = await fs.readdir(this.projectRoot);
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return files.some(file => regex.test(file));
      }
      return files.includes(pattern);
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists (absolute path)
   */
  private async fileExistsAbsolute(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if files matching pattern exist
   */
  private async hasFilesMatching(pattern: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`find . -maxdepth 2 -name "${pattern}"`, {
        cwd: this.projectRoot,
      });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
}

