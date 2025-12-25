import fs from "fs-extra";
import * as path from "path";
import { execSync } from "child_process";

export interface ProjectConventions {
  // Documentation files
  hasChangelog: boolean;
  hasReleaseNotes: boolean;
  changelogPath?: string;
  releaseNotesPath?: string;

  // Commit format
  usesConventionalCommits: boolean;
  commitTypes: string[];

  // Toolchain
  hasCommitlint: boolean;
  hasHusky: boolean;
  hasSemanticRelease: boolean;

  // Cortex-specific
  hasCortexWorkflows: boolean;
  workflowCount: number;

  // Constitution settings
  releaseRules?: {
    requireChangelog: boolean;
    requireReleaseNotes: boolean;
    changeFormat: "conventional" | "freeform" | "hybrid";
  };
}

export class ProjectDetector {
  constructor(private projectRoot: string) {}

  /**
   * Analyze project conventions and return configuration
   */
  async analyze(): Promise<ProjectConventions> {
    const conventions: ProjectConventions = {
      hasChangelog: false,
      hasReleaseNotes: false,
      usesConventionalCommits: false,
      commitTypes: [],
      hasCommitlint: false,
      hasHusky: false,
      hasSemanticRelease: false,
      hasCortexWorkflows: false,
      workflowCount: 0,
    };

    // 1. Check documentation files in root directory
    await this.checkDocumentationFiles(conventions);

    // 2. Analyze git commits format
    await this.analyzeCommitFormat(conventions);

    // 3. Check toolchain
    await this.checkToolchain(conventions);

    // 4. Check Cortex workflows
    await this.checkCortexWorkflows(conventions);

    // 5. Read Release rules from constitution
    await this.checkConstitutionRules(conventions);

    return conventions;
  }

  /**
   * Check documentation files in root directory
   */
  private async checkDocumentationFiles(
    conventions: ProjectConventions
  ): Promise<void> {
    // Check for CHANGELOG.md
    const changelogPaths = ["CHANGELOG.md", "Changelog.md", "changelog.md"];
    for (const changelogPath of changelogPaths) {
      const fullPath = path.join(this.projectRoot, changelogPath);
      if (await fs.pathExists(fullPath)) {
        conventions.hasChangelog = true;
        conventions.changelogPath = changelogPath;
        break;
      }
    }

    // Check for RELEASE_NOTES.md
    const releaseNotesPaths = [
      "RELEASE_NOTES.md",
      "ReleaseNotes.md",
      "RELEASE.md",
      "Release.md",
    ];
    for (const releaseNotesPath of releaseNotesPaths) {
      const fullPath = path.join(this.projectRoot, releaseNotesPath);
      if (await fs.pathExists(fullPath)) {
        conventions.hasReleaseNotes = true;
        conventions.releaseNotesPath = releaseNotesPath;
        break;
      }
    }
  }

  /**
   * Analyze format of last 50 git commits
   */
  private async analyzeCommitFormat(
    conventions: ProjectConventions
  ): Promise<void> {
    try {
      // Get last 50 commits
      const commits = execSync("git log -50 --oneline --no-decorate", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });

      const lines = commits.split("\n").filter((line) => line.trim());

      // Conventional commit pattern: type(scope): description
      const conventionalPattern =
        /^[a-f0-9]+\s+(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\(.+\))?:\s+.+/i;

      const conventionalCommits = lines.filter((line) =>
        conventionalPattern.test(line)
      );

      // If more than 60% commits follow conventional format
      if (conventionalCommits.length / lines.length > 0.6) {
        conventions.usesConventionalCommits = true;

        // Extract commit types
        const types = new Set<string>();
        conventionalCommits.forEach((commit) => {
          const match = commit.match(
            /\s+(feat|fix|docs|style|refactor|perf|test|chore|build|ci)/i
          );
          if (match) {
            types.add(match[1].toLowerCase());
          }
        });
        conventions.commitTypes = Array.from(types);
      }
    } catch {
      // If git command fails, assume no git repo or no commits
      // Just continue with empty values
    }
  }

  /**
   * Check package.json scripts and devDependencies
   */
  private async checkToolchain(conventions: ProjectConventions): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    if (!(await fs.pathExists(packageJsonPath))) {
      return;
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);

      // Check devDependencies
      const devDeps = packageJson.devDependencies || {};
      conventions.hasCommitlint = !!devDeps["@commitlint/cli"];
      conventions.hasSemanticRelease = !!devDeps["semantic-release"];

      // Check for husky directory
      const huskyPath = path.join(this.projectRoot, ".husky");
      conventions.hasHusky = await fs.pathExists(huskyPath);

      // Also check for commitlint config files
      const commitlintConfigs = [
        ".commitlintrc",
        ".commitlintrc.json",
        ".commitlintrc.js",
        "commitlint.config.js",
      ];
      for (const config of commitlintConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          conventions.hasCommitlint = true;
          break;
        }
      }
    } catch {
      // If reading package.json fails, just continue
    }
  }

  /**
   * Check workflow files in .cortex/workflows/
   */
  private async checkCortexWorkflows(
    conventions: ProjectConventions
  ): Promise<void> {
    const workflowsPath = path.join(this.projectRoot, ".cortex", "workflows");
    if (!(await fs.pathExists(workflowsPath))) {
      return;
    }

    try {
      const workflows = await fs.readdir(workflowsPath);
      conventions.hasCortexWorkflows = workflows.length > 0;
      conventions.workflowCount = workflows.length;
    } catch {
      // If reading workflows fails, just continue
    }
  }

  /**
   * Read Release rules from .cortex/constitution.md
   */
  private async checkConstitutionRules(
    conventions: ProjectConventions
  ): Promise<void> {
    const constitutionPath = path.join(
      this.projectRoot,
      ".cortex",
      "templates",
      "constitution.md"
    );
    if (!(await fs.pathExists(constitutionPath))) {
      return;
    }

    try {
      const constitution = await fs.readFile(constitutionPath, "utf-8");

      // Look for release-related sections
      const hasReleaseSection =
        /##\s+Release/i.test(constitution) ||
        /##\s+.*Changelog/i.test(constitution);

      if (hasReleaseSection) {
        conventions.releaseRules = {
          requireChangelog: /changelog/i.test(constitution),
          requireReleaseNotes: /release.*notes/i.test(constitution),
          changeFormat: conventions.usesConventionalCommits
            ? "conventional"
            : "freeform",
        };

        // Override if constitution explicitly mentions conventional commits
        if (/conventional.*commit/i.test(constitution)) {
          conventions.releaseRules.changeFormat = "conventional";
        }
      }
    } catch {
      // If reading constitution fails, just continue
    }
  }
}
