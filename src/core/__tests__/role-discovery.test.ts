import { describe, test, expect } from "bun:test";
import { DynamicRoleDiscovery } from "../role-discovery";

describe("DynamicRoleDiscovery", () => {
  test("should discover roles from docs directory", async () => {
    const discovery = new DynamicRoleDiscovery();
    const roles = await discovery.scanProjectDocs();

    expect(roles).toBeDefined();
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);
  });

  test("should parse role metadata correctly", async () => {
    const discovery = new DynamicRoleDiscovery();
    const roles = await discovery.scanProjectDocs();

    if (roles.length > 0) {
      const role = roles[0];
      expect(role.name).toBeDefined();
      expect(role.description).toBeDefined();
      expect(role.discoveryKeywords).toBeDefined();
      expect(Array.isArray(role.discoveryKeywords)).toBe(true);
    }
  });
});
