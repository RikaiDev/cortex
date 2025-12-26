import { describe, it, expect, beforeEach } from "vitest";
import { CodeQualityService } from "../../../../src/core/mcp/services/code-quality-service.js";

describe("CodeQualityService", () => {
  let service: CodeQualityService;
  const testProjectRoot = "/tmp/test-project";

  beforeEach(() => {
    service = new CodeQualityService(testProjectRoot);
  });

  describe("constructor", () => {
    it("should create instance with project root", () => {
      expect(service).toBeInstanceOf(CodeQualityService);
    });
  });

  describe("scoring algorithm", () => {
    it("should return 100 for empty codebase", async () => {
      // Access private method via any cast for testing
      const calculateScore = (service as any).calculateOverallScore.bind(
        service
      );
      const score = calculateScore([], [], [], 0);
      expect(score).toBe(100);
    });

    it("should calculate density-based score", async () => {
      const calculateScore = (service as any).calculateOverallScore.bind(
        service
      );

      // Simulate 1000 lines with some smells
      const smells = [
        { severity: "critical" },
        { severity: "major" },
        { severity: "minor" },
        { severity: "info" },
      ];

      const score = calculateScore([{ file: "test.ts" }], smells, [], 1000);

      // Score should be between 0 and 100
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);

      // With only 4 smells in 1000 lines, score should be high
      expect(score).toBeGreaterThan(80);
    });

    it("should weight critical smells higher than info", async () => {
      const calculateScore = (service as any).calculateOverallScore.bind(
        service
      );

      // 10 critical smells
      const criticalSmells = Array(10).fill({ severity: "critical" });
      const criticalScore = calculateScore(
        [{ file: "test.ts" }],
        criticalSmells,
        [],
        1000
      );

      // 10 info smells
      const infoSmells = Array(10).fill({ severity: "info" });
      const infoScore = calculateScore(
        [{ file: "test.ts" }],
        infoSmells,
        [],
        1000
      );

      // Critical smells should result in lower score
      expect(criticalScore).toBeLessThan(infoScore);
    });

    it("should scale with codebase size", async () => {
      const calculateScore = (service as any).calculateOverallScore.bind(
        service
      );

      // Same number of smells, different codebase sizes
      const smells = Array(50).fill({ severity: "major" });

      const smallCodebaseScore = calculateScore(
        [{ file: "test.ts" }],
        smells,
        [],
        1000
      );

      const largeCodebaseScore = calculateScore(
        [{ file: "test.ts" }],
        smells,
        [],
        10000
      );

      // Larger codebase should have higher score (lower density)
      expect(largeCodebaseScore).toBeGreaterThan(smallCodebaseScore);
    });
  });

  describe("scoreToGrade", () => {
    it("should return A for scores >= 90", () => {
      const toGrade = (service as any).scoreToGrade.bind(service);
      expect(toGrade(90)).toBe("A");
      expect(toGrade(95)).toBe("A");
      expect(toGrade(100)).toBe("A");
    });

    it("should return B for scores >= 80", () => {
      const toGrade = (service as any).scoreToGrade.bind(service);
      expect(toGrade(80)).toBe("B");
      expect(toGrade(85)).toBe("B");
      expect(toGrade(89)).toBe("B");
    });

    it("should return C for scores >= 70", () => {
      const toGrade = (service as any).scoreToGrade.bind(service);
      expect(toGrade(70)).toBe("C");
      expect(toGrade(75)).toBe("C");
      expect(toGrade(79)).toBe("C");
    });

    it("should return D for scores >= 60", () => {
      const toGrade = (service as any).scoreToGrade.bind(service);
      expect(toGrade(60)).toBe("D");
      expect(toGrade(65)).toBe("D");
      expect(toGrade(69)).toBe("D");
    });

    it("should return F for scores < 60", () => {
      const toGrade = (service as any).scoreToGrade.bind(service);
      expect(toGrade(59)).toBe("F");
      expect(toGrade(30)).toBe("F");
      expect(toGrade(0)).toBe("F");
    });
  });

});

