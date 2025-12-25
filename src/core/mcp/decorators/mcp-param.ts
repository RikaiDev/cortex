/**
 * @MCPParam Decorator
 *
 * Adds metadata to method parameters for schema generation
 * Note: In this codebase, handlers use args objects, so this decorator
 * is primarily for adding additional constraints or overrides
 */

import "reflect-metadata";
import { PARAM_METADATA_KEY, type ParamMetadata } from "./metadata.js";

export interface MCPParamOptions {
  description?: string;
  type?: unknown;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  items?: unknown;
}

/**
 * Decorator for adding metadata to method parameters
 *
 * @example
 * ```typescript
 * async handleMethod(
 *   @MCPParam({ description: 'Custom description' })
 *   args: { taskDescription: string }
 * ): Promise<MCPToolResult> {
 *   // implementation
 * }
 * ```
 */
export function MCPParam(options: MCPParamOptions = {}): ParameterDecorator {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existingParams: ParamMetadata[] =
      Reflect.getOwnMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];

    const paramTypes = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey
    );

    // Get parameter name (requires TypeScript compilation with parameter names preserved)
    const paramName = `param${parameterIndex}`;

    const paramMetadata: ParamMetadata = {
      index: parameterIndex,
      name: paramName,
      description: options.description || "",
      type: options.type || paramTypes?.[parameterIndex],
      required: options.required,
      default: options.default,
      enum: options.enum,
      items: options.items,
    };

    existingParams.push(paramMetadata);

    Reflect.defineMetadata(
      PARAM_METADATA_KEY,
      existingParams,
      target,
      propertyKey
    );
  };
}
