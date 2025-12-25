/**
 * Schema Generator
 *
 * Utilities for generating JSON schemas from TypeScript types
 * This is a placeholder for future enhancement using TypeScript Compiler API
 */

/**
 * Schema property definition
 */
export interface SchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  items?: {
    type: string;
    properties?: Record<string, unknown>;
  };
  properties?: Record<string, SchemaProperty>;
}

/**
 * Tool input schema builder
 *
 * Helper for manually constructing schemas until we implement
 * automatic extraction from TypeScript types
 */
export class SchemaBuilder {
  private properties: Record<string, unknown> = {};
  private requiredFields: string[] = [];

  addProperty(
    name: string,
    options: {
      type: "string" | "number" | "boolean" | "array" | "object";
      description: string;
      required?: boolean;
      default?: unknown;
      enum?: unknown[];
      items?: unknown;
    }
  ): this {
    const property: Record<string, unknown> = {
      type: options.type,
      description: options.description,
    };

    if (options.default !== undefined) {
      property.default = options.default;
    }
    if (options.enum) {
      property.enum = options.enum;
    }
    if (options.items) {
      property.items = options.items;
    }

    this.properties[name] = property;

    if (options.required !== false) {
      this.requiredFields.push(name);
    }

    return this;
  }

  build(): {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  } {
    return {
      type: "object",
      properties: this.properties,
      ...(this.requiredFields.length > 0 && { required: this.requiredFields }),
    };
  }
}
