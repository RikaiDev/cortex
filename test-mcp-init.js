#!/usr/bin/env node

/**
 * Test script for MCP init command
 *
 * This script tests the new MCP init functionality
 * Usage: node test-mcp-init.js
 */

import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";

async function testMCPInit() {
  console.log("🧪 Testing MCP Init Command");
  console.log("============================\n");

  const projectRoot = process.cwd();

  // Check if .cortex directory exists before init
  const cortexDirBefore = path.join(projectRoot, ".cortex");
  const existsBefore = await fs.pathExists(cortexDirBefore);

  console.log(
    `📁 .cortex exists before init: ${existsBefore ? "✅ Yes" : "❌ No"}`
  );

  if (existsBefore) {
    console.log("🧹 Cleaning up existing .cortex directory...");
    await fs.remove(cortexDirBefore);
  }

  // Run the init command
  console.log('\n🚀 Running "cortex mcp init"...');

  const initProcess = spawn("npx", ["tsx", "src/cli/index.ts", "mcp", "init"], {
    stdio: "pipe",
    cwd: projectRoot,
  });

  let stdout = "";
  let stderr = "";

  initProcess.stdout.on("data", (data) => {
    stdout += data.toString();
    process.stdout.write(data); // Show live output
  });

  initProcess.stderr.on("data", (data) => {
    stderr += data.toString();
    process.stderr.write(data); // Show live output
  });

  return new Promise((resolve, reject) => {
    initProcess.on("close", async (code) => {
      console.log(`\n📊 Init command exited with code: ${code}`);

      if (code === 0) {
        console.log("\n✅ MCP Init command completed successfully!");

        // Verify the structure was created
        console.log("\n🔍 Verifying created structure:");

        const cortexDir = path.join(projectRoot, ".cortex");
        const workflowsDir = path.join(cortexDir, "workflows");
        const workspacesDir = path.join(cortexDir, "workspaces");
        const rolesDir = path.join(cortexDir, "roles");
        const configFile = path.join(cortexDir, ".cortexrc");

        const checks = [
          { path: cortexDir, name: ".cortex directory" },
          { path: workflowsDir, name: "workflows directory" },
          { path: workspacesDir, name: "workspaces directory" },
          { path: rolesDir, name: "roles directory" },
          { path: configFile, name: ".cortexrc config file" },
        ];

        let allPassed = true;
        for (const check of checks) {
          const exists = await fs.pathExists(check.path);
          console.log(
            `   ${check.name}: ${exists ? "✅ Created" : "❌ Missing"}`
          );
          if (!exists) allPassed = false;
        }

        // Check if role files were copied
        if (await fs.pathExists(rolesDir)) {
          const roleFiles = await fs.readdir(rolesDir);
          console.log(
            `   Role files copied: ${roleFiles.length > 0 ? "✅ Yes" : "❌ No"}`
          );
          if (roleFiles.length > 0) {
            console.log(`   📋 Role files: ${roleFiles.join(", ")}`);
            if (roleFiles.length >= 7) {
              // We expect 7 role files
              console.log("   All expected role files are present");
            } else {
              allPassed = false;
              console.log(
                `   ⚠️  Expected 7 role files, found ${roleFiles.length}`
              );
            }
          } else {
            allPassed = false;
          }
        } else {
          allPassed = false;
          console.log("   ❌ roles directory not found");
        }

        if (allPassed) {
          console.log("\n🎉 All tests passed! MCP Init is working correctly.");
        } else {
          console.log(
            "\n⚠️  Some tests failed. Please check the output above."
          );
        }
      } else {
        console.log("\n❌ MCP Init command failed!");
        console.log("stdout:", stdout);
        console.log("stderr:", stderr);
      }

      resolve(code === 0);
    });

    initProcess.on("error", (error) => {
      console.error("❌ Failed to run init command:", error);
      reject(error);
    });
  });
}

// Run the test
testMCPInit()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
