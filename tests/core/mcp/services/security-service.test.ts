import { describe, it, expect, beforeEach } from "vitest";
import { SecurityService } from "../../../../src/core/mcp/services/security-service.js";

describe("SecurityService", () => {
  let service: SecurityService;
  const testProjectRoot = "/tmp/test-project";

  beforeEach(() => {
    service = new SecurityService(testProjectRoot);
  });

  describe("constructor", () => {
    it("should create instance with project root", () => {
      expect(service).toBeInstanceOf(SecurityService);
    });
  });

  describe("calculateEntropy", () => {
    it("should return 0 for single character string", () => {
      const calculate = (service as any).calculateEntropy.bind(service);

      expect(calculate("aaaa")).toBe(0);
      expect(calculate("bbbbbb")).toBe(0);
    });

    it("should return higher entropy for more varied strings", () => {
      const calculate = (service as any).calculateEntropy.bind(service);

      const lowEntropy = calculate("aaabbb");
      const highEntropy = calculate("abc123XYZ");

      expect(highEntropy).toBeGreaterThan(lowEntropy);
    });

    it("should calculate entropy correctly for known values", () => {
      const calculate = (service as any).calculateEntropy.bind(service);

      // "ab" has 1 bit of entropy (2 characters, each appears once)
      const entropy = calculate("ab");
      expect(entropy).toBeCloseTo(1, 5);
    });
  });

  describe("redactSecret", () => {
    it("should fully redact short secrets", () => {
      const redact = (service as any).redactSecret.bind(service);

      expect(redact("short")).toBe("***");
      expect(redact("12345678")).toBe("***");
    });

    it("should partially show longer secrets", () => {
      const redact = (service as any).redactSecret.bind(service);

      const result = redact("this_is_a_long_secret");
      expect(result).toMatch(/^this\*\*\*cret$/);
    });

    it("should preserve first and last 4 characters", () => {
      const redact = (service as any).redactSecret.bind(service);

      const result = redact("AKIA1234567890ABCDEF");
      expect(result.startsWith("AKIA")).toBe(true);
      expect(result.endsWith("CDEF")).toBe(true);
      expect(result).toContain("***");
    });
  });

  describe("getSecretSeverity", () => {
    it("should return critical for AWS credentials", () => {
      const getSeverity = (service as any).getSecretSeverity.bind(service);

      expect(getSeverity("aws-credentials")).toBe("critical");
    });

    it("should return critical for private keys", () => {
      const getSeverity = (service as any).getSecretSeverity.bind(service);

      expect(getSeverity("private-key")).toBe("critical");
    });

    it("should return critical for database URLs", () => {
      const getSeverity = (service as any).getSecretSeverity.bind(service);

      expect(getSeverity("database-url")).toBe("critical");
    });

    it("should return critical for oauth secrets", () => {
      const getSeverity = (service as any).getSecretSeverity.bind(service);

      expect(getSeverity("oauth-secret")).toBe("critical");
    });

    it("should return high for other secret types", () => {
      const getSeverity = (service as any).getSecretSeverity.bind(service);

      expect(getSeverity("api-key")).toBe("high");
      expect(getSeverity("token")).toBe("high");
      expect(getSeverity("password")).toBe("high");
    });
  });

  describe("mapNpmSeverity", () => {
    it("should map npm severities correctly", () => {
      const map = (service as any).mapNpmSeverity.bind(service);

      expect(map("critical")).toBe("critical");
      expect(map("high")).toBe("high");
      expect(map("moderate")).toBe("medium");
      expect(map("low")).toBe("low");
      expect(map("info")).toBe("info");
    });

    it("should be case insensitive", () => {
      const map = (service as any).mapNpmSeverity.bind(service);

      expect(map("CRITICAL")).toBe("critical");
      expect(map("High")).toBe("high");
      expect(map("MODERATE")).toBe("medium");
    });

    it("should default to medium for unknown values", () => {
      const map = (service as any).mapNpmSeverity.bind(service);

      expect(map("unknown")).toBe("medium");
      expect(map("")).toBe("medium");
    });
  });

  describe("severityToNumber", () => {
    it("should order severities correctly", () => {
      const toNumber = (service as any).severityToNumber.bind(service);

      expect(toNumber("info")).toBe(0);
      expect(toNumber("low")).toBe(1);
      expect(toNumber("medium")).toBe(2);
      expect(toNumber("high")).toBe(3);
      expect(toNumber("critical")).toBe(4);
    });

    it("should allow proper severity comparison", () => {
      const toNumber = (service as any).severityToNumber.bind(service);

      expect(toNumber("critical")).toBeGreaterThan(toNumber("high"));
      expect(toNumber("high")).toBeGreaterThan(toNumber("medium"));
      expect(toNumber("medium")).toBeGreaterThan(toNumber("low"));
      expect(toNumber("low")).toBeGreaterThan(toNumber("info"));
    });
  });

  describe("calculateRiskLevel", () => {
    it("should return critical when critical vulnerabilities exist", () => {
      const calculate = (service as any).calculateRiskLevel.bind(service);

      const result = calculate({
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      });

      expect(result).toBe("critical");
    });

    it("should return high when high vulnerabilities exist (no critical)", () => {
      const calculate = (service as any).calculateRiskLevel.bind(service);

      const result = calculate({
        critical: 0,
        high: 5,
        medium: 10,
        low: 20,
        info: 0,
      });

      expect(result).toBe("high");
    });

    it("should return medium when medium vulnerabilities exist (no high/critical)", () => {
      const calculate = (service as any).calculateRiskLevel.bind(service);

      const result = calculate({
        critical: 0,
        high: 0,
        medium: 3,
        low: 5,
        info: 10,
      });

      expect(result).toBe("medium");
    });

    it("should return low when only low vulnerabilities exist", () => {
      const calculate = (service as any).calculateRiskLevel.bind(service);

      const result = calculate({
        critical: 0,
        high: 0,
        medium: 0,
        low: 2,
        info: 0,
      });

      expect(result).toBe("low");
    });

    it("should return none when no vulnerabilities exist", () => {
      const calculate = (service as any).calculateRiskLevel.bind(service);

      const result = calculate({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      });

      expect(result).toBe("none");
    });
  });

  describe("generateScanSummary", () => {
    it("should report no issues when empty", () => {
      const generate = (service as any).generateScanSummary.bind(service);

      const result = generate([], 50);
      expect(result).toContain("50 files");
      expect(result).toContain("No security issues found");
    });

    it("should include critical count when present", () => {
      const generate = (service as any).generateScanSummary.bind(service);

      const issues = [
        { severity: "critical" },
        { severity: "critical" },
        { severity: "high" },
      ];

      const result = generate(issues, 100);
      expect(result).toContain("3 issue(s)");
      expect(result).toContain("2 critical");
    });

    it("should include high count when present", () => {
      const generate = (service as any).generateScanSummary.bind(service);

      const issues = [{ severity: "high" }, { severity: "high" }, { severity: "medium" }];

      const result = generate(issues, 50);
      expect(result).toContain("2 high");
    });
  });

  describe("filterBySeverity", () => {
    it("should filter issues by minimum severity", () => {
      const filter = (service as any).filterBySeverity.bind(service);

      const issues = [
        { severity: "info" },
        { severity: "low" },
        { severity: "medium" },
        { severity: "high" },
        { severity: "critical" },
      ];

      const result = filter(issues, "high");
      expect(result).toHaveLength(2);
      expect(result.every((i: any) => ["high", "critical"].includes(i.severity))).toBe(true);
    });

    it("should return all issues for info minimum", () => {
      const filter = (service as any).filterBySeverity.bind(service);

      const issues = [
        { severity: "info" },
        { severity: "low" },
        { severity: "medium" },
      ];

      const result = filter(issues, "info");
      expect(result).toHaveLength(3);
    });

    it("should return only critical for critical minimum", () => {
      const filter = (service as any).filterBySeverity.bind(service);

      const issues = [
        { severity: "high" },
        { severity: "critical" },
        { severity: "medium" },
      ];

      const result = filter(issues, "critical");
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe("critical");
    });
  });

  describe("filterByConfidence", () => {
    it("should filter secrets by minimum confidence", () => {
      const filter = (service as any).filterByConfidence.bind(service);

      const secrets = [
        { confidence: "low" },
        { confidence: "medium" },
        { confidence: "high" },
      ];

      const result = filter(secrets, "medium");
      expect(result).toHaveLength(2);
      expect(result.every((s: any) => ["medium", "high"].includes(s.confidence))).toBe(true);
    });

    it("should return only high confidence for high minimum", () => {
      const filter = (service as any).filterByConfidence.bind(service);

      const secrets = [
        { confidence: "low" },
        { confidence: "medium" },
        { confidence: "high" },
      ];

      const result = filter(secrets, "high");
      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe("high");
    });
  });

  describe("findHighEntropyStrings", () => {
    it("should find high entropy strings in quotes", () => {
      const find = (service as any).findHighEntropyStrings.bind(service);

      const line = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";';
      const result = find(line, 3.5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].entropy).toBeGreaterThan(3.5);
    });

    it("should return empty for low entropy strings", () => {
      const find = (service as any).findHighEntropyStrings.bind(service);

      const line = 'const name = "aaaaaaaaaaaaaaaaaaaaaa";';
      const result = find(line, 4.5);

      expect(result).toHaveLength(0);
    });

    it("should ignore short strings", () => {
      const find = (service as any).findHighEntropyStrings.bind(service);

      const line = 'const x = "abc123";';
      const result = find(line, 3.0);

      // String is less than 20 chars, should be ignored
      expect(result).toHaveLength(0);
    });
  });

  describe("getLineNumber", () => {
    it("should return correct line number for content", () => {
      const getLine = (service as any).getLineNumber.bind(service);

      const content = "line1\nline2\nline3\nline4";

      expect(getLine(content, 0)).toBe(1); // Start of line 1
      expect(getLine(content, 6)).toBe(2); // Start of line 2
      expect(getLine(content, 12)).toBe(3); // Start of line 3
      expect(getLine(content, 18)).toBe(4); // Start of line 4
    });
  });
});
