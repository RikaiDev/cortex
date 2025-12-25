/**
 * Environment Service
 *
 * Manages environment profiles and validates code compatibility
 * across different runtime environments (production, CI, local, etc.)
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  EnvironmentProfile,
  EnvironmentConfig,
  EnvironmentCheckResult,
  EnvironmentWarning,
  AutoDetectionResult,
} from "../types/environment.js";

export class EnvironmentService {
  private configPath: string;

  constructor(private projectRoot: string) {
    this.configPath = path.join(projectRoot, ".cortex", "environments.json");
  }

  /**
   * Load environment configuration
   */
  async loadConfig(): Promise<EnvironmentConfig> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        // Return default local environment
        return {
          activeEnvironment: "local",
          environments: [
            {
              name: "local",
              description: "Local development environment",
              isDefault: true,
              source: "manual",
            },
          ],
        };
      }

      const config: EnvironmentConfig = await fs.readJson(this.configPath);
      return config;
    } catch (error) {
      console.error("Failed to load environment config:", error);
      return {
        activeEnvironment: "local",
        environments: [
          {
            name: "local",
            description: "Local development environment",
            isDefault: true,
            source: "manual",
          },
        ],
      };
    }
  }

  /**
   * Save environment configuration
   */
  async saveConfig(config: EnvironmentConfig): Promise<void> {
    const cortexDir = path.dirname(this.configPath);
    await fs.ensureDir(cortexDir);
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  /**
   * Auto-detect environments from project files
   */
  async autoDetect(): Promise<AutoDetectionResult> {
    const environments: EnvironmentProfile[] = [];
    const sources: AutoDetectionResult["sources"] = [];

    // 1. Detect from package.json
    const packageJsonEnv = await this.detectFromPackageJson();
    if (packageJsonEnv) {
      environments.push(packageJsonEnv);
      sources.push({
        file: "package.json",
        type: "package-json",
        detectedConstraints: [
          packageJsonEnv.runtime?.node
            ? `Node ${packageJsonEnv.runtime.node}`
            : "",
        ].filter(Boolean),
      });
    }

    // 2. Detect from Dockerfile
    const dockerEnv = await this.detectFromDockerfile();
    if (dockerEnv) {
      environments.push(dockerEnv);
      sources.push({
        file: "Dockerfile",
        type: "dockerfile",
        detectedConstraints: [
          "Docker container",
          dockerEnv.container?.workDir || "",
        ].filter(Boolean),
      });
    }

    // 3. Detect from GitHub Actions
    const ciEnv = await this.detectFromGitHubActions();
    if (ciEnv) {
      environments.push(ciEnv);
      sources.push({
        file: ".github/workflows/*.yml",
        type: "ci",
        detectedConstraints: [ciEnv.container?.isDocker ? "Docker" : ""].filter(
          Boolean
        ),
      });
    }

    // 4. Detect from deployment configs (Vercel, Netlify, etc.)
    const deploymentEnv = await this.detectFromDeploymentConfigs();
    if (deploymentEnv) {
      environments.push(deploymentEnv);
      sources.push({
        file: "vercel.json or netlify.toml",
        type: "deployment-config",
        detectedConstraints: ["Serverless"],
      });
    }

    return { environments, sources };
  }

  /**
   * Detect environment from package.json
   */
  private async detectFromPackageJson(): Promise<EnvironmentProfile | null> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);

      const env: EnvironmentProfile = {
        name: "local",
        description: "Local development (from package.json)",
        source: "auto-detected",
        runtime: {},
      };

      // Check engines field
      if (packageJson.engines) {
        if (packageJson.engines.node) {
          env.runtime!.node = packageJson.engines.node;
        }
        if (packageJson.engines.npm) {
          env.runtime!.npm = packageJson.engines.npm;
        }
      }

      return env.runtime && Object.keys(env.runtime).length > 0 ? env : null;
    } catch {
      return null;
    }
  }

  /**
   * Detect environment from Dockerfile
   */
  private async detectFromDockerfile(): Promise<EnvironmentProfile | null> {
    const dockerfilePath = path.join(this.projectRoot, "Dockerfile");

    if (!(await fs.pathExists(dockerfilePath))) {
      return null;
    }

    try {
      const content = await fs.readFile(dockerfilePath, "utf-8");

      const env: EnvironmentProfile = {
        name: "production",
        description: "Production Docker container (from Dockerfile)",
        source: "auto-detected",
        container: {
          isDocker: true,
        },
        runtime: {},
      };

      // Extract Node version from FROM directive
      const fromMatch = content.match(/FROM\s+node:(\S+)/i);
      if (fromMatch) {
        env.runtime!.node = fromMatch[1];
      }

      // Extract Python version
      const pythonMatch = content.match(/FROM\s+python:(\S+)/i);
      if (pythonMatch) {
        env.runtime!.python = pythonMatch[1];
      }

      // Extract WORKDIR
      const workdirMatch = content.match(/WORKDIR\s+(\S+)/i);
      if (workdirMatch) {
        env.container!.workDir = workdirMatch[1];
      }

      // Extract USER
      const userMatch = content.match(/USER\s+(\S+)/i);
      if (userMatch) {
        env.container!.user = userMatch[1];
      }

      return env;
    } catch {
      return null;
    }
  }

  /**
   * Detect environment from GitHub Actions
   */
  private async detectFromGitHubActions(): Promise<EnvironmentProfile | null> {
    const workflowsDir = path.join(this.projectRoot, ".github", "workflows");

    if (!(await fs.pathExists(workflowsDir))) {
      return null;
    }

    try {
      const files = await fs.readdir(workflowsDir);
      const ymlFiles = files.filter(
        (f) => f.endsWith(".yml") || f.endsWith(".yaml")
      );

      if (ymlFiles.length === 0) {
        return null;
      }

      // Read first workflow file for basic detection
      const content = await fs.readFile(
        path.join(workflowsDir, ymlFiles[0]),
        "utf-8"
      );

      const env: EnvironmentProfile = {
        name: "ci",
        description: "CI environment (from GitHub Actions)",
        source: "auto-detected",
        container: {
          isDocker: content.includes("container:"),
          pathPrefix: "/github/workspace",
        },
        runtime: {},
      };

      // Try to detect Node version from setup-node
      const nodeMatch = content.match(/node-version:\s*['"]?(\S+?)['"]?\s*$/m);
      if (nodeMatch) {
        env.runtime!.node = nodeMatch[1];
      }

      return env;
    } catch {
      return null;
    }
  }

  /**
   * Detect from deployment configs (Vercel, Netlify, etc.)
   */
  private async detectFromDeploymentConfigs(): Promise<EnvironmentProfile | null> {
    // Check Vercel
    const vercelPath = path.join(this.projectRoot, "vercel.json");
    if (await fs.pathExists(vercelPath)) {
      try {
        const config = await fs.readJson(vercelPath);

        return {
          name: "production",
          description: "Vercel serverless deployment",
          source: "auto-detected",
          runtime: {
            node: config.functions?.["**"]?.runtime || "nodejs18.x",
          },
          fileSystem: {
            readOnlyPaths: ["/"],
            tempDir: "/tmp",
            maxFileSize: 50 * 1024 * 1024, // 50MB
          },
          constraints: [
            "Serverless function (10s timeout)",
            "Read-only filesystem except /tmp",
          ],
        };
      } catch {
        // Ignore parse errors
      }
    }

    // Check Netlify
    const netlifyPath = path.join(this.projectRoot, "netlify.toml");
    if (await fs.pathExists(netlifyPath)) {
      return {
        name: "production",
        description: "Netlify serverless deployment",
        source: "auto-detected",
        fileSystem: {
          readOnlyPaths: ["/"],
          tempDir: "/tmp",
        },
        constraints: ["Serverless function", "Read-only filesystem"],
      };
    }

    return null;
  }

  /**
   * Check code compatibility with environment profiles
   */
  async checkCompatibility(
    changedFiles: string[]
  ): Promise<EnvironmentCheckResult> {
    const config = await this.loadConfig();
    const warnings: EnvironmentWarning[] = [];

    for (const file of changedFiles) {
      const filePath = path.join(this.projectRoot, file);

      if (!(await fs.pathExists(filePath))) {
        continue;
      }

      const content = await fs.readFile(filePath, "utf-8");

      // Check each environment
      for (const env of config.environments) {
        // Check for environment variable usage
        if (env.envVars?.missing) {
          for (const missingVar of env.envVars.missing) {
            if (content.includes(`process.env.${missingVar}`)) {
              warnings.push({
                environment: env.name,
                type: "env-var",
                severity: "error",
                message: `Environment variable '${missingVar}' is not available in ${env.name}`,
                location: { file },
                suggestion: `Add fallback value or remove usage in ${env.name}`,
              });
            }
          }
        }

        // Check for file system writes to read-only paths
        if (env.fileSystem?.readOnlyPaths) {
          for (const readOnlyPath of env.fileSystem.readOnlyPaths) {
            const fsWritePattern = new RegExp(
              `fs\\.(write|append|create).*['"\`]${readOnlyPath}`,
              "i"
            );
            if (fsWritePattern.test(content)) {
              warnings.push({
                environment: env.name,
                type: "file-system",
                severity: "error",
                message: `Attempting to write to read-only path '${readOnlyPath}' in ${env.name}`,
                location: { file },
                suggestion: `Use ${env.fileSystem.tempDir || "/tmp"} for temporary files`,
              });
            }
          }
        }

        // Check for syntax that may not be supported by runtime version
        if (env.runtime?.node) {
          const nodeVersion = this.parseVersion(env.runtime.node);

          // Check for optional chaining (Node 14+)
          if (nodeVersion < 14 && content.includes("?.")) {
            warnings.push({
              environment: env.name,
              type: "syntax",
              severity: "warning",
              message: `Optional chaining (?.) requires Node 14+, but ${env.name} uses Node ${env.runtime.node}`,
              location: { file },
              suggestion:
                "Use traditional null checking or upgrade Node version",
            });
          }

          // Check for top-level await (Node 14.8+)
          if (nodeVersion < 14.8 && /^await\s/m.test(content)) {
            warnings.push({
              environment: env.name,
              type: "syntax",
              severity: "error",
              message: `Top-level await requires Node 14.8+, but ${env.name} uses Node ${env.runtime.node}`,
              location: { file },
              suggestion: "Wrap in async function or upgrade Node version",
            });
          }
        }
      }
    }

    return {
      isCompatible: warnings.filter((w) => w.severity === "error").length === 0,
      warnings,
      environments: config.environments.map((e) => e.name),
    };
  }

  /**
   * Parse version string to number (e.g., "18.x" -> 18)
   */
  private parseVersion(version: string): number {
    const match = version.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Add or update environment profile
   */
  async upsertEnvironment(profile: EnvironmentProfile): Promise<void> {
    const config = await this.loadConfig();

    const existingIndex = config.environments.findIndex(
      (e) => e.name === profile.name
    );

    if (existingIndex >= 0) {
      config.environments[existingIndex] = profile;
    } else {
      config.environments.push(profile);
    }

    await this.saveConfig(config);
  }

  /**
   * Remove environment profile
   */
  async removeEnvironment(name: string): Promise<void> {
    const config = await this.loadConfig();
    config.environments = config.environments.filter((e) => e.name !== name);
    await this.saveConfig(config);
  }

  /**
   * Get specific environment profile
   */
  async getEnvironment(name: string): Promise<EnvironmentProfile | null> {
    const config = await this.loadConfig();
    return config.environments.find((e) => e.name === name) || null;
  }

  /**
   * List all environments
   */
  async listEnvironments(): Promise<EnvironmentProfile[]> {
    const config = await this.loadConfig();
    return config.environments;
  }
}
