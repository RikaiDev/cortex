/**
 * Config Manager - Manages MCP server configuration
 *
 * This module handles configuration loading, validation, and hot-reloading
 */

import fs from "fs-extra";
import path from "path";
import { Logger } from "../types.js";

export interface ConfigSchema {
  server: {
    port?: number;
    timeout?: number;
    maxConnections?: number;
    enableMetrics?: boolean;
  };
  tools: {
    enabledTools?: string[];
    toolTimeout?: number;
    maxConcurrentTools?: number;
    cacheResults?: boolean;
  };
  security: {
    enableSandbox?: boolean;
    allowedOrigins?: string[];
    rateLimiting?: {
      requestsPerMinute?: number;
      burstLimit?: number;
    };
  };
  logging: {
    level?: "debug" | "info" | "warn" | "error";
    enableFileLogging?: boolean;
    logFile?: string;
  };
  [key: string]: unknown;
}

export interface ConfigManagerConfig {
  configPath?: string;
  enableHotReload?: boolean;
  validationStrict?: boolean;
}

export class ConfigManager {
  private config: ConfigSchema;
  private logger: Logger;
  private configPath: string;
  private configWatcher?: fs.FSWatcher;
  private configChangeListeners: Array<(config: ConfigSchema) => void> = [];

  constructor(logger: Logger, options: ConfigManagerConfig = {}) {
    this.logger = logger;
    this.configPath = options.configPath || this.getDefaultConfigPath();
    this.config = this.getDefaultConfig();

    if (options.enableHotReload) {
      this.enableHotReload();
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<ConfigSchema> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.config = this.mergeWithDefaults(configData);
        this.logger.info(`Configuration loaded from: ${this.configPath}`);
      } else {
        // Create default config file
        await this.saveConfig();
        this.logger.info(
          `Default configuration created at: ${this.configPath}`
        );
      }

      this.validateConfig();
      return this.config;
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error}`);
      throw new Error(`Configuration loading failed: ${error}`);
    }
  }

  /**
   * Save current configuration to file
   */
  async saveConfig(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      this.logger.debug(`Configuration saved to: ${this.configPath}`);
    } catch (error) {
      this.logger.error(`Failed to save configuration: ${error}`);
      throw new Error(`Configuration saving failed: ${error}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ConfigSchema {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ConfigSchema>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.validateConfig();
    this.notifyConfigChange();
    this.logger.info("Configuration updated");
  }

  /**
   * Get a specific configuration value
   */
  getValue<T>(path: string): T | undefined {
    const keys = path.split(".");
    let current: unknown = this.config;

    for (const key of keys) {
      if (
        current &&
        typeof current === "object" &&
        current !== null &&
        key in current
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Set a specific configuration value
   */
  setValue(path: string, value: unknown): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current: Record<string, unknown> = this.config as unknown as Record<
      string,
      unknown
    >;

    // Navigate to the parent object
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[lastKey] = value;
    this.validateConfig();
    this.notifyConfigChange();
    this.logger.debug(`Configuration value set: ${path} = ${value}`);
  }

  /**
   * Add configuration change listener
   */
  onConfigChange(listener: (config: ConfigSchema) => void): void {
    this.configChangeListeners.push(listener);
  }

  /**
   * Remove configuration change listener
   */
  removeConfigChangeListener(listener: (config: ConfigSchema) => void): void {
    const index = this.configChangeListeners.indexOf(listener);
    if (index > -1) {
      this.configChangeListeners.splice(index, 1);
    }
  }

  /**
   * Enable hot reload of configuration
   */
  private enableHotReload(): void {
    try {
      this.configWatcher = fs.watch(this.configPath, async (eventType) => {
        if (eventType === "change") {
          try {
            await this.loadConfig();
            this.logger.info("Configuration reloaded due to file change");
          } catch (error) {
            this.logger.error(`Failed to reload configuration: ${error}`);
          }
        }
      });
      this.logger.info("Configuration hot reload enabled");
    } catch (error) {
      this.logger.warn(`Failed to enable hot reload: ${error}`);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ConfigSchema {
    return {
      server: {
        port: 3000,
        timeout: 30000,
        maxConnections: 100,
        enableMetrics: true,
      },
      tools: {
        enabledTools: [
          "enhance-context",
          "record-experience",
          "create-workflow",
          "execute-workflow-role",
        ],
        toolTimeout: 30000,
        maxConcurrentTools: 5,
        cacheResults: true,
      },
      security: {
        enableSandbox: false,
        allowedOrigins: ["*"],
        rateLimiting: {
          requestsPerMinute: 60,
          burstLimit: 10,
        },
      },
      logging: {
        level: "info",
        enableFileLogging: false,
        logFile: "cortex-mcp.log",
      },
    };
  }

  /**
   * Get default configuration file path
   */
  private getDefaultConfigPath(): string {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.cwd();
    return path.join(homeDir, ".cortex", "mcp-config.json");
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(userConfig: unknown): ConfigSchema {
    const defaults = this.getDefaultConfig();
    return this.deepMerge(defaults, userConfig);
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: unknown, source: unknown): ConfigSchema {
    const targetObj = target as ConfigSchema;
    const sourceObj = source as ConfigSchema;
    const result = { ...targetObj };

    for (const key in sourceObj) {
      if (
        sourceObj[key] &&
        typeof sourceObj[key] === "object" &&
        !Array.isArray(sourceObj[key])
      ) {
        result[key] = this.deepMerge(targetObj[key] || {}, sourceObj[key]);
      } else {
        result[key] = sourceObj[key];
      }
    }

    return result;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    // Validate server configuration
    if (
      this.config.server.port &&
      (this.config.server.port < 1 || this.config.server.port > 65535)
    ) {
      throw new Error("Server port must be between 1 and 65535");
    }

    if (this.config.server.timeout && this.config.server.timeout < 1000) {
      throw new Error("Server timeout must be at least 1000ms");
    }

    // Validate tools configuration
    if (this.config.tools.toolTimeout && this.config.tools.toolTimeout < 1000) {
      throw new Error("Tool timeout must be at least 1000ms");
    }

    if (
      this.config.tools.maxConcurrentTools &&
      this.config.tools.maxConcurrentTools < 1
    ) {
      throw new Error("Max concurrent tools must be at least 1");
    }

    // Validate logging configuration
    const validLogLevels = ["debug", "info", "warn", "error"];
    if (
      this.config.logging.level &&
      !validLogLevels.includes(this.config.logging.level)
    ) {
      throw new Error(`Log level must be one of: ${validLogLevels.join(", ")}`);
    }

    this.logger.debug("Configuration validation passed");
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyConfigChange(): void {
    for (const listener of this.configChangeListeners) {
      try {
        listener(this.getConfig());
      } catch (error) {
        this.logger.error(`Configuration change listener error: ${error}`);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.configWatcher) {
      this.configWatcher.close();
    }
    this.configChangeListeners = [];
    this.logger.info("Config manager destroyed");
  }
}
