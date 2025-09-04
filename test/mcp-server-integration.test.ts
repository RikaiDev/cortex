// MCP Server Integration Tests - Protocol and Response Format Validation
import Mocha from "mocha";
import { expect } from "chai";
import * as path from "path";
import fs from "fs-extra";
import { createCortexMCPServer } from "../src/core/mcp/server.js";

const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite("MCP Server Integration Tests");

const testProjectRoot = path.join(process.cwd(), "test-mcp-server");
let server: ReturnType<typeof createCortexMCPServer> | null = null;

suite.beforeAll(async () => {
  // Setup test project structure
  await fs.ensureDir(testProjectRoot);
  await fs.writeJson(path.join(testProjectRoot, "package.json"), {
    name: "test-project",
    version: "1.0.0",
    dependencies: {
      express: "^4.18.0",
      "@modelcontextprotocol/sdk": "^1.17.1",
    },
  });

  // Create a simple test file
  await fs.writeFile(
    path.join(testProjectRoot, "test.js"),
    `
function hello() {
  console.log("Hello World");
  return "test";
}
    `.trim()
  );

  // Create MCP server instance
  server = createCortexMCPServer(testProjectRoot);
});

suite.afterAll(async () => {
  // Cleanup server
  server = null;

  // Cleanup test project
  await fs.remove(testProjectRoot);
});

suite.addTest(
  new Mocha.Test(
    "MCP server should be created successfully",
    async function () {
      expect(server).to.not.be.null;
      expect(server).to.be.an("object");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "handleEnhanceContext should process natural language queries",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleEnhanceContext({
        query: "How does this project work?",
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0]).to.have.property("text");
      expect(result.content[0].text).to.be.a("string");
      expect(result.content[0].text.length).to.be.greaterThan(0);
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "handleEnhanceContext should handle project analysis queries",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleEnhanceContext({
        query: "What is the project structure and dependencies?",
        maxItems: 5,
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0]).to.have.property("text");
      expect(result.content[0].text.length).to.be.greaterThan(0);
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "handleEnhanceContext should handle experience-based queries",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleEnhanceContext({
        query: "Search for experiences related to testing",
        maxItems: 3,
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0]).to.have.property("text");
      // May or may not find experiences, but should not crash
    }
  )
);

suite.addTest(
  new Mocha.Test("handleEnhanceContext should analyze code", async function () {
    expect(server).to.not.be.null;

    const result = await server!.handleEnhanceContext({
      query: "Analyze this JavaScript code for issues: " +
             "function hello() { console.log('Hello World'); return 'test'; }",
      maxItems: 3,
    });

    expect(result).to.have.property("content");
    expect(result.content).to.be.an("array");
    expect(result.content[0]).to.have.property("type", "text");
    expect(result.content[0].text.length).to.be.greaterThan(0);
  })
);

suite.addTest(
  new Mocha.Test(
    "handleRecordExperience should record experiences successfully",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleRecordExperience({
        input: "How to implement error handling in Node.js?",
        output: "Use try-catch blocks and proper error propagation",
        category: "nodejs",
        tags: ["error-handling", "best-practices"],
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0].text).to.include("recorded successfully");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "MCP tools should handle empty or invalid inputs gracefully",
    async function () {
      expect(server).to.not.be.null;

      // Test empty query
      const emptyQueryResult = await server!.handleEnhanceContext({
        query: "",
      });
      expect(emptyQueryResult).to.have.property("content");
      expect(emptyQueryResult.content[0]).to.have.property("type", "text");

      // Test whitespace-only query
      const whitespaceResult = await server!.handleEnhanceContext({
        query: "   ",
      });
      expect(whitespaceResult).to.have.property("content");
      expect(whitespaceResult.content[0]).to.have.property("type", "text");
    }
  )
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
