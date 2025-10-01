/**
 * Dependency Injection Container - Manages module dependencies and lifecycle
 *
 * This module provides a simple dependency injection system for MCP modules
 */

import { Logger } from "./types.js";

export interface ServiceDefinition<T = unknown> {
  name: string;
  factory: (container: DIContainer) => T;
  singleton?: boolean;
  dependencies?: string[];
}

export interface ServiceInstance<T = unknown> {
  instance?: T;
  definition: ServiceDefinition<T>;
  initialized: boolean;
}

export class DIContainer {
  private services: Map<string, ServiceInstance> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a service definition
   */
  register<T>(definition: ServiceDefinition<T>): void {
    if (this.services.has(definition.name)) {
      throw new Error(`Service '${definition.name}' is already registered`);
    }

    this.services.set(definition.name, {
      definition,
      initialized: false,
    });

    this.logger.debug(`Service registered: ${definition.name}`);
  }

  /**
   * Register multiple services
   */
  registerServices(definitions: ServiceDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' is not registered`);
    }

    // Return existing instance if singleton
    if (service.definition.singleton && service.instance) {
      return service.instance as T;
    }

    // Create new instance
    if (!service.initialized) {
      service.instance = this.createInstance(service.definition);
      service.initialized = true;
    }

    return service.instance as T;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a service instance with dependency resolution
   */
  private createInstance<T>(definition: ServiceDefinition<T>): T {
    try {
      // Resolve dependencies
      const dependencies: unknown[] = [];
      if (definition.dependencies) {
        for (const depName of definition.dependencies) {
          dependencies.push(this.get(depName));
        }
      }

      // Create instance using factory
      const instance = definition.factory(this);

      this.logger.debug(`Service instance created: ${definition.name}`);
      return instance;
    } catch (error) {
      this.logger.error(
        `Failed to create service instance '${definition.name}': ${error}`
      );
      throw new Error(
        `Service instantiation failed for '${definition.name}': ${error}`
      );
    }
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.logger.debug("All services cleared");
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalServices: number;
    initializedServices: number;
    singletonServices: number;
  } {
    const services = Array.from(this.services.values());

    return {
      totalServices: services.length,
      initializedServices: services.filter((s) => s.initialized).length,
      singletonServices: services.filter((s) => s.definition.singleton).length,
    };
  }
}

/**
 * Service factory for common MCP services
 */
export class MCPServiceFactory {
  /**
   * Create default MCP services
   */
  static createDefaultServices(logger: Logger): ServiceDefinition[] {
    return [
      {
        name: "logger",
        factory: () => logger,
        singleton: true,
      },
      {
        name: "toolManager",
        factory: async (container): Promise<unknown> => {
          const logger = container.get<Logger>("logger");
          const { ToolManager } = await import("./modules/tool-manager.js");
          return new ToolManager(logger);
        },
        singleton: true,
        dependencies: ["logger"],
      },
      {
        name: "sessionManager",
        factory: async (container): Promise<unknown> => {
          const logger = container.get<Logger>("logger");
          const { SessionManager } = await import(
            "./modules/session-manager.js"
          );
          return new SessionManager(logger);
        },
        singleton: true,
        dependencies: ["logger"],
      },
      {
        name: "configManager",
        factory: async (container): Promise<unknown> => {
          const logger = container.get<Logger>("logger");
          const { ConfigManager } = await import("./modules/config-manager.js");
          return new ConfigManager(logger);
        },
        singleton: true,
        dependencies: ["logger"],
      },
      {
        name: "performanceMonitor",
        factory: async (container): Promise<unknown> => {
          const logger = container.get<Logger>("logger");
          const { PerformanceMonitor } = await import(
            "./modules/performance-monitor.js"
          );
          return new PerformanceMonitor(logger);
        },
        singleton: true,
        dependencies: ["logger"],
      },
    ];
  }

  /**
   * Create custom service definition
   */
  static createService<T>(
    name: string,
    factory: (container: DIContainer) => T,
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): ServiceDefinition<T> {
    return {
      name,
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies,
    };
  }
}

/**
 * Service locator pattern implementation
 */
export class ServiceLocator {
  private static container: DIContainer | null = null;

  /**
   * Initialize the service locator with a container
   */
  static initialize(container: DIContainer): void {
    ServiceLocator.container = container;
  }

  /**
   * Get a service from the global container
   */
  static get<T>(name: string): T {
    if (!ServiceLocator.container) {
      throw new Error(
        "ServiceLocator not initialized. Call ServiceLocator.initialize() first."
      );
    }
    return ServiceLocator.container.get<T>(name);
  }

  /**
   * Check if a service exists
   */
  static has(name: string): boolean {
    if (!ServiceLocator.container) {
      return false;
    }
    return ServiceLocator.container.has(name);
  }

  /**
   * Clear the global container
   */
  static clear(): void {
    ServiceLocator.container = null;
  }
}
