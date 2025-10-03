#!/usr/bin/env node

/**
 * Integrated Multi-Role Pattern Demo Script
 *
 * This script demonstrates how to use the Multi-Role Pattern system
 * integrated with the existing Cortex AI architecture
 *
 * Prerequisites:
 * 1. Run 'cortex mcp init' to initialize the workspace
 * 2. Run 'cortex mcp start' to start the MCP server
 *
 * Usage: node examples/integrated-multi-role-demo.js
 */

import { CortexCore } from "../src/core/index.js";
import { WorkflowManager } from "../src/core/workflow-integration.js";

async function main() {
  console.log("🚀 Integrated Multi-Role Pattern Demo");
  console.log("=====================================\n");

  console.log("💡 Prerequisites check:");
  console.log('   1. Run "cortex mcp init" to initialize workspace');
  console.log('   2. Run "cortex mcp start" to start MCP server');
  console.log();

  // Initialize Cortex core and workflow manager
  const cortex = new CortexCore(process.cwd());
  const workflowManager = new WorkflowManager(cortex, process.cwd());

  try {
    // Create a sample workflow using the integrated system
    console.log("📋 Creating workflow for sample issue...\n");
    const workflow = await workflowManager.createWorkflow(
      "demo-001",
      "Implement user authentication system",
      "Create a complete user authentication system with registration, login, and password reset functionality. The system should include proper security measures and be integrated with the existing user management module."
    );

    console.log(`✅ Workflow created: ${workflow.id}`);
    console.log(`📊 Initial status: ${workflow.status}`);
    console.log(`👥 Starting role: ${workflow.currentRole}\n`);

    // Execute workflow steps using the integrated system
    let stepCount = 0;
    const maxSteps = 5; // Limit to prevent infinite loops

    while (stepCount < maxSteps) {
      stepCount++;
      console.log(`🎭 Executing workflow step ${stepCount}...`);

      try {
        const execution = await workflowManager.executeWorkflowStep(
          workflow.id
        );

        console.log(`✅ Role ${execution.roleId} completed successfully`);
        console.log(`📄 Deliverables: ${execution.deliverables.join(", ")}`);

        if (execution.output) {
          console.log(
            `📝 Output preview: ${execution.output.substring(0, 100)}...`
          );
        }

        // Check if workflow is completed
        const currentWorkflow = await workflowManager.getWorkflowState(
          workflow.id
        );
        if (currentWorkflow.status === "completed") {
          console.log("\n🎉 Workflow completed!");
          break;
        }

        console.log(`📊 Next role: ${currentWorkflow.currentRole}\n`);
      } catch (error) {
        console.log(`❌ Workflow step failed: ${error.message}`);
        break;
      }
    }

    // Show final workflow status
    const finalWorkflow = await workflowManager.getWorkflowState(workflow.id);
    console.log("📊 Final workflow status:");
    console.log(`   - Status: ${finalWorkflow.status}`);
    console.log(`   - Roles executed: ${finalWorkflow.executions.length}`);
    console.log(
      `   - Total deliverables: ${finalWorkflow.executions.flatMap((e) => e.deliverables).length}`
    );

    // Get workspace information
    const workspaceInfo = await workflowManager.getWorkspaceInfo(workflow.id);
    console.log(`   - Workspace ID: ${workspaceInfo?.id}`);

    if (workspaceInfo) {
      console.log(`\n📁 Generated workspace files:`);
      console.log(`   - Workspace: .cortex/workspaces/${workspaceInfo.id}/`);
      console.log(`   - handoff.md: ${workspaceInfo.handoffFile}`);
      console.log(`   - pr.md: ${workspaceInfo.prFile}`);

      // Check if files were generated
      const fs = await import("fs-extra");
      const handoffExists = await fs.pathExists(workspaceInfo.handoffFile);
      const prExists = await fs.pathExists(workspaceInfo.prFile);

      console.log(`\n📁 File generation status:`);
      console.log(
        `   - handoff.md: ${handoffExists ? "✅ Generated" : "❌ Missing"}`
      );
      console.log(`   - pr.md: ${prExists ? "✅ Generated" : "❌ Missing"}`);

      if (handoffExists) {
        console.log("\n📖 Handoff file preview:");
        const handoffContent = await fs.readFile(
          workspaceInfo.handoffFile,
          "utf-8"
        );
        console.log(handoffContent.substring(0, 200) + "...");
      }

      if (prExists) {
        console.log("\n📋 PR file preview:");
        const prContent = await fs.readFile(workspaceInfo.prFile, "utf-8");
        console.log(prContent.substring(0, 200) + "...");
      }

      // Show workspace directory structure
      console.log("\n📂 Workspace structure:");
      console.log(`   .cortex/`);
      console.log(`   ├── workflows/          # Workflow state files`);
      console.log(`   │   └── ${workflow.id}.json`);
      console.log(`   ├── workspaces/         # Individual workspace folders`);
      console.log(`   │   └── ${workspaceInfo.id}/`);
      console.log(`   │       ├── handoff.md`);
      console.log(`   │       └── pr.md`);
      console.log(`   └── roles/             # Role definitions`);
    }

    // List all workspaces
    console.log("\n📋 All workspaces:");
    const allWorkspaces = await workflowManager.listWorkspaces();
    if (allWorkspaces.length > 0) {
      allWorkspaces.forEach((ws, index) => {
        console.log(`   ${index + 1}. ${ws.id} (${ws.workflowId})`);
      });
    } else {
      console.log("   No workspaces found");
    }

    // Demonstrate experience learning integration
    console.log("\n🧠 Experience Learning Integration:");
    const relevantExperiences = await cortex.findRelevantExperiences(
      "Multi-Role workflow execution",
      3,
      30
    );

    console.log(
      `Found ${relevantExperiences.length} related experiences in the system`
    );
    relevantExperiences.forEach((exp, index) => {
      console.log(
        `  ${index + 1}. ${exp.category}: ${exp.input.substring(0, 50)}...`
      );
    });
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run demo
main().catch(console.error);
