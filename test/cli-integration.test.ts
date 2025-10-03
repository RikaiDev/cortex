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

    // Test server creation with different project roots
    const server1 = createCortexMCPServer();
    expect(server1).to.be.an("object");
    expect(server1).to.have.property("start");
    expect(server1).to.have.property("stop");

    const server2 = createCortexMCPServer("./test-project");
    expect(server2).to.be.an("object");
  }).timeout(5000)
);

// --- Run the Suite ---
mocha.suite.addSuite(suite);
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
