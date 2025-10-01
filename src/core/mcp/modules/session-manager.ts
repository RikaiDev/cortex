/**
 * Session Manager - Manages MCP client sessions and state
 *
 * This module handles session lifecycle, state management, and client communication
 */

import { Logger } from "../types.js";

export interface Session {
  id: string;
  clientId: string;
  startTime: Date;
  lastActivity: Date;
  state: SessionState;
  metadata: Record<string, unknown>;
}

export interface SessionState {
  currentWorkflow?: string;
  activeTools: string[];
  userPreferences: Record<string, unknown>;
  context: Record<string, unknown>;
}

export interface SessionManagerConfig {
  sessionTimeout?: number;
  maxSessions?: number;
  enablePersistence?: boolean;
  cleanupInterval?: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private logger: Logger;
  private config: SessionManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(logger: Logger, config: SessionManagerConfig = {}) {
    this.logger = logger;
    this.config = {
      sessionTimeout: 3600000, // 1 hour
      maxSessions: 100,
      enablePersistence: true,
      cleanupInterval: 300000, // 5 minutes
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Create a new session
   */
  createSession(
    clientId: string,
    metadata: Record<string, unknown> = {}
  ): Session {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: Session = {
      id: sessionId,
      clientId,
      startTime: now,
      lastActivity: now,
      state: {
        activeTools: [],
        userPreferences: {},
        context: {},
      },
      metadata,
    };

    this.sessions.set(sessionId, session);
    this.logger.info(`Session created: ${sessionId} for client: ${clientId}`);

    // Check if we need to remove old sessions
    this.enforceMaxSessions();

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Update session state
   */
  updateSessionState(sessionId: string, state: Partial<SessionState>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = { ...session.state, ...state };
      this.updateActivity(sessionId);
      this.logger.debug(`Session state updated: ${sessionId}`);
    }
  }

  /**
   * Add active tool to session
   */
  addActiveTool(sessionId: string, toolName: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.state.activeTools.includes(toolName)) {
      session.state.activeTools.push(toolName);
      this.updateActivity(sessionId);
      this.logger.debug(`Tool ${toolName} added to session: ${sessionId}`);
    }
  }

  /**
   * Remove active tool from session
   */
  removeActiveTool(sessionId: string, toolName: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const index = session.state.activeTools.indexOf(toolName);
      if (index > -1) {
        session.state.activeTools.splice(index, 1);
        this.updateActivity(sessionId);
        this.logger.debug(
          `Tool ${toolName} removed from session: ${sessionId}`
        );
      }
    }
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(
    sessionId: string,
    preferences: Record<string, unknown>
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state.userPreferences = {
        ...session.state.userPreferences,
        ...preferences,
      };
      this.updateActivity(sessionId);
      this.logger.debug(`User preferences updated for session: ${sessionId}`);
    }
  }

  /**
   * Update session context
   */
  updateContext(sessionId: string, context: Record<string, unknown>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state.context = { ...session.state.context, ...context };
      this.updateActivity(sessionId);
      this.logger.debug(`Context updated for session: ${sessionId}`);
    }
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.logger.info(`Session ended: ${sessionId}`);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    averageSessionDuration: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = new Date();

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(
      (session) =>
        now.getTime() - session.lastActivity.getTime() <
        this.config.sessionTimeout!
    ).length;

    const averageSessionDuration =
      sessions.length > 0
        ? sessions.reduce((sum, session) => {
            return sum + (now.getTime() - session.startTime.getTime());
          }, 0) / sessions.length
        : 0;

    return {
      totalSessions,
      activeSessions,
      averageSessionDuration,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup timer for expired sessions
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceActivity > this.config.sessionTimeout!) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.endSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      this.logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Enforce maximum number of sessions
   */
  private enforceMaxSessions(): void {
    if (this.sessions.size > this.config.maxSessions!) {
      // Remove oldest sessions
      const sessions = Array.from(this.sessions.values()).sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      const sessionsToRemove = sessions.slice(
        0,
        this.sessions.size - this.config.maxSessions!
      );
      for (const session of sessionsToRemove) {
        this.endSession(session.id);
      }

      this.logger.info(
        `Removed ${sessionsToRemove.length} old sessions to enforce limit`
      );
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.sessions.clear();
    this.logger.info("Session manager destroyed");
  }
}
