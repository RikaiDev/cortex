/**
 * Simple Preferences Manager - Linus Torvalds' Simplicity Obsession
 *
 * **I am Linus Torvalds**. Complex systems are evil. This is a simple
 * key-value store for user preferences. Nothing fancy, just get/set.
 *
 * If you need complex standards collection, you're doing it wrong.
 * Keep it simple, stupid.
 */

import fs from "fs-extra";
import path from "path";

/**
 * Simple preferences manager - just stores key-value pairs
 */
export class SimplePreferencesManager {
  private preferencesPath: string;

  constructor(projectRoot: string) {
    this.preferencesPath = path.join(
      projectRoot,
      ".cortex",
      "preferences.json"
    );
  }

  /**
   * Get a preference value
   */
  async getPreference(key: string): Promise<unknown> {
    try {
      const prefs = await fs.readJson(this.preferencesPath);
      return prefs[key];
    } catch {
      return null;
    }
  }

  /**
   * Set a preference value
   */
  async setPreference(key: string, value: unknown): Promise<void> {
    try {
      let prefs: Record<string, unknown> = {};
      try {
        prefs = await fs.readJson(this.preferencesPath);
      } catch {
        // Preferences file doesn't exist, that's fine
      }

      prefs[key] = value;
      await fs.ensureDir(path.dirname(this.preferencesPath));
      await fs.writeJson(this.preferencesPath, prefs, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save preference: ${error}`);
    }
  }

  /**
   * Check if preference exists
   */
  async hasPreference(key: string): Promise<boolean> {
    const value = await this.getPreference(key);
    return value !== null;
  }

  /**
   * Delete a preference
   */
  async deletePreference(key: string): Promise<void> {
    try {
      let prefs: Record<string, unknown> = {};
      try {
        prefs = await fs.readJson(this.preferencesPath);
      } catch {
        return; // Nothing to delete
      }

      delete prefs[key];
      await fs.writeJson(this.preferencesPath, prefs, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to delete preference: ${error}`);
    }
  }
}

/**
 * Factory function to create a preferences manager
 */
export function createPreferencesManager(
  projectRoot: string
): SimplePreferencesManager {
  return new SimplePreferencesManager(projectRoot);
}
