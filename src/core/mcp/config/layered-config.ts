/**
 * Layered Configuration System - Hierarchical configuration management
 *
 * This module implements a layered configuration system with:
 * - Global defaults
 * - User-specific settings
 * - Runtime overrides
 * - Environment-specific configurations
 */

import fs from "fs-extra";
import path from "path";
import { Logger } from "../types.js";

export interface ConfigLayer {
  name: string;
  priority: number; // Higher number = higher priority
  source: string;
  config: Record<string, any>;
  loaded: boolean;
  lastModified?: Date;
}

export interface LayeredConfigOptions {
  configDir?: string;
  enableEnvironmentOverrides?: boolean;
  enableRuntimeOverrides?: boolean;
  configFileName?: string;
  userConfigFileName?: string;
  environmentConfigFileName?: string;
}

export class LayeredConfigManager {
  private layers: Map<string, ConfigLayer> = new Map();
  private logger: Logger;
  private options: LayeredConfigOptions;
  private mergedConfig: Record<string, any> = {};
  private configWatchers: Map<string, fs.FSWatcher> = new Map();

  constructor(logger: Logger, options: LayeredConfigOptions = {}) {
    this.logger = logger;
    this.options = {
      configDir: this.getDefaultConfigDir(),
      enableEnvironmentOverrides: true,
      enableRuntimeOverrides: true,
      configFileName: "cortex-config.json",
      userConfigFileName: "user-config.json",
      environmentConfigFileName: "env-config.json",
      ...options,
    };

    this.initializeLayers();
  }

  /**
   * Load all configuration layers
   */
  async loadAllLayers(): Promise<Record<string, any>> {
    try {
      // Load layers in priority order (lowest to highest)
      const sortedLayers = Array.from(this.layers.values()).sort(
        (a, b) => a.priority - b.priority
      );

      for (const layer of sortedLayers) {
        await this.loadLayer(layer);
      }

      // Merge all layers
      this.mergedConfig = this.mergeLayers();

      this.logger.info(`Configuration loaded from ${this.layers.size} layers`);
      return this.mergedConfig;
    } catch (error) {
      this.logger.error(`Failed to load configuration layers: ${error}`);
      throw error;
    }
  }

