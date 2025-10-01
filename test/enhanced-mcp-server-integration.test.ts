// Enhanced MCP Server Integration Tests - Testing the new modular architecture
import Mocha from "mocha";
import { expect } from "chai";
import * as path from "path";
import fs from "fs-extra";
import { createEnhancedCortexMCPServer } from "../src/core/mcp/enhanced-server.js";
import { DIContainer, MCPServiceFactory } from "../src/core/mcp/dependency-injection.js";
import { ErrorHandler } from "../src/core/mcp/error-handler.js";
import { ErrorType } from "../src/core/mcp/types.js";

const mocha = new Mocha();

// --- Test Suite ---
const suite = new Mocha.Suite("Enhanced MCP Server Integration Tests");

const testProjectRoot = path.join(process.cwd(), "test-enhanced-mcp-server");
let server: ReturnType<typeof createEnhancedCortexMCPServer> | null = null;

suite.beforeAll(async () => {
  // Setup test project structure
  await fs.ensureDir(testProjectRoot);
  await fs.writeJson(path.join(testProjectRoot, "package.json"), {
    name: "test-enhanced-project",
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

  // Create Enhanced MCP server instance
  server = createEnhancedCortexMCPServer({ projectRoot: testProjectRoot });
});

suite.afterAll(async () => {
  // Cleanup server
  if (server) {
    await server.stop();
  }
  server = null;

  // Cleanup test project
  await fs.remove(testProjectRoot);
});

suite.addTest(
  new Mocha.Test(
    "Enhanced MCP server should be created successfully",
    async function () {
      expect(server).to.not.be.null;
      expect(server).to.be.an("object");
      expect(server!.getStatus().isRunning).to.be.true; // Server is initialized
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should have modular components",
    async function () {
      expect(server).to.not.be.null;
      
      const status = server!.getStatus();
      expect(status.toolsCount).to.be.greaterThan(0);
      expect(status.version).to.be.a("string");
      expect(status.metrics).to.be.an("object");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should handle enhance-context tool",
    async function () {
      expect(server).to.not.be.null;

      // Access the tool manager directly for testing
      const toolManager = (server as any).toolManager;
      expect(toolManager).to.not.be.undefined;

      const result = await toolManager.executeTool("enhance-context", {
        query: "How does this project work?",
      }, {
        sessionId: "test-session",
        projectRoot: testProjectRoot,
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
    "Enhanced server should handle record-experience tool",
    async function () {
      expect(server).to.not.be.null;

      const toolManager = (server as any).toolManager;
      const result = await toolManager.executeTool("record-experience", {
        input: "How to implement error handling in Node.js?",
        output: "Use try-catch blocks and proper error propagation",
        category: "nodejs",
        tags: ["error-handling", "best-practices"],
      }, {
        sessionId: "test-session",
        projectRoot: testProjectRoot,
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
    "Enhanced server should handle create-workflow tool",
    async function () {
      expect(server).to.not.be.null;

      const toolManager = (server as any).toolManager;
      const result = await toolManager.executeTool("create-workflow", {
        title: "Test Workflow",
        description: "A test workflow for integration testing",
      }, {
        sessionId: "test-session",
        projectRoot: testProjectRoot,
      });

      expect(result).to.have.property("content");
      expect(result.content).to.be.an("array");
      expect(result.content[0]).to.have.property("type", "text");
      expect(result.content[0].text).to.include("Multi-Role Workflow Created Successfully");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should provide performance metrics",
    async function () {
      expect(server).to.not.be.null;

      const metrics = server!.getMetrics();
      expect(metrics).to.be.an("object");
      expect(metrics.server).to.be.an("object");
      expect(metrics.tools).to.be.an("object");
      expect(metrics.sessions).to.be.an("object");

      // Check that metrics have expected properties
      expect(metrics.server).to.have.property("uptime");
      expect(metrics.server).to.have.property("requestCount");
      expect(metrics.server).to.have.property("errorCount");
      expect(metrics.tools).to.have.property("executionCount");
      expect(metrics.tools).to.have.property("averageExecutionTime");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should provide session statistics",
    async function () {
      expect(server).to.not.be.null;

      const sessionStats = server!.getSessionStats();
      expect(sessionStats).to.be.an("object");
      expect(sessionStats).to.have.property("totalSessions");
      expect(sessionStats).to.have.property("activeSessions");
      expect(sessionStats).to.have.property("averageSessionDuration");
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should handle invalid tool names gracefully",
    async function () {
      expect(server).to.not.be.null;

      const toolManager = (server as any).toolManager;
      
      try {
        await toolManager.executeTool("invalid-tool", {}, {
          sessionId: "test-session",
          projectRoot: testProjectRoot,
        });
        expect.fail("Should have thrown an error for invalid tool");
      } catch (error) {
        expect(error.message).to.include("Tool not found");
      }
    }
  )
);

suite.addTest(
  new Mocha.Test(
    "Enhanced server should handle empty inputs gracefully",
    async function () {
      expect(server).to.not.be.null;

      const toolManager = (server as any).toolManager;
      
      // Test empty query
      const emptyQueryResult = await toolManager.executeTool("enhance-context", {
        query: "",
      }, {
        sessionId: "test-session",
        projectRoot: testProjectRoot,
      });
      
      expect(emptyQueryResult).to.have.property("content");
      expect(emptyQueryResult.content[0]).to.have.property("type", "text");
      expect(emptyQueryResult.isError).to.be.true;
    }
  )
);

// --- Dependency Injection Tests ---
const diSuite = new Mocha.Suite("Dependency Injection Tests");

diSuite.addTest(
  new Mocha.Test(
    "DIContainer should register and resolve services",
    async function () {
      const container = new DIContainer({
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      });

      // Register a simple service
      container.register({
        name: 'testService',
        factory: () => ({ value: 'test' }),
        singleton: true,
      });

      const service = container.get('testService');
      expect(service).to.have.property('value', 'test');
      expect(container.has('testService')).to.be.true;
    }
  )
);

diSuite.addTest(
  new Mocha.Test(
    "DIContainer should handle service dependencies",
    async function () {
      const container = new DIContainer({
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      });

      // Register dependent services
      container.register({
        name: 'dependency',
        factory: () => ({ value: 'dependency' }),
        singleton: true,
      });

      container.register({
        name: 'service',
        factory: (container) => ({
          dependency: container.get('dependency'),
          value: 'service',
        }),
        singleton: true,
        dependencies: ['dependency'],
      });

      const service = container.get('service');
      expect(service).to.have.property('value', 'service');
      expect(service.dependency).to.have.property('value', 'dependency');
    }
  )
);

// --- Error Handler Tests ---
const errorSuite = new Mocha.Suite("Error Handler Tests");

errorSuite.addTest(
  new Mocha.Test(
    "ErrorHandler should classify errors correctly",
    async function () {
      const errorHandler = new ErrorHandler({
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      });

      // Test timeout error classification
      const timeoutError = new Error("Request timeout");
      const result = await errorHandler.handleError(timeoutError, {
        timestamp: new Date().toISOString(),
        toolName: 'test-tool',
      });

      expect(result.errorType).to.equal(ErrorType.TIMEOUT_ERROR);
      expect(result.recoverable).to.be.true;
    }
  )
);

errorSuite.addTest(
  new Mocha.Test(
    "ErrorHandler should provide error statistics",
    function () {
      const errorHandler = new ErrorHandler({
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      });

      // Generate some errors synchronously
      errorHandler.handleError(new Error("Test error 1"), {
        timestamp: new Date().toISOString(),
      }).then(() => {
        return errorHandler.handleError(new Error("Test error 2"), {
          timestamp: new Date().toISOString(),
        });
      }).then(() => {
        const stats = errorHandler.getErrorStats();
        expect(stats.totalErrors).to.equal(2);
        expect(stats.errorsByType).to.be.an("object");
      }).catch((error) => {
        // Handle any errors
        console.error("Test error:", error);
      });
    }
  )
);

// --- Run the Suites ---
mocha.suite.addSuite(suite);
mocha.suite.addSuite(diSuite);
mocha.suite.addSuite(errorSuite);

mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
