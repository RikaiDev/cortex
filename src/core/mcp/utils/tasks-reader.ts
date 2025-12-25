import fs from "fs-extra";
import * as path from "path";

export interface VSCodeTask {
  label: string;
  type: string;
  command: string;
  args?: string[];
  group?: {
    kind: string;
    isDefault?: boolean;
  };
  presentation?: {
    echo?: boolean;
    reveal?: string;
    focus?: boolean;
    panel?: string;
    showReuseMessage?: boolean;
    clear?: boolean;
  };
  problemMatcher?: string[];
  isBackground?: boolean;
}

export interface VSCodeTasksConfig {
  version: string;
  tasks: VSCodeTask[];
}

export class TasksReader {
  constructor(private projectRoot: string) {}

  /**
   * Read and parse .vscode/tasks.json
   */
  async readTasksConfig(): Promise<VSCodeTasksConfig | null> {
    const tasksFile = path.join(this.projectRoot, ".vscode", "tasks.json");

    if (!fs.existsSync(tasksFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(tasksFile, "utf-8");
      return JSON.parse(content) as VSCodeTasksConfig;
    } catch (error) {
      console.error(
        `Failed to read tasks.json: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Get available build tasks
   */
  async getBuildTasks(): Promise<VSCodeTask[]> {
    const config = await this.readTasksConfig();
    if (!config) return [];

    return config.tasks.filter(
      (task) =>
        task.group?.kind === "build" ||
        task.label.toLowerCase().includes("build") ||
        task.command.includes("build")
    );
  }

  /**
   * Get available test tasks
   */
  async getTestTasks(): Promise<VSCodeTask[]> {
    const config = await this.readTasksConfig();
    if (!config) return [];

    return config.tasks.filter(
      (task) =>
        task.group?.kind === "test" ||
        task.label.toLowerCase().includes("test") ||
        task.command.includes("test")
    );
  }

  /**
   * Get default build task
   */
  async getDefaultBuildTask(): Promise<VSCodeTask | null> {
    const buildTasks = await this.getBuildTasks();
    return (
      buildTasks.find((task) => task.group?.isDefault) || buildTasks[0] || null
    );
  }

  /**
   * Get task by label
   */
  async getTaskByLabel(label: string): Promise<VSCodeTask | null> {
    const config = await this.readTasksConfig();
    if (!config) return null;

    return config.tasks.find((task) => task.label === label) || null;
  }

  /**
   * Get all available tasks with their purposes
   */
  async getAllTasks(): Promise<Array<{ task: VSCodeTask; purpose: string }>> {
    const config = await this.readTasksConfig();
    if (!config) return [];

    return config.tasks.map((task) => ({
      task,
      purpose: this.inferTaskPurpose(task),
    }));
  }

  /**
   * Infer task purpose from task configuration
   */
  public inferTaskPurpose(task: VSCodeTask): string {
    const label = task.label.toLowerCase();
    const command = task.command.toLowerCase();
    const args = task.args?.join(" ").toLowerCase() || "";

    if (
      label.includes("build") ||
      command.includes("build") ||
      args.includes("build")
    ) {
      return "Build and compile the project";
    }

    if (
      label.includes("test") ||
      command.includes("test") ||
      args.includes("test")
    ) {
      return "Run tests and validation";
    }

    if (
      label.includes("lint") ||
      command.includes("lint") ||
      args.includes("lint")
    ) {
      return "Check code quality and style";
    }

    if (
      label.includes("start") ||
      command.includes("start") ||
      args.includes("start")
    ) {
      return "Start development server or application";
    }

    if (
      label.includes("dev") ||
      command.includes("dev") ||
      args.includes("dev")
    ) {
      return "Start development environment";
    }

    if (
      label.includes("deploy") ||
      command.includes("deploy") ||
      args.includes("deploy")
    ) {
      return "Deploy application to production";
    }

    if (
      label.includes("quality") ||
      command.includes("quality") ||
      args.includes("quality")
    ) {
      return "Run comprehensive quality checks";
    }

    return `Execute ${task.label} task`;
  }

  /**
   * Generate task execution command
   */
  generateTaskCommand(task: VSCodeTask): string {
    const args = task.args ? ` ${task.args.join(" ")}` : "";
    return `${task.command}${args}`;
  }

  /**
   * Check if project has tasks.json
   */
  async hasTasksConfig(): Promise<boolean> {
    const tasksFile = path.join(this.projectRoot, ".vscode", "tasks.json");
    return fs.existsSync(tasksFile);
  }
}
