// test/utils/version-helper.ts
import fs from "fs-extra";
import * as path from "path";

/**
 * Get the current version from package.json
 */
export function getCurrentVersion(): string {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);
  return packageJson.version;
}

/**
 * Check if a string matches semver format
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version.trim());
}

/**
 * Compare two semver versions
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
} 