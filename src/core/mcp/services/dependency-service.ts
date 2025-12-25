/**
 * Dependency Service
 *
 * Manages dependency versions and compatibility checking
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  Dependency,
  DependencyAnalysis,
  VersionCompatibilityResult,
  DeprecationWarning,
  DependencyConflict,
  DeprecatedAPIsDatabase,
} from "../types/dependency.js";

export class DependencyService {
  private deprecatedAPIs: DeprecatedAPIsDatabase;

  constructor(private projectRoot: string) {
    // Initialize with common deprecated APIs
    this.deprecatedAPIs = this.getKnownDeprecations();
  }

  /**
   * Analyze all project dependencies
   */
  async analyzeDependencies(): Promise<DependencyAnalysis> {
    const dependencies: Dependency[] = [];

    // Parse npm dependencies
    const npmDeps = await this.parseNpmDependencies();
    dependencies.push(...npmDeps);

    // Parse Python dependencies
    const pythonDeps = await this.parsePythonDependencies();
    dependencies.push(...pythonDeps);

    // Parse Go dependencies
    const goDeps = await this.parseGoDependencies();
    dependencies.push(...goDeps);

    // Calculate statistics
    const byManager = dependencies.reduce(
      (acc, dep) => {
        acc[dep.manager] = (acc[dep.manager] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      dependencies,
      totalCount: dependencies.length,
      byManager,
      direct: dependencies.filter((d) => !d.isDev).length,
    };
  }

  /**
   * Parse npm/package.json dependencies
   */
  private async parseNpmDependencies(): Promise<Dependency[]> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return [];
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies: Dependency[] = [];

      // Parse dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(
          packageJson.dependencies
        )) {
          dependencies.push({
            name,
            version: version as string,
            isDev: false,
            manager: "npm",
            source: "package.json",
          });
        }
      }

      // Parse devDependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(
          packageJson.devDependencies
        )) {
          dependencies.push({
            name,
            version: version as string,
            isDev: true,
            manager: "npm",
            source: "package.json",
          });
        }
      }

      // Try to get installed versions from package-lock.json
      const packageLockPath = path.join(this.projectRoot, "package-lock.json");
      if (await fs.pathExists(packageLockPath)) {
        try {
          const packageLock = await fs.readJson(packageLockPath);
          if (packageLock.packages) {
            for (const dep of dependencies) {
              const packageKey = `node_modules/${dep.name}`;
              if (packageLock.packages[packageKey]) {
                dep.installedVersion = packageLock.packages[packageKey].version;
              }
            }
          }
        } catch {
          // Ignore lock file parse errors
        }
      }

      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Parse Python/requirements.txt dependencies
   */
  private async parsePythonDependencies(): Promise<Dependency[]> {
    const requirementsPath = path.join(this.projectRoot, "requirements.txt");

    if (!(await fs.pathExists(requirementsPath))) {
      return [];
    }

    try {
      const content = await fs.readFile(requirementsPath, "utf-8");
      const dependencies: Dependency[] = [];

      for (const line of content.split("\n")) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith("#")) continue;

        // Parse package==version or package>=version
        const match = trimmed.match(/^([a-zA-Z0-9-_]+)(==|>=|<=|~=|!=)(.+)$/);
        if (match) {
          dependencies.push({
            name: match[1],
            version: `${match[2]}${match[3]}`,
            isDev: false,
            manager: "pip",
            source: "requirements.txt",
          });
        }
      }

      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Parse Go/go.mod dependencies
   */
  private async parseGoDependencies(): Promise<Dependency[]> {
    const goModPath = path.join(this.projectRoot, "go.mod");

    if (!(await fs.pathExists(goModPath))) {
      return [];
    }

    try {
      const content = await fs.readFile(goModPath, "utf-8");
      const dependencies: Dependency[] = [];

      // Match "require" blocks
      const requireMatch = content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireMatch) {
        const lines = requireMatch[1].split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          // Match: module version
          const match = trimmed.match(/^([^\s]+)\s+v(.+)$/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: `v${match[2]}`,
              isDev: false,
              manager: "go",
              source: "go.mod",
            });
          }
        }
      }

      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Check version compatibility and detect issues
   */
  async checkCompatibility(
    changedFiles: string[]
  ): Promise<VersionCompatibilityResult> {
    const deprecations: DeprecationWarning[] = [];
    const conflicts: DependencyConflict[] = [];
    const outdated: VersionCompatibilityResult["outdated"] = [];

    // Get current dependencies
    const analysis = await this.analyzeDependencies();

    // Check for deprecated API usage in changed files
    for (const file of changedFiles) {
      const filePath = path.join(this.projectRoot, file);

      if (!(await fs.pathExists(filePath))) continue;

      const content = await fs.readFile(filePath, "utf-8");

      // Check each dependency for deprecated APIs
      for (const dep of analysis.dependencies) {
        if (this.deprecatedAPIs[dep.name]) {
          for (const deprecatedAPI of this.deprecatedAPIs[dep.name]) {
            const pattern = new RegExp(deprecatedAPI.pattern, "gm");
            let match;

            while ((match = pattern.exec(content)) !== null) {
              // Find line number
              const beforeMatch = content.substring(0, match.index);
              const lineNumber = beforeMatch.split("\n").length;

              deprecations.push({
                package: dep.name,
                api: deprecatedAPI.api,
                deprecatedIn: deprecatedAPI.deprecatedIn,
                removedIn: deprecatedAPI.removedIn,
                replacement: deprecatedAPI.replacement,
                message: `${deprecatedAPI.api} is deprecated since ${dep.name}@${deprecatedAPI.deprecatedIn}`,
                file,
                line: lineNumber,
              });
            }
          }
        }
      }
    }

    // Check for potential version conflicts (simplified)
    // In a real implementation, this would analyze the full dependency tree
    const versionMap = new Map<string, Dependency[]>();
    for (const dep of analysis.dependencies) {
      if (!versionMap.has(dep.name)) {
        versionMap.set(dep.name, []);
      }
      versionMap.get(dep.name)!.push(dep);
    }

    // Detect if same package required with different versions
    for (const [name, deps] of versionMap) {
      if (deps.length > 1) {
        const versions = new Set(deps.map((d) => d.version));
        if (versions.size > 1) {
          conflicts.push({
            package: name,
            conflicts: deps.map((d) => ({
              name: d.name,
              requiredVersion: d.version,
              currentVersion: d.installedVersion || d.version,
            })),
            severity: "warning",
            suggestion: "Align all dependencies to use the same version",
          });
        }
      }
    }

    return {
      isCompatible: deprecations.length === 0 && conflicts.length === 0,
      deprecations,
      conflicts,
      outdated,
    };
  }

  /**
   * Get specific dependency version
   */
  async getDependencyVersion(packageName: string): Promise<string | null> {
    const analysis = await this.analyzeDependencies();
    const dep = analysis.dependencies.find((d) => d.name === packageName);
    return dep ? dep.installedVersion || dep.version : null;
  }

  /**
   * Check if a package version satisfies a constraint
   */
  versionSatisfies(version: string, constraint: string): boolean {
    // Simplified version checking (in production, use semver library)
    try {
      // Remove common prefixes
      const cleanVersion = version.replace(/^[v^~]/, "");
      const cleanConstraint = constraint.replace(/^[v^~]/, "");

      // Basic exact match
      if (cleanVersion === cleanConstraint) return true;

      // Basic >= check
      if (constraint.startsWith(">=")) {
        const minVersion = constraint.replace(/^>=/, "");
        return this.compareVersions(cleanVersion, minVersion) >= 0;
      }

      // Basic ^ check (same major version)
      if (constraint.startsWith("^")) {
        const baseVersion = constraint.replace(/^\^/, "");
        const [vMajor] = cleanVersion.split(".");
        const [cMajor] = baseVersion.split(".");
        return vMajor === cMajor;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Compare two semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  /**
   * Get known deprecated APIs database
   */
  private getKnownDeprecations(): DeprecatedAPIsDatabase {
    return {
      // React deprecated APIs
      react: [
        {
          api: "componentWillMount",
          deprecatedIn: "16.3.0",
          removedIn: "17.0.0",
          replacement: "componentDidMount or constructor",
          pattern: "componentWillMount\\s*\\(",
        },
        {
          api: "componentWillReceiveProps",
          deprecatedIn: "16.3.0",
          removedIn: "17.0.0",
          replacement: "getDerivedStateFromProps",
          pattern: "componentWillReceiveProps\\s*\\(",
        },
        {
          api: "UNSAFE_componentWillMount",
          deprecatedIn: "16.9.0",
          removedIn: "17.0.0",
          replacement: "componentDidMount",
          pattern: "UNSAFE_componentWillMount\\s*\\(",
        },
      ],
      // Node.js deprecated APIs
      node: [
        {
          api: "require.extensions",
          deprecatedIn: "0.10.6",
          replacement: "Use build tools or loaders",
          pattern: "require\\.extensions",
        },
      ],
      // Express deprecated APIs
      express: [
        {
          api: "req.param()",
          deprecatedIn: "4.11.0",
          replacement: "req.params, req.query, or req.body",
          pattern: "req\\.param\\s*\\(",
        },
      ],
    };
  }

  /**
   * Get dependency suggestions for a new package
   */
  async suggestDependency(
    packageName: string,
    targetVersion?: string
  ): Promise<{
    compatible: boolean;
    suggestedVersion?: string;
    conflicts: string[];
    warnings: string[];
  }> {
    const analysis = await this.analyzeDependencies();

    const warnings: string[] = [];
    const conflicts: string[] = [];

    // Check if package already exists
    const existing = analysis.dependencies.find((d) => d.name === packageName);
    if (existing) {
      warnings.push(
        `Package ${packageName} is already installed at version ${existing.version}`
      );

      if (targetVersion && existing.version !== targetVersion) {
        warnings.push(
          `Requesting version ${targetVersion} but ${existing.version} is installed`
        );
      }
    }

    // In a real implementation, would check npm registry for:
    // - Latest version
    // - Peer dependency conflicts
    // - Known vulnerabilities

    return {
      compatible: conflicts.length === 0,
      suggestedVersion: targetVersion,
      conflicts,
      warnings,
    };
  }
}
