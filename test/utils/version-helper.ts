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
