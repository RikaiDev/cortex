/**
 * Command Suggester - Handles command suggestion logic
 *
 * This module provides functionality for suggesting appropriate
 * build, development, and test commands based on project analysis.
 */

import fs from "fs-extra";
import path from "path";

export interface CommandSuggestions {
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  confidence: number;
}

export class CommandSuggester {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Suggest build command
   */
  async suggestBuildCommand(
    projectType: string,
    framework?: string
  ): Promise<string | undefined> {
    switch (projectType) {
      case "node":
        return await this.suggestNodeBuildCommand(framework);
      case "python":
        return await this.suggestPythonBuildCommand();
      case "java":
        return await this.suggestJavaBuildCommand();
      case "go":
        return "go build";
      case "rust":
        return "cargo build --release";
      case "php":
        return "composer install --no-dev --optimize-autoloader";
      case "ruby":
        return "bundle install --deployment";
      default:
        return undefined;
    }
  }

  /**
   * Suggest development command
   */
  async suggestDevCommand(
    projectType: string,
    framework?: string
  ): Promise<string | undefined> {
    switch (projectType) {
      case "node":
        return await this.suggestNodeDevCommand(framework);
      case "python":
        return await this.suggestPythonDevCommand();
      case "java":
        return await this.suggestJavaDevCommand();
      case "go":
        return "go run .";
      case "rust":
        return "cargo run";
      case "php":
        return "php -S localhost:8000";
      case "ruby":
        return await this.suggestRubyDevCommand(framework);
      default:
        return undefined;
    }
  }

  /**
   * Suggest test command
   */
  async suggestTestCommand(
    projectType: string,
    framework?: string
  ): Promise<string | undefined> {
    switch (projectType) {
      case "node":
        return await this.suggestNodeTestCommand();
      case "python":
        return "python -m pytest";
      case "java":
        return await this.suggestJavaTestCommand();
      case "go":
        return "go test";
      case "rust":
        return "cargo test";
      case "php":
        return await this.suggestPhpTestCommand(framework);
      case "ruby":
        return await this.suggestRubyTestCommand(framework);
      default:
        return undefined;
    }
  }

  /**
   * Suggest Node.js build command
   */
  private async suggestNodeBuildCommand(
    framework?: string
  ): Promise<string | undefined> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return "npm run build";
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const scripts = packageJson.scripts || {};

      if (scripts.build) {
        return "npm run build";
      }

      if (scripts.compile) {
        return "npm run compile";
      }

      // Framework-specific builds
      if (framework === "next") {
        return "npm run build";
      }

      if (framework === "vue" || framework === "nuxt") {
        return "npm run build";
      }

      return "npm run build";
    } catch (error) {
      return "npm run build";
    }
  }

  /**
   * Suggest Node.js development command
   */
  private async suggestNodeDevCommand(
    framework?: string
  ): Promise<string | undefined> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return "npm run dev";
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const scripts = packageJson.scripts || {};

      if (scripts.dev) {
        return "npm run dev";
      }

      if (scripts.start) {
        return "npm start";
      }

      // Framework-specific dev commands
      if (framework === "next") {
        return "npm run dev";
      }

      if (framework === "vue") {
        return "npm run serve";
      }

      if (framework === "nuxt") {
        return "npm run dev";
      }

      return "npm run dev";
    } catch (error) {
      return "npm run dev";
    }
  }

  /**
   * Suggest Node.js test command
   */
  private async suggestNodeTestCommand(): Promise<string | undefined> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return "npm test";
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const scripts = packageJson.scripts || {};

      if (scripts.test) {
        return "npm test";
      }

      return "npm test";
    } catch (error) {
      return "npm test";
    }
  }

  /**
   * Suggest Python build command
   */
  private async suggestPythonBuildCommand(): Promise<string | undefined> {
    if (await fs.pathExists(path.join(this.projectRoot, "setup.py"))) {
      return "python setup.py build";
    }

    if (await fs.pathExists(path.join(this.projectRoot, "pyproject.toml"))) {
      return "pip install -e .";
    }

    return undefined;
  }

  /**
   * Suggest Python development command
   */
  private async suggestPythonDevCommand(): Promise<string | undefined> {
    const venvPath = path.join(this.projectRoot, "venv");
    const hasVenv = await fs.pathExists(venvPath);

    if (hasVenv) {
      return "source venv/bin/activate && pip install -r requirements.txt && python main.py";
    }

    return "pip install -r requirements.txt && python main.py";
  }

  /**
   * Suggest Java build command
   */
  private async suggestJavaBuildCommand(): Promise<string | undefined> {
    if (await fs.pathExists(path.join(this.projectRoot, "pom.xml"))) {
      return "mvn clean compile";
    }

    if (
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle"))) ||
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle.kts")))
    ) {
      return "./gradlew build";
    }

    return undefined;
  }

  /**
   * Suggest Java development command
   */
  private async suggestJavaDevCommand(): Promise<string | undefined> {
    if (await fs.pathExists(path.join(this.projectRoot, "pom.xml"))) {
      // Check if it's a Spring Boot project
      try {
        const pom = await fs.readFile(
          path.join(this.projectRoot, "pom.xml"),
          "utf-8"
        );
        if (pom.includes("spring-boot")) {
          return "mvn spring-boot:run";
        }
      } catch (error) {
        // Ignore
      }
      return "mvn exec:java";
    }

    if (
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle"))) ||
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle.kts")))
    ) {
      return "./gradlew bootRun";
    }

    return undefined;
  }

  /**
   * Suggest Java test command
   */
  private async suggestJavaTestCommand(): Promise<string | undefined> {
    if (await fs.pathExists(path.join(this.projectRoot, "pom.xml"))) {
      return "mvn test";
    }

    if (
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle"))) ||
      (await fs.pathExists(path.join(this.projectRoot, "build.gradle.kts")))
    ) {
      return "./gradlew test";
    }

    return undefined;
  }

  /**
   * Suggest PHP test command
   */
  private async suggestPhpTestCommand(
    framework?: string
  ): Promise<string | undefined> {
    if (framework === "laravel") {
      return "php artisan test";
    }

    return "phpunit";
  }

  /**
   * Suggest Ruby development command
   */
  private async suggestRubyDevCommand(
    framework?: string
  ): Promise<string | undefined> {
    if (framework === "rails") {
      return "rails server";
    }

    return "ruby app.rb";
  }

  /**
   * Suggest Ruby test command
   */
  private async suggestRubyTestCommand(
    framework?: string
  ): Promise<string | undefined> {
    if (framework === "rails") {
      return "rails test";
    }

    return "rspec";
  }

  /**
   * Calculate confidence score for command suggestions
   */
  calculateConfidence(projectType: string, framework?: string): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for well-known frameworks
    if (framework) {
      confidence += 0.2;
    }

    // Higher confidence for mainstream languages
    if (["node", "python", "java", "go", "rust"].includes(projectType)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }
}
