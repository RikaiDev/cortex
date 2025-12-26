import { describe, it, expect, beforeEach } from "vitest";
import { ArchitectureService } from "../../../../src/core/mcp/services/architecture-service.js";

describe("ArchitectureService", () => {
  let service: ArchitectureService;
  const testProjectRoot = "/tmp/test-project";

  beforeEach(() => {
    service = new ArchitectureService(testProjectRoot);
  });

  describe("constructor", () => {
    it("should create instance with project root", () => {
      expect(service).toBeInstanceOf(ArchitectureService);
    });
  });

  describe("matchPattern", () => {
    it("should match simple glob patterns", () => {
      const match = (service as any).matchPattern.bind(service);

      expect(match("src/index.ts", "src/*.ts")).toBe(true);
      expect(match("src/index.js", "src/*.ts")).toBe(false);
      expect(match("src/nested/index.ts", "src/*.ts")).toBe(false);
    });

    it("should match double-star patterns for any depth", () => {
      const match = (service as any).matchPattern.bind(service);

      expect(match("src/handlers/test.ts", "**/handlers/**")).toBe(true);
      expect(
        match("core/mcp/handlers/analysis/test-handler.ts", "**/handlers/**")
      ).toBe(true);
      expect(match("src/services/test.ts", "**/handlers/**")).toBe(false);
    });

    it("should match service file patterns", () => {
      const match = (service as any).matchPattern.bind(service);

      expect(
        match("core/mcp/services/test-service.ts", "**/services/**")
      ).toBe(true);
      expect(
        match(
          "core/mcp/services/nested/another-service.ts",
          "**/services/**"
        )
      ).toBe(true);
    });

    it("should handle complex nested paths", () => {
      const match = (service as any).matchPattern.bind(service);

      expect(
        match(
          "core/mcp/handlers/analysis/architecture-handler.ts",
          "**/handlers/**"
        )
      ).toBe(true);
      expect(
        match(
          "core/mcp/handlers/workflow/execution-handler.ts",
          "**/handlers/**"
        )
      ).toBe(true);
    });
  });

  describe("matchGlobPattern", () => {
    it("should match filename patterns", () => {
      const match = (service as any).matchGlobPattern.bind(service);

      expect(match("test-handler.ts", "*-handler.ts")).toBe(true);
      expect(match("architecture-handler.ts", "*-handler.ts")).toBe(true);
      expect(match("handler.ts", "*-handler.ts")).toBe(false);
    });

    it("should match service filename patterns", () => {
      const match = (service as any).matchGlobPattern.bind(service);

      expect(match("code-quality-service.ts", "*-service.ts")).toBe(true);
      expect(match("architecture-service.ts", "*-service.ts")).toBe(true);
      expect(match("service.ts", "*-service.ts")).toBe(false);
    });

    it("should handle dots in extensions correctly", () => {
      const match = (service as any).matchGlobPattern.bind(service);

      expect(match("test.ts", "*.ts")).toBe(true);
      expect(match("test.test.ts", "*.test.ts")).toBe(true);
      expect(match("test.js", "*.ts")).toBe(false);
    });

    it("should match any filename with wildcard", () => {
      const match = (service as any).matchGlobPattern.bind(service);

      expect(match("anything.ts", "*.ts")).toBe(true);
      expect(match("index.ts", "*.ts")).toBe(true);
      expect(match("very-long-name.ts", "*.ts")).toBe(true);
    });
  });

  describe("detectFileType", () => {
    it("should detect service files", () => {
      const detect = (service as any).detectFileType.bind(service);

      expect(detect("code-quality-service.ts")).toBe("service");
      expect(detect("architecture-service.ts")).toBe("service");
    });

    it("should detect handler files", () => {
      const detect = (service as any).detectFileType.bind(service);

      expect(detect("checkpoint-handler.ts")).toBe("handler");
      expect(detect("memory-handler.ts")).toBe("handler");
    });

    it("should detect test files", () => {
      const detect = (service as any).detectFileType.bind(service);

      expect(detect("service.test.ts")).toBe("test");
      expect(detect("handler.spec.ts")).toBe("test");
    });

    it("should detect barrel files", () => {
      const detect = (service as any).detectFileType.bind(service);

      expect(detect("index.ts")).toBe("barrel");
    });

    it("should default to module for unknown types", () => {
      const detect = (service as any).detectFileType.bind(service);

      expect(detect("random-file.ts")).toBe("module");
    });
  });
});
