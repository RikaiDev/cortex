// MCP Server Integration Tests - Protocol and Response Format Validation
import Mocha from "mocha";
import { expect } from "chai";
import * as path from "path";
import fs from "fs-extra";
import { createMCPServer } from "../src/core/mcp/server.js";

const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite("MCP Server Integration Tests");

const testProjectRoot = path.join(process.cwd(), "test-mcp-server");
let server: ReturnType<typeof createMCPServer> | null = null;

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
  server = createMCPServer(testProjectRoot);
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
    "natural-language-query tool should return correct MCP format",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleNaturalLanguageQuery({
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
    "project-context tool should return project information",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleProjectContext({
        includeFiles: true,
        includeDependencies: true,
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0]).to.have.property("text");
      expect(result.content[0].text).to.include("Project Structure");
      expect(result.content[0].text).to.include("Dependencies");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "experience-search tool should handle queries",
    async function () {
      expect(server).to.not.be.null;

      const result = await server!.handleExperienceSearch({
        query: "test",
        limit: 3,
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
  new Mocha.Test("code-diagnostic tool should analyze code", async function () {
    expect(server).to.not.be.null;

    const result = await server!.handleCodeDiagnostic({
      filePath: "test.js",
      issueType: "syntax",
    });

    expect(result).to.have.property("content");
    expect(result.content).to.be.an("array");
    expect(result.content[0]).to.have.property("type", "text");
    expect(result.content[0].text).to.include("Code Analysis");
  })
);

suite.addTest(
  new Mocha.Test(
    "MCP tools should handle empty or invalid inputs gracefully",
    async function () {
      expect(server).to.not.be.null;

      // Test empty query
      const emptyQueryResult = await server!.handleNaturalLanguageQuery({
        query: "",
      });
      expect(emptyQueryResult).to.have.property("content");
      expect(emptyQueryResult.content[0]).to.have.property("type", "text");

      // Test invalid file path
      const invalidFileResult = await server!.handleCodeDiagnostic({
        filePath: "nonexistent.js",
        issueType: "syntax",
      });
      expect(invalidFileResult).to.have.property("content");
      expect(invalidFileResult.content[0]).to.have.property("type", "text");
    }
  )
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
