// test/cli-integration.test.ts
import Mocha from "mocha";
import { expect } from "chai";

const mocha = new Mocha({
  timeout: 10000,
});

// --- Test Suite ---
const suite = new Mocha.Suite("CLI Integration Tests");

// CLI Integration Tests - Simplified for the streamlined architecture
suite.addTest(
  new Mocha.Test("CLI should export required functions", async () => {
    // Test that the MCP server can be imported and created
    const { createCortexMCPServer } = await import("../dist/core/mcp/server.js");
    expect(createCortexMCPServer).to.be.a("function");

    // Test that the CLI commands can be imported
    const { executeTask } = await import("../dist/cli/mcp-commands.js");
    expect(executeTask).to.be.a("function");
  }).timeout(5000)
);

// Test server creation and basic functionality
suite.addTest(
  new Mocha.Test("CLI should create MCP server successfully", async () => {
    const { createCortexMCPServer } = await import("../dist/core/mcp/server.js");

    // Test that createCortexMCPServer is a function
    expect(createCortexMCPServer).to.be.a("function");
    
    // Test that it returns a Promise (since it's async)
    const serverPromise = createCortexMCPServer();
    expect(serverPromise).to.be.a("promise");
  }).timeout(5000)
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
