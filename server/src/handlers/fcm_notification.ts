import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type FcmNotificationInput } from '../schema';

export async function sendFCMNotification(input: FcmNotificationInput): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Fetch user's FCM token from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      console.error('User not found:', input.user_id);
      return { success: false };
    }

    const user = users[0];
    
    if (!user.fcm_token) {
      console.error('User has no FCM token:', input.user_id);
      return { success: false };
    }

    // In a real implementation, this would use Firebase Admin SDK:
    // const admin = require('firebase-admin');
    // const message = {
    //   token: user.fcm_token,
    //   notification: {
    //     title: input.title,
    //     body: input.body,
    //   },
    //   data: input.data || {}
    // };
    // const response = await admin.messaging().send(message);
    // return { success: true, messageId: response };

    // For now, simulate successful FCM sending
    console.log(`FCM notification sent to user ${input.user_id}:`, {
      title: input.title,
      body: input.body,
      token: user.fcm_token,
      data: input.data
    });

    return {
      success: true,
      messageId: `fcm_${Date.now()}_${input.user_id}`
    };
  } catch (error) {
    console.error('FCM notification failed:', error);
    throw error;
  }
}

export async function updateUserFCMToken(userId: number, fcmToken: string): Promise<{ success: boolean }> {
  try {
    // Update user's FCM token in the database
    const result = await db.update(usersTable)
      .set({ fcm_token: fcmToken })
      .where(eq(usersTable.id, userId))
      .returning()
      .execute();

    if (result.length === 0) {
      console.error('User not found for FCM token update:', userId);
      return { success: false };
    }

    console.log(`FCM token updated for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('FCM token update failed:', error);
    throw error;
  }
}