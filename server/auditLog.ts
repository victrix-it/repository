import { db } from "./db";
import { auditLogs, failedLoginAttempts, userSessions } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Request } from "express";

// ISO 27001 Compliance - Audit Logging Module

interface AuditLogParams {
  eventType: string;
  userId?: string;
  username?: string;
  success: boolean;
  reason?: string;
  metadata?: any;
  req?: Request | any;
}

/**
 * Create an audit log entry for ISO 27001 compliance
 */
export async function createAuditLog(params: AuditLogParams) {
  const {
    eventType,
    userId,
    username,
    success,
    reason,
    metadata,
    req
  } = params;

  try {
    const ipAddress = req ? getClientIp(req) : undefined;
    const userAgent = req ? req.get('user-agent') : undefined;

    await db.insert(auditLogs).values({
      eventType: eventType as any,
      userId: userId || null,
      username: username || null,
      ipAddress,
      userAgent,
      success: success ? 'true' : 'false',
      reason: reason || null,
      metadata: metadata || null,
    });

    console.log(`[AUDIT] ${eventType} - User: ${username || userId || 'unknown'} - Success: ${success}`);
  } catch (error) {
    console.error('[AUDIT] Failed to create audit log:', error);
    // Don't throw - audit logging failure shouldn't break the app
  }
}

/**
 * Get client IP address from request (handles proxies)
 */
function getClientIp(req: Request | any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

/**
 * Check if account is locked out due to failed login attempts
 * ISO 27001 Control A.5.17 - Authentication Information
 */
export async function checkAccountLockout(username: string): Promise<{
  isLocked: boolean;
  remainingTime?: number;
  message?: string;
}> {
  try {
    const [attempt] = await db
      .select()
      .from(failedLoginAttempts)
      .where(eq(failedLoginAttempts.username, username))
      .limit(1);

    if (!attempt) {
      return { isLocked: false };
    }

    // Check if account is currently locked
    if (attempt.lockedUntil) {
      const now = new Date();
      const lockExpiry = new Date(attempt.lockedUntil);

      if (now < lockExpiry) {
        const remainingMs = lockExpiry.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        return {
          isLocked: true,
          remainingTime: remainingMinutes,
          message: `Account locked. Try again in ${remainingMinutes} minute(s).`
        };
      } else {
        // Lock expired, reset attempt count
        await db
          .update(failedLoginAttempts)
          .set({
            attemptCount: 0,
            lockedUntil: null,
            lastAttemptAt: new Date(),
          })
          .where(eq(failedLoginAttempts.username, username));
        
        return { isLocked: false };
      }
    }

    return { isLocked: false };
  } catch (error) {
    console.error('[AUDIT] Error checking account lockout:', error);
    return { isLocked: false }; // Fail open to not block legitimate users
  }
}

/**
 * Record failed login attempt and implement account lockout
 * ISO 27001 Control A.5.17 - Authentication Information
 * 
 * Lockout policy: 5 failed attempts = 15 minute lockout
 */
export async function recordFailedLoginAttempt(username: string, ipAddress?: string) {
  try {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MINUTES = 15;

    const [existing] = await db
      .select()
      .from(failedLoginAttempts)
      .where(eq(failedLoginAttempts.username, username))
      .limit(1);

    if (existing) {
      const newCount = existing.attemptCount + 1;
      let lockedUntil = existing.lockedUntil;

      // Lock account if threshold exceeded
      if (newCount >= MAX_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        console.log(`[SECURITY] Account locked: ${username} - ${newCount} failed attempts`);
      }

      await db
        .update(failedLoginAttempts)
        .set({
          attemptCount: newCount,
          lockedUntil,
          ipAddress: ipAddress || existing.ipAddress,
          lastAttemptAt: new Date(),
        })
        .where(eq(failedLoginAttempts.username, username));
    } else {
      // First failed attempt
      await db.insert(failedLoginAttempts).values({
        username,
        ipAddress,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[AUDIT] Error recording failed login attempt:', error);
  }
}

/**
 * Clear failed login attempts on successful login
 */
export async function clearFailedLoginAttempts(username: string) {
  try {
    await db
      .delete(failedLoginAttempts)
      .where(eq(failedLoginAttempts.username, username));
  } catch (error) {
    console.error('[AUDIT] Error clearing failed login attempts:', error);
  }
}

/**
 * Create user session tracking entry
 * ISO 27001 Control A.8.5 - Secure Authentication
 */
export async function createUserSession(params: {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(userSessions).values({
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      isActive: 'true',
    });
  } catch (error) {
    console.error('[AUDIT] Error creating user session:', error);
  }
}

/**
 * End user session
 */
export async function endUserSession(sessionId: string) {
  try {
    await db
      .update(userSessions)
      .set({
        logoutAt: new Date(),
        isActive: 'false',
      })
      .where(eq(userSessions.sessionId, sessionId));
  } catch (error) {
    console.error('[AUDIT] Error ending user session:', error);
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
  try {
    await db
      .update(userSessions)
      .set({
        lastActivityAt: new Date(),
      })
      .where(eq(userSessions.sessionId, sessionId));
  } catch (error) {
    console.error('[AUDIT] Error updating session activity:', error);
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  try {
    return await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, 'true')
        )
      );
  } catch (error) {
    console.error('[AUDIT] Error getting user sessions:', error);
    return [];
  }
}

/**
 * Force terminate user session (admin action)
 * ISO 27001 Control A.5.18 - Access Rights
 */
export async function terminateUserSession(sessionId: string, terminatedBy: string) {
  try {
    await endUserSession(sessionId);
    
    await createAuditLog({
      eventType: 'session_terminated',
      userId: terminatedBy,
      success: true,
      reason: `Session ${sessionId} terminated by administrator`,
      metadata: { sessionId },
    });
  } catch (error) {
    console.error('[AUDIT] Error terminating user session:', error);
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(params: {
  userId?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = db.select().from(auditLogs);

    if (params.userId) {
      query = query.where(eq(auditLogs.userId, params.userId)) as any;
    }

    if (params.eventType) {
      query = query.where(eq(auditLogs.eventType, params.eventType as any)) as any;
    }

    const logs = await query
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(params.limit || 100)
      .offset(params.offset || 0);

    return logs;
  } catch (error) {
    console.error('[AUDIT] Error fetching audit logs:', error);
    return [];
  }
}