  /**
   * Get merged configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.mergedConfig };
  }

  /**
   * Get configuration value with dot notation
   */
  getValue<T>(path: string): T | undefined {
    const keys = path.split(".");
    let current: any = this.mergedConfig;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Set configuration value with dot notation
   */
  setValue(path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current: any = this.mergedConfig;

    // Navigate to the parent object
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
    this.logger.debug(`Configuration value set: ${path} = ${value}`);
  }

  /**
   * Override configuration at runtime
   */
  setRuntimeOverride(path: string, value: any): void {
    if (!this.options.enableRuntimeOverrides) {
      throw new Error("Runtime overrides are disabled");
    }

    const runtimeLayer = this.layers.get("runtime");
    if (!runtimeLayer) {
      throw new Error("Runtime layer not initialized");
    }

    this.setNestedValue(runtimeLayer.config, path, value);
    this.mergedConfig = this.mergeLayers();

    this.logger.info(`Runtime override set: ${path} = ${value}`);
  }

  /**
   * Clear runtime overrides
   */
  clearRuntimeOverrides(): void {
    const runtimeLayer = this.layers.get("runtime");
    if (runtimeLayer) {
      runtimeLayer.config = {};
      this.mergedConfig = this.mergeLayers();
      this.logger.info("Runtime overrides cleared");
    }
  }

  /**
   * Reload a specific layer
   */
  async reloadLayer(layerName: string): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer '${layerName}' not found`);
    }

    await this.loadLayer(layer);
    this.mergedConfig = this.mergeLayers();
    this.logger.info(`Layer '${layerName}' reloaded`);
  }

  /**
   * Enable file watching for a layer
   */
  enableFileWatching(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer '${layerName}' not found`);
    }

    if (layer.source.startsWith("file://")) {
      const filePath = layer.source.replace("file://", "");
      this.watchConfigFile(layerName, filePath);
    }
  }

  /**
   * Get layer information
   */
  getLayerInfo(): Array<{
    name: string;
    priority: number;
    source: string;
    loaded: boolean;
    lastModified?: Date;
    configKeys: string[];
  }> {
    return Array.from(this.layers.values()).map((layer) => ({
      name: layer.name,
      priority: layer.priority,
      source: layer.source,
      loaded: layer.loaded,
      lastModified: layer.lastModified,
      configKeys: Object.keys(layer.config),
    }));
  }

  /**
   * Initialize configuration layers
   */
  private initializeLayers(): void {
    // Layer 1: Default configuration (lowest priority)
    this.layers.set("defaults", {
      name: "defaults",
      priority: 1,
      source: "built-in",
      config: this.getDefaultConfiguration(),
      loaded: true,
    });

    // Layer 2: Global configuration file
    const globalConfigPath = path.join(
      this.options.configDir!,
      this.options.configFileName!
    );
    this.layers.set("global", {
      name: "global",
      priority: 2,
      source: `file://${globalConfigPath}`,
      config: {},
      loaded: false,
    });

    // Layer 3: User-specific configuration
    const userConfigPath = path.join(
      this.options.configDir!,
      this.options.userConfigFileName!
    );
    this.layers.set("user", {
      name: "user",
      priority: 3,
      source: `file://${userConfigPath}`,
      config: {},
      loaded: false,
    });

    // Layer 4: Environment-specific configuration
    if (this.options.enableEnvironmentOverrides) {
      const envConfigPath = path.join(
        this.options.configDir!,
        this.options.environmentConfigFileName!
      );
      this.layers.set("environment", {
        name: "environment",
        priority: 4,
        source: `file://${envConfigPath}`,
        config: {},
        loaded: false,
      });
    }

    // Layer 5: Environment variables
    if (this.options.enableEnvironmentOverrides) {
      this.layers.set("env-vars", {
        name: "env-vars",
        priority: 5,
        source: "environment-variables",
        config: this.loadEnvironmentVariables(),
        loaded: true,
      });
    }

    // Layer 6: Runtime overrides (highest priority)
    if (this.options.enableRuntimeOverrides) {
      this.layers.set("runtime", {
        name: "runtime",
        priority: 6,
        source: "runtime",
        config: {},
        loaded: true,
      });
    }
  }

  /**
   * Load a specific configuration layer
   */
  private async loadLayer(layer: ConfigLayer): Promise<void> {
    try {
      if (layer.source.startsWith("file://")) {
        const filePath = layer.source.replace("file://", "");
        await this.loadConfigFromFile(layer, filePath);
      } else if (layer.source === "environment-variables") {
        // Already loaded in initializeLayers
        layer.loaded = true;
      } else if (layer.source === "built-in" || layer.source === "runtime") {
        // Already loaded
        layer.loaded = true;
      }

      this.logger.debug(`Layer '${layer.name}' loaded from ${layer.source}`);
    } catch (error) {
      this.logger.warn(`Failed to load layer '${layer.name}': ${error}`);
      // Continue with empty config for this layer
      layer.config = {};
      layer.loaded = true;
    }
  }

  /**
   * Load configuration from file
   */
  private async loadConfigFromFile(
    layer: ConfigLayer,
    filePath: string
  ): Promise<void> {
    if (await fs.pathExists(filePath)) {
      const configData = await fs.readJson(filePath);
      layer.config = configData;
      layer.loaded = true;

      // Update last modified time
      const stats = await fs.stat(filePath);
      layer.lastModified = stats.mtime;
    } else {
      // File doesn't exist, use empty config
      layer.config = {};
      layer.loaded = true;
    }
  }

  /**
   * Load environment variables
   */
  private loadEnvironmentVariables(): Record<string, any> {
    const envConfig: Record<string, any> = {};

    // Look for CORTEX_ prefixed environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("CORTEX_")) {
        const configKey = key
          .replace("CORTEX_", "")
          .toLowerCase()
          .replace(/_/g, ".");
        envConfig[configKey] = this.parseEnvironmentValue(value);
      }
    }

    return envConfig;
  }

  /**
   * Parse environment variable value
   */
  private parseEnvironmentValue(value: string | undefined): any {
    if (!value) return undefined;

    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Return as string
      return value;
    }
  }

  /**
   * Merge all configuration layers
   */
  private mergeLayers(): Record<string, any> {
    const sortedLayers = Array.from(this.layers.values())
      .filter((layer) => layer.loaded)
      .sort((a, b) => a.priority - b.priority);

    let merged: Record<string, any> = {};

    for (const layer of sortedLayers) {
      merged = this.deepMerge(merged, layer.config);
    }

    return merged;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Watch configuration file for changes
   */
  private watchConfigFile(layerName: string, filePath: string): void {
    if (this.configWatchers.has(layerName)) {
      return; // Already watching
    }

    try {
      const watcher = fs.watch(filePath, async (eventType) => {
        if (eventType === "change") {
          this.logger.info(`Configuration file changed: ${filePath}`);
          await this.reloadLayer(layerName);
        }
      });

      this.configWatchers.set(layerName, watcher);
      this.logger.debug(`Started watching config file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to watch config file ${filePath}: ${error}`);
    }
  }

  /**
   * Get default configuration directory
   */
  private getDefaultConfigDir(): string {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.cwd();
    return path.join(homeDir, ".cortex", "config");
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): Record<string, any> {
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
   * Cleanup resources
   */
  destroy(): void {
    // Close all file watchers
    for (const [layerName, watcher] of this.configWatchers) {
      watcher.close();
      this.logger.debug(`Stopped watching config file for layer: ${layerName}`);
    }
    this.configWatchers.clear();

    this.logger.info("Layered configuration manager destroyed");
  }
}
