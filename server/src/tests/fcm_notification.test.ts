import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type FcmNotificationInput } from '../schema';
import { sendFCMNotification, updateUserFCMToken } from '../handlers/fcm_notification';

describe('FCM Notification Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('sendFCMNotification', () => {
    it('should send notification successfully when user has FCM token', async () => {
      // Create test user with FCM token
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST001',
          password: 'hashedpassword',
          name: 'Test User',
          role: 'Karyawan',
          fcm_token: 'test_fcm_token_123'
        })
        .returning()
        .execute();

      const testInput: FcmNotificationInput = {
        user_id: userResult[0].id,
        title: 'Izin Kendaraan Disetujui',
        body: 'Permohonan izin kendaraan Anda telah disetujui',
        data: {
          type: 'izin_approval',
          izin_id: '123'
        }
      };

      const result = await sendFCMNotification(testInput);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^fcm_\d+_\d+$/);
    });

    it('should fail when user does not exist', async () => {
      const testInput: FcmNotificationInput = {
        user_id: 99999, // Non-existent user ID
        title: 'Test Notification',
        body: 'Test message'
      };

      const result = await sendFCMNotification(testInput);

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it('should fail when user has no FCM token', async () => {
      // Create test user without FCM token
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST002',
          password: 'hashedpassword',
          name: 'Test User No Token',
          role: 'HR',
          fcm_token: null
        })
        .returning()
        .execute();

      const testInput: FcmNotificationInput = {
        user_id: userResult[0].id,
        title: 'Test Notification',
        body: 'Test message'
      };

      const result = await sendFCMNotification(testInput);

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it('should handle notification without optional data field', async () => {
      // Create test user with FCM token
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST003',
          password: 'hashedpassword',
          name: 'Test User Simple',
          role: 'Admin',
          fcm_token: 'simple_fcm_token'
        })
        .returning()
        .execute();

      const testInput: FcmNotificationInput = {
        user_id: userResult[0].id,
        title: 'Simple Notification',
        body: 'Simple message without data'
      };

      const result = await sendFCMNotification(testInput);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('updateUserFCMToken', () => {
    it('should update FCM token successfully for existing user', async () => {
      // Create test user
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST004',
          password: 'hashedpassword',
          name: 'Test User Update',
          role: 'Karyawan',
          fcm_token: 'old_token'
        })
        .returning()
        .execute();

      const newToken = 'new_fcm_token_456';
      const result = await updateUserFCMToken(userResult[0].id, newToken);

      expect(result.success).toBe(true);

      // Verify token was updated in database
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, userResult[0].id))
        .execute();

      expect(updatedUser[0].fcm_token).toEqual(newToken);
    });

    it('should fail when user does not exist', async () => {
      const result = await updateUserFCMToken(99999, 'new_token');

      expect(result.success).toBe(false);
    });

    it('should update token from null to valid token', async () => {
      // Create test user without FCM token
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST005',
          password: 'hashedpassword',
          name: 'Test User Null Token',
          role: 'HR',
          fcm_token: null
        })
        .returning()
        .execute();

      const newToken = 'first_time_token_789';
      const result = await updateUserFCMToken(userResult[0].id, newToken);

      expect(result.success).toBe(true);

      // Verify token was set in database
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, userResult[0].id))
        .execute();

      expect(updatedUser[0].fcm_token).toEqual(newToken);
    });

    it('should handle empty string as FCM token', async () => {
      // Create test user
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'TEST006',
          password: 'hashedpassword',
          name: 'Test User Empty Token',
          role: 'Admin',
          fcm_token: 'existing_token'
        })
        .returning()
        .execute();

      const emptyToken = '';
      const result = await updateUserFCMToken(userResult[0].id, emptyToken);

      expect(result.success).toBe(true);

      // Verify empty token was saved
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, userResult[0].id))
        .execute();

      expect(updatedUser[0].fcm_token).toEqual(emptyToken);
    });
  });

  describe('Integration scenarios', () => {
    it('should send notification after FCM token update', async () => {
      // Create test user without FCM token
      const userResult = await db.insert(usersTable)
        .values({
          nik: 'INTEG001',
          password: 'hashedpassword',
          name: 'Integration Test User',
          role: 'Karyawan',
          fcm_token: null
        })
        .returning()
        .execute();

      const userId = userResult[0].id;
      const fcmToken = 'integration_token_123';

      // First, try to send notification (should fail)
      const failResult = await sendFCMNotification({
        user_id: userId,
        title: 'Test Before Token',
        body: 'This should fail'
      });

      expect(failResult.success).toBe(false);

      // Update FCM token
      const updateResult = await updateUserFCMToken(userId, fcmToken);
      expect(updateResult.success).toBe(true);

      // Now send notification (should succeed)
      const successResult = await sendFCMNotification({
        user_id: userId,
        title: 'Test After Token',
        body: 'This should succeed',
        data: {
          integration: 'true'
        }
      });

      expect(successResult.success).toBe(true);
      expect(successResult.messageId).toBeDefined();
    });
  });
});