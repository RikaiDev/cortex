/**
 * Project Type Detector - Handles project type and framework detection
 *
 * This module provides functionality for detecting project types,
 * frameworks, and suggesting appropriate commands.
 */

import fs from "fs-extra";
import path from "path";

export interface ProjectTypeResult {
  type: "php" | "node" | "python" | "java" | "ruby" | "go" | "rust" | "unknown";
  isMultiLanguage?: boolean;
  languages?: string[];
  framework?: string;
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  confidence: number;
}

export class ProjectTypeDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect project type and framework
   */
  async detectProjectType(): Promise<ProjectTypeResult> {
    const indicators = await this.collectProjectIndicators();

    // Count detected project types
    const detectedTypes: { [key: string]: boolean } = {};

    // Check for each type
    if (indicators.includes("package.json")) {
      detectedTypes.node = true;
    }
    if (
      indicators.includes("requirements.txt") ||
      indicators.includes("setup.py") ||
      indicators.includes("pyproject.toml")
    ) {
      detectedTypes.python = true;
    }
    if (
      indicators.includes("pom.xml") ||
      indicators.includes("build.gradle") ||
      indicators.includes("build.gradle.kts")
    ) {
      detectedTypes.java = true;
    }
    if (indicators.includes("go.mod")) {
      detectedTypes.go = true;
    }
    if (indicators.includes("Cargo.toml")) {
      detectedTypes.rust = true;
    }
    if (
      indicators.includes("composer.json") ||
      indicators.some((indicator) => indicator.endsWith(".php"))
    ) {
      detectedTypes.php = true;
    }
    if (indicators.includes("Gemfile") || indicators.includes("Rakefile")) {
      detectedTypes.ruby = true;
    }

    const typeKeys = Object.keys(detectedTypes);
    const languages = typeKeys.map((type) => {
      switch (type) {
        case "node":
          return "JavaScript/TypeScript";
        case "python":
          return "Python";
        case "java":
          return "Java";
        case "go":
          return "Go";
        case "rust":
          return "Rust";
        case "php":
          return "PHP";
        case "ruby":
          return "Ruby";
        default:
          return type;
      }
    });

    // Multi-language project
    if (typeKeys.length > 1) {
      // Return the type with the most indicators, but mark as multi-language
      let primaryType = "unknown";
      let maxIndicators = 0;

      for (const [type, detected] of Object.entries(detectedTypes)) {
        if (detected) {
          const typeIndicators = this.getTypeIndicators(type);
          const matchingIndicators = indicators.filter((ind) =>
            typeIndicators.includes(ind)
          ).length;
          if (matchingIndicators > maxIndicators) {
            maxIndicators = matchingIndicators;
            primaryType = type;
          }
        }
      }

      const framework = await this.detectFramework(primaryType);
      const commands = this.getCommandsForType(primaryType);

      return {
        type: primaryType as ProjectTypeResult["type"],
        isMultiLanguage: true,
        languages,
        framework,
        ...commands,
        confidence: 0.7, // Lower confidence for multi-language projects
      };
    }

    // Single language project - return first detected type
    if (typeKeys.length === 1) {
      const type = typeKeys[0];
      const framework = await this.detectFramework(type);
      const commands = this.getCommandsForType(type);

      return {
        type: type as ProjectTypeResult["type"],
        isMultiLanguage: false,
        languages: [languages[0]],
        framework,
        ...commands,
        confidence: type === "node" ? 0.9 : 0.8,
      };
    }

    return {
      type: "unknown",
      confidence: 0,
    };
  }

  /**
   * Collect project indicators (files that help identify project type)
   */
  private async collectProjectIndicators(): Promise<string[]> {
    const indicators: string[] = [];
    const possibleIndicators = [
      "package.json",
      "requirements.txt",
      "setup.py",
      "pyproject.toml",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "go.mod",
      "Cargo.toml",
      "composer.json",
      "Gemfile",
      "Rakefile",
    ];

    // Recursively search for indicators
    function findIndicatorsRecursively(
      currentPath: string,
      depth: number = 0
    ): void {
      if (depth > 4) return; // Limit depth

      try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);

          if (
            stat.isDirectory() &&
            !["node_modules", ".git", ".venv", "__pycache__"].includes(item)
          ) {
            findIndicatorsRecursively(fullPath, depth + 1);
          } else if (stat.isFile() && possibleIndicators.includes(item)) {
            if (!indicators.includes(item)) {
              indicators.push(item);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    findIndicatorsRecursively(this.projectRoot);

    // Also check for common file extensions
    try {
      const findExtensionsRecursively = (
        currentPath: string,
        depth: number = 0
      ): string[] => {
        if (depth > 4) return [];

        const extensions: string[] = [];

        try {
          const items = fs.readdirSync(currentPath);

          for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            if (
              stat.isDirectory() &&
              !["node_modules", ".git", ".venv", "__pycache__"].includes(item)
            ) {
              extensions.push(
                ...findExtensionsRecursively(fullPath, depth + 1)
              );
            } else if (stat.isFile()) {
              const ext = path.extname(item);
              if (ext && !extensions.includes(ext)) {
                extensions.push(ext);
              }
            }
          }
        } catch (error) {
          // Ignore permission errors
        }

        return extensions;
      };

      const allExtensions = findExtensionsRecursively(this.projectRoot);
      if (allExtensions.includes(".php")) {
        indicators.push("*.php");
      }
    } catch (error) {
      // Ignore errors when reading directory
    }

    return indicators;
  }

  /**
   * Detect specific framework for a given project type
   */
  private async detectFramework(
    projectType: string
  ): Promise<string | undefined> {
    try {
      switch (projectType) {
        case "node":
          return await this.detectNodeFramework();
        case "python":
          return await this.detectPythonFramework();
        case "java":
          return await this.detectJavaFramework();
        case "php":
          return await this.detectPhpFramework();
        case "ruby":
          return await this.detectRubyFramework();
        default:
          return undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Detect Node.js framework
   */
  private async detectNodeFramework(): Promise<string | undefined> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return undefined;
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // React detection
      if (dependencies.react || dependencies["react-dom"]) {
        if (dependencies.next) return "next";
        if (dependencies["@remix-run/react"]) return "remix";
        if (dependencies.gatsby) return "gatsby";
        return "react";
      }

      // Vue detection
      if (dependencies.vue || dependencies.nuxt) {
        return dependencies.nuxt ? "nuxt" : "vue";
      }

      // Angular detection
      if (dependencies["@angular/core"]) {
        return "angular";
      }

      // Express detection
      if (dependencies.express) {
        return "express";
      }

      // NestJS detection
      if (dependencies["@nestjs/core"]) {
        return "nestjs";
      }

      return "vanilla";
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Detect Python framework
   */
  private async detectPythonFramework(): Promise<string | undefined> {
    const requirementsPath = path.join(this.projectRoot, "requirements.txt");

    if (await fs.pathExists(requirementsPath)) {
      try {
        const requirements = await fs.readFile(requirementsPath, "utf-8");

        if (requirements.includes("django")) return "django";
        if (requirements.includes("flask")) return "flask";
        if (requirements.includes("fastapi")) return "fastapi";
      } catch (error) {
        // Ignore errors
      }
    }

    return "vanilla";
  }

  /**
   * Detect Java framework
   */
  private async detectJavaFramework(): Promise<string | undefined> {
    const pomPath = path.join(this.projectRoot, "pom.xml");

    if (await fs.pathExists(pomPath)) {
      try {
        const pom = await fs.readFile(pomPath, "utf-8");

        if (pom.includes("spring-boot")) return "spring-boot";
        if (pom.includes("quarkus")) return "quarkus";
        if (pom.includes("micronaut")) return "micronaut";
      } catch (error) {
        // Ignore errors
      }
    }

    return "vanilla";
  }

  /**
   * Detect PHP framework
   */
  private async detectPhpFramework(): Promise<string | undefined> {
    const composerPath = path.join(this.projectRoot, "composer.json");

    if (await fs.pathExists(composerPath)) {
      try {
        const composer = await fs.readJson(composerPath);
        const require = composer.require || {};

        if (require["laravel/framework"]) return "laravel";
        if (require["symfony/symfony"]) return "symfony";
        if (require.codeigniter) return "codeigniter";
      } catch (error) {
        // Ignore errors
      }
    }

    return "vanilla";
  }

  /**
   * Detect Ruby framework
   */
  private async detectRubyFramework(): Promise<string | undefined> {
    const gemfilePath = path.join(this.projectRoot, "Gemfile");

    if (await fs.pathExists(gemfilePath)) {
      try {
        const gemfile = await fs.readFile(gemfilePath, "utf-8");

        if (gemfile.includes("rails")) return "rails";
        if (gemfile.includes("sinatra")) return "sinatra";
      } catch (error) {
        // Ignore errors
      }
    }

    return "vanilla";
  }

  /**
   * Suggest Node.js commands
   */
  private suggestNodeCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "npm run build",
      devCommand: "npm run dev",
      testCommand: "npm run test",
    };
  }

  /**
   * Suggest Python commands
   */
  private suggestPythonCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "python setup.py build",
      devCommand:
        "python -m venv venv && source venv/bin/activate && pip install -r requirements.txt",
      testCommand: "python -m pytest",
    };
  }

  /**
   * Suggest Java commands
   */
  private suggestJavaCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    const hasGradle =
      fs.pathExistsSync(path.join(this.projectRoot, "build.gradle")) ||
      fs.pathExistsSync(path.join(this.projectRoot, "build.gradle.kts"));
    const hasMaven = fs.pathExistsSync(path.join(this.projectRoot, "pom.xml"));

    if (hasGradle) {
      return {
        buildCommand: "./gradlew build",
        devCommand: "./gradlew bootRun",
        testCommand: "./gradlew test",
      };
    } else if (hasMaven) {
      return {
        buildCommand: "mvn clean compile",
        devCommand: "mvn spring-boot:run",
        testCommand: "mvn test",
      };
    }

    return {};
  }

  /**
   * Suggest Go commands
   */
  private suggestGoCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "go build",
      devCommand: "go run .",
      testCommand: "go test",
    };
  }

  /**
   * Suggest Rust commands
   */
  private suggestRustCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "cargo build --release",
      devCommand: "cargo run",
      testCommand: "cargo test",
    };
  }

  /**
   * Suggest PHP commands
   */
  private suggestPhpCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "composer install",
      devCommand: "php -S localhost:8000",
      testCommand: "php artisan test",
    };
  }

  /**
   * Suggest Ruby commands
   */
  private suggestRubyCommands(): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    return {
      buildCommand: "bundle install",
      devCommand: "rails server",
      testCommand: "rails test",
    };
  }

  /**
   * Get indicators for a specific type
   */
  private getTypeIndicators(type: string): string[] {
    switch (type) {
      case "node":
        return ["package.json", "yarn.lock", "pnpm-lock.yaml"];
      case "python":
        return ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"];
      case "java":
        return ["pom.xml", "build.gradle", "build.gradle.kts"];
      case "go":
        return ["go.mod", "go.sum"];
      case "rust":
        return ["Cargo.toml", "Cargo.lock"];
      case "php":
        return ["composer.json"];
      case "ruby":
        return ["Gemfile", "Rakefile"];
      default:
        return [];
    }
  }

  /**
   * Get commands for a specific type
   */
  private getCommandsForType(type: string): {
    buildCommand?: string;
    devCommand?: string;
    testCommand?: string;
  } {
    switch (type) {
      case "node":
        return this.suggestNodeCommands();
      case "python":
        return this.suggestPythonCommands();
      case "java":
        return this.suggestJavaCommands();
      case "go":
        return this.suggestGoCommands();
      case "rust":
        return this.suggestRustCommands();
      case "php":
        return this.suggestPhpCommands();
      case "ruby":
        return this.suggestRubyCommands();
      default:
        return {};
    }
  }
}
