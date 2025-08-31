/**
 * CLI-specific type definitions
 */

/**
 * Detected project commands from analysis
 */
export interface DetectedCommands {
  build?: string;
  dev?: string;
  test?: string;
  framework?: string;
}

/**
 * User preferences for project configuration
 */
export interface UserPreferences {
  language: "en" | "zh-TW" | "ja";
  buildCommand: string;
  devCommand: string;
  testCommand: string;
}

/**
 * Project configuration interface
 */
export interface ProjectConfig {
  preferences: UserPreferences;
}

/**
 * CLI initialization options
 */
export interface InitOptions {
  projectPath?: string;
  nonInteractive?: boolean;
}
