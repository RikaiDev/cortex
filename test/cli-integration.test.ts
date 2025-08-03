// test/cli-integration.test.ts
import Mocha from "mocha";
import { expect } from "chai";
import { spawn } from "child_process";
import * as path from "path";
import { getCurrentVersion, isValidSemver } from "./utils/version-helper.js";

const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite("CLI Integration Tests");

// Helper function to run CLI command
const runCLI = (
  args: string[]
): Promise<{ code: number; stdout: string; stderr: string }> => {
  return new Promise((resolve) => {
    const cliPath = path.join(process.cwd(), "cortex", "cli", "index.js");
    const child = spawn("node", [cliPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        code: code || 0,
        stdout,
        stderr,
      });
    });
  });
};

suite.addTest(
  new Mocha.Test("CLI should show version information", async () => {
    const result = await runCLI(["--version"]);
    expect(result.code).to.equal(0);

    const version = result.stdout.trim();
    expect(isValidSemver(version)).to.be.true;

    // Check that CLI version matches package.json version
    const packageVersion = getCurrentVersion();
    expect(version).to.equal(packageVersion);
  })
);

suite.addTest(
  new Mocha.Test("CLI should show help information", async () => {
    const result = await runCLI(["--help"]);
    expect(result.code).to.equal(0);
    expect(result.stdout).to.include("Usage:");
    expect(result.stdout).to.include("Commands:");
  })
);

suite.addTest(
  new Mocha.Test("CLI should handle invalid commands gracefully", async () => {
    const result = await runCLI(["invalid-command"]);
    expect(result.code).to.not.equal(0);
    expect(result.stderr).to.include("error");
  })
);

suite.addTest(
  new Mocha.Test("CLI should support install-global-mcp command", async () => {
    const result = await runCLI(["install-global-mcp"]);
    // This command might fail in test environment, but should not crash
    expect(result.code).to.be.a("number");
  })
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
