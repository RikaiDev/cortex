// test/mcp-context-tools.test.ts
import Mocha from "mocha";
import { expect } from "chai";
import * as path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import { MCPWorkflow } from "../src/core/mcp/mcp-workflow.js";
import { createMCPContextTools } from "../src/core/mcp/mcp-context-tools.js";

// --- Programmatic Test Runner ---
const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite("MCP Context Tools - The Content Pump");

const testProjectRoot = path.join(process.cwd(), "test-project-context-pump");
const experiencesDir = path.join(testProjectRoot, "docs", "experiences");
let mcpWorkflow: MCPWorkflow;

suite.beforeEach(async () => {
  // Clean and set up a fresh environment for each test
  await fs.ensureDir(experiencesDir);
  mcpWorkflow = new MCPWorkflow(testProjectRoot);
  // Note: The file is still named mcp-thinking-tools, but the class is MCPContextTools
  createMCPContextTools(mcpWorkflow, testProjectRoot);
});

suite.afterEach(async () => {
  await fs.remove(testProjectRoot);
});

suite.addTest(
  new Mocha.Test(
    "experience-recorder should create a new experience file",
    async () => {
      const userFeedback = {
        userInput: "How to add a new user?",
        correction: "Use the `addUser` function in `userService`.",
      };

      const result = await mcpWorkflow.executeTool("experience-recorder", {
        context: userFeedback,
      });
      expect(result.success).to.be.true;

      // Verify that the file was actually created
      const files = await fs.readdir(experiencesDir);
      expect(files).to.have.lengthOf(1);

      const savedContent = await fs.readJson(
        path.join(experiencesDir, files[0])
      );
      expect(savedContent.userInput).to.equal(userFeedback.userInput);
      expect(savedContent.correction).to.equal(userFeedback.correction);
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "context-enhancer should return 'no experiences' message when the directory is empty",
    async () => {
      const result = await mcpWorkflow.executeTool("context-enhancer", {});
      expect(result.success).to.be.true;
      expect(result.output).to.include(
        "<!-- No experiences found in the library. -->"
      );
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "context-enhancer should combine multiple experiences into a single string",
    async () => {
      // 1. Create two mock experience files using the recorder
      await mcpWorkflow.executeTool("experience-recorder", {
        context: { userInput: "Experience One" },
      });
      await mcpWorkflow.executeTool("experience-recorder", {
        context: { userInput: "Experience Two" },
      });

      // 2. Run the enhancer
      const result = await mcpWorkflow.executeTool("context-enhancer", {});
      expect(result.success).to.be.true;

      // 3. Verify the output
      expect(result.output).to.include("--- Experience Start");
      expect(result.output).to.include("Experience One");
      expect(result.output).to.include("Experience Two");
      expect(result.output).to.include("--- Experience End ---");

      const occurrences = (result.output.match(/--- Experience Start/g) || [])
        .length;
      expect(occurrences).to.equal(2);
    }
  )
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
