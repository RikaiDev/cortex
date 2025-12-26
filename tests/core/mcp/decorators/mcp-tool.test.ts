import { describe, it, expect } from "vitest";
import "reflect-metadata";
import { MCPTool } from "../../../../src/core/mcp/decorators/mcp-tool.js";
import { TOOL_METADATA_KEY } from "../../../../src/core/mcp/decorators/metadata.js";

describe("MCPTool decorator", () => {
  describe("metadata storage", () => {
    it("should store tool metadata on decorated method", () => {
      class TestClass {
        @MCPTool({
          name: "test-tool",
          description: "A test tool",
        })
        testMethod(): void {}
      }

      const metadata = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "testMethod"
      );

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe("test-tool");
      expect(metadata.description).toBe("A test tool");
    });

    it("should store optional category in metadata", () => {
      class TestClass {
        @MCPTool({
          name: "categorized-tool",
          description: "A categorized tool",
          category: "analysis",
        })
        categorizedMethod(): void {}
      }

      const metadata = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "categorizedMethod"
      );

      expect(metadata.category).toBe("analysis");
    });

    it("should not affect methods without decorator", () => {
      class TestClass {
        @MCPTool({
          name: "decorated-tool",
          description: "Decorated",
        })
        decoratedMethod(): void {}

        undecoratedMethod(): void {}
      }

      const decoratedMeta = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "decoratedMethod"
      );

      const undecoratedMeta = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "undecoratedMethod"
      );

      expect(decoratedMeta).toBeDefined();
      expect(undecoratedMeta).toBeUndefined();
    });
  });

  describe("multiple decorators", () => {
    it("should support multiple decorated methods in same class", () => {
      class TestClass {
        @MCPTool({ name: "tool-1", description: "Tool 1" })
        method1(): void {}

        @MCPTool({ name: "tool-2", description: "Tool 2" })
        method2(): void {}

        @MCPTool({ name: "tool-3", description: "Tool 3" })
        method3(): void {}
      }

      const meta1 = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "method1"
      );
      const meta2 = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "method2"
      );
      const meta3 = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        TestClass.prototype,
        "method3"
      );

      expect(meta1.name).toBe("tool-1");
      expect(meta2.name).toBe("tool-2");
      expect(meta3.name).toBe("tool-3");
    });
  });

  describe("inheritance", () => {
    it("should work with class inheritance", () => {
      class BaseClass {
        @MCPTool({ name: "base-tool", description: "Base tool" })
        baseMethod(): void {}
      }

      class DerivedClass extends BaseClass {
        @MCPTool({ name: "derived-tool", description: "Derived tool" })
        derivedMethod(): void {}
      }

      const baseMeta = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        DerivedClass.prototype,
        "baseMethod"
      );
      const derivedMeta = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        DerivedClass.prototype,
        "derivedMethod"
      );

      expect(baseMeta.name).toBe("base-tool");
      expect(derivedMeta.name).toBe("derived-tool");
    });
  });
});
