import { SecurityService } from "@/lib/security-service";
import { SecurityEventType } from "@/lib/generated/prisma";
import type { NextRequest } from "next/server";

/**
 * Helper functions for authentication-related operations
 */
export const authHelpers = {
  /**
   * Log a successful login
   */
  async logSuccessfulLogin(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGIN_SUCCESS,
      request,
    });
  },

  /**
   * Log a failed login attempt
   */
  async logFailedLogin(userId: string, reason: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGIN_FAILED,
      successful: false,
      metadata: { reason },
      request,
    });
  },

  /**
   * Log a logout
   */
  async logLogout(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.LOGOUT,
      request,
    });
  },

  /**
   * Log a password change
   */
  async logPasswordChange(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_CHANGED,
      request,
    });
  },

  /**
   * Log a password reset request
   */
  async logPasswordResetRequest(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
      request,
    });
  },

  /**
   * Log a completed password reset
   */
  async logPasswordResetCompleted(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
      request,
    });
  },

  /**
   * Log an email change
   */
  async logEmailChange(
    userId: string,
    oldEmail: string,
    newEmail: string,
    request?: NextRequest
  ) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.EMAIL_CHANGED,
      metadata: { oldEmail, newEmail },
      request,
    });
  },

  /**
   * Log a profile update
   */
  async logProfileUpdate(
    userId: string,
    updatedFields: string[],
    request?: NextRequest
  ) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.PROFILE_UPDATED,
      metadata: { updatedFields },
      request,
    });
  },

  /**
   * Log settings changes
   */
  async logSettingsChange(
    userId: string,
    changedSettings: string[],
    request?: NextRequest
  ) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.SETTINGS_CHANGED,
      metadata: { changedSettings },
      request,
    });
  },

  /**
   * Log account deletion request
   */
  async logAccountDeletionRequest(
    userId: string,
    reason?: string,
    request?: NextRequest
  ) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_DELETION_REQUESTED,
      metadata: reason ? { reason } : undefined,
      request,
    });
  },

  /**
   * Log account deletion
   */
  async logAccountDeletion(userId: string, request?: NextRequest) {
    return SecurityService.logSecurityEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_DELETED,
      request,
    });
  },

  /**
   * Check for suspicious activity
   */
  async checkForSuspiciousActivity(userId: string, request?: NextRequest) {
    return SecurityService.checkForSuspiciousActivity({
      userId,
      request,
    });
  },
};
