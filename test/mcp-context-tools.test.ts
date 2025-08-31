// test/mcp-context-tools.test.ts
import Mocha from "mocha";
import { expect } from "chai";
import * as path from "path";
import fs from "fs-extra";
import { MCPWorkflow } from "../src/core/mcp/mcp-workflow.js";

// --- Programmatic Test Runner ---
const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite(
  "MCP Workflow - Simplified Configuration Manager"
);

const testProjectRoot = path.join(
  process.cwd(),
  "test-project-simple-workflow"
);
const cortexDir = path.join(testProjectRoot, ".cortex");
let mcpWorkflow: MCPWorkflow;

suite.beforeEach(async () => {
  // Clean and set up a fresh environment for each test
  await fs.ensureDir(cortexDir);
  mcpWorkflow = new MCPWorkflow(testProjectRoot);
});

suite.afterEach(async () => {
  await fs.remove(testProjectRoot);
});

suite.addTest(
  new Mocha.Test("setConfig should save configuration values", async () => {
    const testKey = "test-setting";
    const testValue = { enabled: true, level: "high" };

    const result = await mcpWorkflow.executeTool("setConfig", {
      key: testKey,
      value: testValue,
    });

    expect(result).to.equal(undefined); // setConfig doesn't return anything

    // Verify the configuration was saved
    const savedValue = await mcpWorkflow.executeTool("getConfig", {
      key: testKey,
    });
    expect(savedValue).to.deep.equal(testValue);
  })
);

suite.addTest(
  new Mocha.Test(
    "getConfig should return saved configuration values",
    async () => {
      const testKey = "project-name";
      const testValue = "Cortex AI";

      // First set a value
      await mcpWorkflow.executeTool("setConfig", {
        key: testKey,
        value: testValue,
      });

      // Then get it back
      const result = await mcpWorkflow.executeTool("getConfig", {
        key: testKey,
      });

      expect(result).to.equal(testValue);
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "getConfig should return null for non-existent keys",
    async () => {
      const result = await mcpWorkflow.executeTool("getConfig", {
        key: "non-existent-key",
      });

      expect(result).to.be.null;
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "experience-recorder should acknowledge recording",
    async () => {
      const result = await mcpWorkflow.executeTool("experience-recorder", {
        action: "user-feedback",
        context: "This is a test feedback",
      });

      expect(result.success).to.be.true;
      expect(result.recorded).to.be.true;
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "executeTool should throw error for unknown tools",
    async () => {
      try {
        await mcpWorkflow.executeTool("unknown-tool", {});
        expect.fail("Should have thrown an error for unknown tool");
      } catch (error: any) {
        expect(error.message).to.include("Unknown tool: unknown-tool");
      }
    }
  )
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
